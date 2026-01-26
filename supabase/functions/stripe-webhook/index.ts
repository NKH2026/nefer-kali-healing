// Supabase Edge Function: stripe-webhook
// Handles Stripe webhook events for order processing
// Deploy: supabase functions deploy stripe-webhook

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@14.10.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2023-10-16',
});

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')!;
const resendApiKey = Deno.env.get('RESEND_API_KEY');

// Non-profit info for receipts
const NONPROFIT_INFO = {
  name: 'Nefer Kali Healing',
  ein: '99-3021724',
  address: 'PO Box 322, McCordsville, IN 46055',
  email: 'asasa@neferkalihealing.org',
};

// Send confirmation email via Resend
async function sendConfirmationEmail(order: any, orderItems: any[]) {
  if (!resendApiKey) {
    console.log('RESEND_API_KEY not set, skipping email');
    return;
  }

  const itemsHTML = orderItems.map(item => `
        <tr>
            <td style="padding: 12px; border-bottom: 1px solid #333;">${item.product_title}</td>
            <td style="padding: 12px; border-bottom: 1px solid #333; text-align: center;">${item.quantity}</td>
            <td style="padding: 12px; border-bottom: 1px solid #333; text-align: right;">$${item.unit_price.toFixed(2)}</td>
        </tr>
    `).join('');

  const emailHTML = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0a;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #121212; border-radius: 16px; overflow: hidden;">
          <tr>
            <td style="background: linear-gradient(135deg, #D4AF37, #8B7322); padding: 40px; text-align: center;">
              <h1 style="margin: 0; color: #000; font-size: 28px; font-weight: bold;">NEFER KALI HEALING</h1>
              <p style="margin: 10px 0 0; color: #000; font-size: 14px;">Order Confirmation & Tax Receipt</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px;">
              <h2 style="color: #D4AF37; margin: 0 0 10px; font-size: 24px;">Thank You, ${order.customer_name}!</h2>
              <p style="color: #999; margin: 0;">Your order has been confirmed.</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 40px;">
              <table width="100%" style="background-color: #1a1a1a; border-radius: 12px;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="color: #666; margin: 0 0 5px; font-size: 12px;">Order Number</p>
                    <p style="color: #D4AF37; margin: 0; font-size: 18px; font-weight: bold;">${order.order_number}</p>
                  </td>
                  <td style="padding: 20px; text-align: right;">
                    <p style="color: #666; margin: 0 0 5px; font-size: 12px;">Total</p>
                    <p style="color: #fff; margin: 0; font-size: 18px;">$${order.total.toFixed(2)}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 30px 40px;">
              <h3 style="color: #fff; margin: 0 0 20px;">Order Items</h3>
              <table width="100%" style="color: #ccc;">
                <thead>
                  <tr style="color: #666; font-size: 12px;">
                    <th style="padding: 12px; text-align: left; border-bottom: 1px solid #333;">Item</th>
                    <th style="padding: 12px; text-align: center; border-bottom: 1px solid #333;">Qty</th>
                    <th style="padding: 12px; text-align: right; border-bottom: 1px solid #333;">Price</th>
                  </tr>
                </thead>
                <tbody>${itemsHTML}</tbody>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 40px 40px;">
              <table width="100%" style="background-color: #D4AF37; border-radius: 12px;">
                <tr>
                  <td style="padding: 25px;">
                    <h3 style="color: #000; margin: 0 0 15px;">📋 Tax Receipt</h3>
                    <p style="color: #000; margin: 5px 0;"><strong>Organization:</strong> ${NONPROFIT_INFO.name}</p>
                    <p style="color: #000; margin: 5px 0;"><strong>EIN:</strong> ${NONPROFIT_INFO.ein}</p>
                    <p style="color: #000; margin: 5px 0;"><strong>Amount:</strong> $${order.total.toFixed(2)}</p>
                    <p style="color: #000; margin: 15px 0 0; font-size: 11px; opacity: 0.8;">
                      <em>For purchases of goods, the tax-deductible portion is limited to the amount by which your payment exceeds the fair market value of goods received.</em>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="background-color: #0f0f0f; padding: 30px; text-align: center;">
              <p style="color: #666; margin: 0; font-size: 12px;">
                Questions? Contact us at <a href="mailto:${NONPROFIT_INFO.email}" style="color: #D4AF37;">${NONPROFIT_INFO.email}</a>
              </p>
              <p style="color: #444; margin: 10px 0 0; font-size: 11px;">${NONPROFIT_INFO.name} | ${NONPROFIT_INFO.address}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Nefer Kali Healing <info@neferkalihealing.org>',
        to: order.customer_email,
        subject: `Order Confirmed: ${order.order_number} | Nefer Kali Healing`,
        html: emailHTML,
      }),
    });

    if (response.ok) {
      console.log('Confirmation email sent to:', order.customer_email);
    } else {
      const error = await response.text();
      console.error('Email send error:', error);
    }
  } catch (error) {
    console.error('Email send exception:', error);
  }
}

