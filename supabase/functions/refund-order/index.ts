// Refund Order Edge Function
// Handles full and partial refunds via Stripe

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@14.10.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
    apiVersion: '2023-10-16',
    httpClient: Stripe.createFetchHttpClient(),
});

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const { orderId, amount, reason } = await req.json();

        if (!orderId) {
            return new Response(
                JSON.stringify({ error: 'Order ID is required' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Initialize Supabase client
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Fetch the order
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .select('*')
            .eq('id', orderId)
            .single();

        if (orderError || !order) {
            return new Response(
                JSON.stringify({ error: 'Order not found' }),
                { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Check if order has a payment intent
        if (!order.stripe_payment_intent_id) {
            return new Response(
                JSON.stringify({ error: 'No payment intent found for this order' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Check if already refunded
        if (order.payment_status === 'refunded') {
            return new Response(
                JSON.stringify({ error: 'Order has already been refunded' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Calculate refund amount (in cents)
        let refundAmountCents: number;
        let isFullRefund = false;

        if (amount === null || amount === undefined || amount >= order.total) {
            // Full refund
            refundAmountCents = Math.round(order.total * 100);
            isFullRefund = true;
        } else {
            // Partial refund
            refundAmountCents = Math.round(amount * 100);

            if (refundAmountCents <= 0) {
                return new Response(
                    JSON.stringify({ error: 'Refund amount must be greater than 0' }),
                    { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                );
            }

            if (refundAmountCents > Math.round(order.total * 100)) {
                return new Response(
                    JSON.stringify({ error: 'Refund amount cannot exceed order total' }),
                    { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                );
            }
        }

        // Create Stripe refund
        const refundParams: Stripe.RefundCreateParams = {
            payment_intent: order.stripe_payment_intent_id,
            amount: refundAmountCents,
        };

        if (reason) {
            refundParams.metadata = { reason };
        }

        const refund = await stripe.refunds.create(refundParams);

        // Update order in database
        const updateData: Record<string, any> = {
            payment_status: isFullRefund ? 'refunded' : 'paid', // Partial refund keeps status as paid
            internal_notes: order.internal_notes
                ? `${order.internal_notes}\n\n[${new Date().toISOString()}] Refund: $${(refundAmountCents / 100).toFixed(2)}${reason ? ` - ${reason}` : ''}`
                : `[${new Date().toISOString()}] Refund: $${(refundAmountCents / 100).toFixed(2)}${reason ? ` - ${reason}` : ''}`,
        };

        // If full refund, also update order status
        if (isFullRefund) {
            updateData.status = 'refunded';
        }

        const { error: updateError } = await supabase
            .from('orders')
            .update(updateData)
            .eq('id', orderId);

        if (updateError) {
            console.error('Error updating order:', updateError);
            // Refund was successful, but database update failed
            // Still return success but log the issue
        }

        return new Response(
            JSON.stringify({
                success: true,
                refund: {
                    id: refund.id,
                    amount: refundAmountCents / 100,
                    status: refund.status,
                    isFullRefund,
                },
            }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

    } catch (error: any) {
        console.error('Refund error:', error);

        // Handle Stripe-specific errors
        if (error.type === 'StripeCardError' || error.type === 'StripeInvalidRequestError') {
            return new Response(
                JSON.stringify({ error: error.message }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        return new Response(
            JSON.stringify({ error: error.message || 'An error occurred processing the refund' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
});
