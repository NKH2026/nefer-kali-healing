/**
 * Backfill missing orders from Stripe into Supabase.
 *
 * Run with:
 *   STRIPE_SECRET_KEY=sk_live_... \
 *   SUPABASE_URL=https://your-project.supabase.co \
 *   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key \
 *   node scripts/backfill-stripe-orders.js
 *
 * Or temporarily add those values to a .env file and run:
 *   node --env-file=.env scripts/backfill-stripe-orders.js
 *
 * This script is idempotent — it skips orders that already exist
 * (matched by stripe_checkout_session_id).
 */

import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// How many days back to look for completed checkouts
const DAYS_BACK = 90;

if (!stripeSecretKey || !supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables:');
  console.error('  STRIPE_SECRET_KEY');
  console.error('  SUPABASE_URL (or VITE_SUPABASE_URL)');
  console.error('  SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const stripe = new Stripe(stripeSecretKey, { apiVersion: '2023-10-16' });
const supabase = createClient(supabaseUrl, supabaseServiceKey);

function getBillingInterval(subscription) {
  const interval = subscription?.items?.data?.[0]?.price?.recurring?.interval;
  const intervalCount = subscription?.items?.data?.[0]?.price?.recurring?.interval_count || 1;

  if (interval === 'week' && intervalCount === 2) return 'every-2-weeks';
  if (interval === 'month' && intervalCount === 1) return 'monthly';
  if (interval === 'month' && intervalCount === 3) return 'every-3-months';
  return 'monthly';
}

async function backfill() {
  const since = Math.floor(Date.now() / 1000) - DAYS_BACK * 24 * 60 * 60;

  console.log(`Fetching completed checkout sessions from the last ${DAYS_BACK} days...`);

  const sessions = [];
  for await (const session of stripe.checkout.sessions.list({
    limit: 100,
    status: 'complete',
    created: { gte: since },
    expand: ['data.customer', 'data.subscription'],
  })) {
    sessions.push(session);
  }

  console.log(`Found ${sessions.length} completed checkout sessions.`);

  let created = 0;
  let skipped = 0;
  let errors = 0;

  for (const session of sessions) {
    try {
      // Idempotency check
      const { data: existingOrder } = await supabase
        .from('orders')
        .select('id, order_number')
        .eq('stripe_checkout_session_id', session.id)
        .maybeSingle();

      if (existingOrder) {
        console.log(`Skipping existing order ${existingOrder.order_number} for session ${session.id}`);
        skipped++;
        continue;
      }

      // Fetch line items with product metadata
      const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
        expand: ['data.price.product'],
      });

      const shipping = session.shipping_details;
      const customer = session.customer_details;

      // Build order items
      const orderItems = lineItems.data.map((item) => {
        const product = item.price?.product;
        return {
          product_id: product?.metadata?.product_id || null,
          variant_id: product?.metadata?.variant_id || null,
          product_title: item.description || product?.name || 'Unknown Product',
          variant_title: product?.metadata?.variant_title || null,
          sku: product?.metadata?.sku || null,
          image_url: product?.images?.[0] || null,
          quantity: item.quantity || 1,
          unit_price: (item.price?.unit_amount || 0) / 100,
          total_price: (item.amount_total || 0) / 100,
          is_subscription: session.mode === 'subscription',
        };
      });

      // Look up product digital flags
      const productIds = orderItems.map(item => item.product_id).filter(Boolean);
      let productsMap = new Map();
      if (productIds.length > 0) {
        const { data: productsData } = await supabase
          .from('products')
          .select('id, is_digital, digital_asset_url, digital_asset_url_printable')
          .in('id', productIds);
        productsMap = new Map(productsData?.map(p => [p.id, p]) || []);
      }

      const enhancedOrderItems = orderItems.map(item => {
        const product = item.product_id ? productsMap.get(item.product_id) : null;
        return {
          ...item,
          is_digital: product?.is_digital || false,
          digital_asset_url: product?.digital_asset_url || null,
          digital_asset_url_printable: product?.digital_asset_url_printable || null,
        };
      });

      // Insert order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          stripe_checkout_session_id: session.id,
          stripe_payment_intent_id: session.payment_intent || null,
          stripe_customer_id: session.customer || null,
          status: 'processing',
          payment_status: 'paid',
          customer_email: customer?.email || '',
          customer_name: customer?.name || shipping?.name || '',
          customer_phone: customer?.phone || '',
          shipping_address_line1: shipping?.address?.line1 || customer?.address?.line1 || '',
          shipping_address_line2: shipping?.address?.line2 || customer?.address?.line2 || '',
          shipping_city: shipping?.address?.city || customer?.address?.city || '',
          shipping_state: shipping?.address?.state || customer?.address?.state || '',
          shipping_postal_code: shipping?.address?.postal_code || customer?.address?.postal_code || '',
          shipping_country: shipping?.address?.country || customer?.address?.country || 'US',
          subtotal: (session.amount_subtotal || 0) / 100,
          shipping_cost: (session.shipping_cost?.amount_total || 0) / 100,
          discount_amount: (session.total_details?.amount_discount || 0) / 100,
          total: (session.amount_total || 0) / 100,
          is_subscription_order: session.mode === 'subscription',
          coupon_code: session.metadata?.coupon_code || null,
          review_email_send_at: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
          review_email_sent: false,
          created_at: new Date(session.created * 1000).toISOString(),
        })
        .select()
        .single();

      if (orderError) {
        console.error(`Error creating order for session ${session.id}:`, orderError);
        errors++;
        continue;
      }

      // Insert order items
      const itemsWithOrderId = enhancedOrderItems.map(item => ({
        order_id: order.id,
        product_id: item.product_id,
        variant_id: item.variant_id,
        product_title: item.product_title,
        variant_title: item.variant_title,
        sku: item.sku,
        image_url: item.image_url,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price,
        is_subscription: item.is_subscription,
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(itemsWithOrderId);

      if (itemsError) {
        console.error(`Error creating order items for order ${order.order_number}:`, itemsError);
        errors++;
        continue;
      }

      // If subscription, create subscription record
      if (session.mode === 'subscription' && session.subscription) {
        const subscription = await stripe.subscriptions.retrieve(session.subscription);

        await supabase
          .from('subscriptions')
          .insert({
            stripe_subscription_id: subscription.id,
            stripe_customer_id: session.customer || null,
            customer_email: customer?.email || '',
            customer_name: customer?.name || '',
            shipping_address_line1: shipping?.address?.line1 || customer?.address?.line1 || '',
            shipping_address_line2: shipping?.address?.line2 || customer?.address?.line2 || '',
            shipping_city: shipping?.address?.city || customer?.address?.city || '',
            shipping_state: shipping?.address?.state || customer?.address?.state || '',
            shipping_postal_code: shipping?.address?.postal_code || customer?.address?.postal_code || '',
            shipping_country: shipping?.address?.country || customer?.address?.country || 'US',
            status: 'active',
            billing_interval: getBillingInterval(subscription),
            next_billing_date: new Date(subscription.current_period_end * 1000).toISOString(),
            recurring_amount: (session.amount_total || 0) / 100,
          });

        await supabase
          .from('orders')
          .update({ subscription_id: subscription.id })
          .eq('id', order.id);
      }

      console.log(`Created order ${order.order_number} for session ${session.id}`);
      created++;
    } catch (err) {
      console.error(`Unexpected error processing session ${session.id}:`, err.message);
      errors++;
    }
  }

  console.log('\nBackfill complete:');
  console.log(`  Created: ${created}`);
  console.log(`  Skipped (already exist): ${skipped}`);
  console.log(`  Errors: ${errors}`);
}

backfill().catch(err => {
  console.error('Backfill failed:', err);
  process.exit(1);
});