serve(async (req) => {
  const signature = req.headers.get('stripe-signature');

  // Log incoming request for debugging
  console.log('Webhook received, signature present:', !!signature);
  console.log('Webhook secret configured:', !!webhookSecret);

  if (!signature) {
    console.error('No stripe-signature header found');
    return new Response('No signature', { status: 400 });
  }

  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET is not configured');
    return new Response('Webhook secret not configured', { status: 500 });
  }

  try {
    const body = await req.text();
    console.log('Request body length:', body.length);

    let event;
    try {
      // Use constructEventAsync for Deno (SubtleCrypto requires async)
      event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
    } catch (verifyError: any) {
      console.error('Signature verification failed:', verifyError.message);
      return new Response(
        JSON.stringify({ error: 'Signature verification failed: ' + verifyError.message }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('Webhook event verified successfully:', event.type);

    switch (event.type) {
      case 'checkout.session.completed':
        console.log('Processing checkout.session.completed...');
        await handleCheckoutComplete(event.data.object as Stripe.Checkout.Session);
        console.log('checkout.session.completed processed successfully');
        break;

      case 'invoice.payment_succeeded':
        await handleInvoicePayment(event.data.object as Stripe.Invoice);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdate(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionCancelled(event.data.object as Stripe.Subscription);
        break;

      default:
        console.log('Unhandled event type:', event.type);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Webhook error:', error.message);
    console.error('Error stack:', error.stack);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }
});

// Handle completed checkout session
async function handleCheckoutComplete(session: Stripe.Checkout.Session) {
  console.log('Processing checkout session:', session.id);

  // Get line items
  const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
    expand: ['data.price.product'],
  });

  // Extract shipping address
  const shipping = session.shipping_details;
  const customer = session.customer_details;

  // Create order in database
  const orderItems = lineItems.data.map((item) => {
    const product = item.price?.product as Stripe.Product;
    return {
      product_id: product?.metadata?.product_id || null,
      variant_id: product?.metadata?.variant_id || null,
      product_title: item.description || product?.name || 'Unknown Product',
      variant_title: null,
      sku: null,
      image_url: product?.images?.[0] || null,
      quantity: item.quantity || 1,
      unit_price: (item.price?.unit_amount || 0) / 100,
      total_price: (item.amount_total || 0) / 100,
      is_subscription: session.mode === 'subscription',
    };
  });

  // Insert order
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      stripe_checkout_session_id: session.id,
      stripe_payment_intent_id: session.payment_intent as string,
      stripe_customer_id: session.customer as string,
      status: 'processing',
      payment_status: 'paid',
      customer_email: customer?.email || '',
      customer_name: customer?.name || shipping?.name || '',
      customer_phone: customer?.phone || '',
      shipping_address_line1: shipping?.address?.line1 || '',
      shipping_address_line2: shipping?.address?.line2 || '',
      shipping_city: shipping?.address?.city || '',
      shipping_state: shipping?.address?.state || '',
      shipping_postal_code: shipping?.address?.postal_code || '',
      shipping_country: shipping?.address?.country || 'US',
      subtotal: (session.amount_subtotal || 0) / 100,
      shipping_cost: (session.shipping_cost?.amount_total || 0) / 100,
      discount_amount: (session.total_details?.amount_discount || 0) / 100,
      total: (session.amount_total || 0) / 100,
      is_subscription_order: session.mode === 'subscription',
    })
    .select()
    .single();

  if (orderError) {
    console.error('Error creating order:', orderError);
    throw orderError;
  }

  console.log('Order created:', order.id);

  // Insert order items
  const itemsWithOrderId = orderItems.map((item) => ({
    ...item,
    order_id: order.id,
  }));

  const { error: itemsError } = await supabase
    .from('order_items')
    .insert(itemsWithOrderId);

  if (itemsError) {
    console.error('Error creating order items:', itemsError);
  }

  // Update product inventory (optional - may not be implemented yet)
  for (const item of orderItems) {
    if (item.product_id) {
      try {
        await supabase.rpc('decrement_inventory', {
          p_product_id: item.product_id,
          p_variant_id: item.variant_id,
          p_quantity: item.quantity,
        });
      } catch (inventoryError) {
        // Inventory tracking not implemented yet - continue without failing
        console.log('Inventory update skipped (function may not exist):', inventoryError);
      }
    }
  }

  // If subscription, create subscription record
  if (session.mode === 'subscription' && session.subscription) {
    const subscription = await stripe.subscriptions.retrieve(session.subscription as string);

    await supabase
      .from('subscriptions')
      .insert({
        stripe_subscription_id: subscription.id,
        stripe_customer_id: session.customer as string,
        customer_email: customer?.email || '',
        customer_name: customer?.name || '',
        shipping_address_line1: shipping?.address?.line1 || '',
        shipping_address_line2: shipping?.address?.line2 || '',
        shipping_city: shipping?.address?.city || '',
        shipping_state: shipping?.address?.state || '',
        shipping_postal_code: shipping?.address?.postal_code || '',
        shipping_country: shipping?.address?.country || 'US',
        status: 'active',
        billing_interval: getBillingInterval(subscription),
        next_billing_date: new Date(subscription.current_period_end * 1000).toISOString(),
        recurring_amount: (session.amount_total || 0) / 100,
      });

    // Update order with subscription reference
    await supabase
      .from('orders')
      .update({ subscription_id: subscription.id })
      .eq('id', order.id);
  }

  // TODO: Create shipping label via Shippo

  // Send confirmation email with non-profit receipt
  await sendConfirmationEmail(order, orderItems);

  console.log('Checkout processing complete for order:', order.order_number);
}

// Handle invoice payment (subscription renewal)
async function handleInvoicePayment(invoice: Stripe.Invoice) {
  if (!invoice.subscription) return;

  console.log('Processing subscription invoice:', invoice.id);

  // Get subscription details
  const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);

  // Update subscription next billing date
  await supabase
    .from('subscriptions')
    .update({
      next_billing_date: new Date(subscription.current_period_end * 1000).toISOString(),
      status: 'active',
    })
    .eq('stripe_subscription_id', invoice.subscription);

  // TODO: Create new order for this renewal
  // TODO: Create shipping label
  // TODO: Send renewal confirmation email
}

// Handle subscription status changes
async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  console.log('Subscription updated:', subscription.id, subscription.status);

  let status = 'active';
  if (subscription.status === 'past_due') status = 'past_due';
  if (subscription.status === 'canceled') status = 'cancelled';
  if (subscription.pause_collection) status = 'paused';

  await supabase
    .from('subscriptions')
    .update({
      status,
      next_billing_date: new Date(subscription.current_period_end * 1000).toISOString(),
      paused_at: subscription.pause_collection ? new Date().toISOString() : null,
    })
    .eq('stripe_subscription_id', subscription.id);
}

// Handle subscription cancellation
async function handleSubscriptionCancelled(subscription: Stripe.Subscription) {
  console.log('Subscription cancelled:', subscription.id);

  await supabase
    .from('subscriptions')
    .update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscription.id);
}

// Get billing interval string from Stripe subscription
function getBillingInterval(subscription: Stripe.Subscription): string {
  const item = subscription.items.data[0];
  if (!item?.price?.recurring) return 'monthly';

  const { interval, interval_count } = item.price.recurring;

  if (interval === 'week' && interval_count === 2) return 'every-2-weeks';
  if (interval === 'month' && interval_count === 1) return 'monthly';
  if (interval === 'month' && interval_count === 3) return 'every-3-months';

  return 'monthly';
}
