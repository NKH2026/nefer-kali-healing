// Supabase Edge Function: create-checkout
// Creates a Stripe Checkout Session for cart items
// Deploy: supabase functions deploy create-checkout

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

// CORS headers
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CheckoutItem {
    productId: string;
    variantId?: string;
    title: string;
    variantTitle?: string;
    price: number;
    quantity: number;
    image: string;
    isSubscription: boolean;
    subscriptionFrequency?: string;
}

// Convert frequency to Stripe interval
function getStripeInterval(frequency: string): { interval: 'day' | 'week' | 'month' | 'year'; interval_count: number } {
    const map: Record<string, { interval: 'day' | 'week' | 'month' | 'year'; interval_count: number }> = {
        'every-2-weeks': { interval: 'week', interval_count: 2 },
        'monthly': { interval: 'month', interval_count: 1 },
        'every-3-months': { interval: 'month', interval_count: 3 },
    };
    return map[frequency] || { interval: 'month', interval_count: 1 };
}

serve(async (req) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const { items, customerEmail, successUrl, cancelUrl, couponCode } = await req.json();

        if (!items || items.length === 0) {
            return new Response(
                JSON.stringify({ error: 'No items provided' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Get origin for constructing absolute URLs
        const origin = req.headers.get('origin') || 'https://neferkalihealing.org';

        // Calculate cart subtotal
        const cartTotal = items.reduce((sum: number, item: CheckoutItem) =>
            sum + (item.price * item.quantity), 0
        );

        // Extract product IDs for coupon validation
        const productIds = items.map((item: CheckoutItem) => item.productId);

        // Validate coupon if provided (except FREESHIPTEST which is just for testing)
        let validatedCoupon: {
            coupon_id: string | null;
            discount_type: string | null;
            discount_value: number | null;
            discount_amount: number | null;
        } | null = null;

        if (couponCode && couponCode.toUpperCase() !== 'FREESHIPTEST') {
            const { data: couponResult, error: couponError } = await supabase
                .rpc('validate_coupon', {
                    p_code: couponCode,
                    p_order_total: cartTotal,
                    p_product_ids: productIds,
                    p_customer_email: customerEmail || null,
                });

            if (couponError) {
                console.error('Coupon validation error:', couponError);
                return new Response(
                    JSON.stringify({ error: 'Error validating coupon' }),
                    { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                );
            }

            if (couponResult && couponResult.length > 0) {
                const result = couponResult[0];
                if (!result.is_valid) {
                    return new Response(
                        JSON.stringify({ error: result.error_message || 'Invalid coupon' }),
                        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                    );
                }
                validatedCoupon = {
                    coupon_id: result.coupon_id,
                    discount_type: result.discount_type,
                    discount_value: result.discount_value,
                    discount_amount: result.discount_amount,
                };
            }
        }

        // Helper function to ensure image URLs are absolute
        const getAbsoluteImageUrl = (imageUrl: string): string => {
            if (!imageUrl) return '';
            if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
                return imageUrl;
            }
            return `${origin}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
        };

        // Check if any items are subscriptions
        const hasSubscription = items.some((item: CheckoutItem) => item.isSubscription);

        // Build line items for Stripe
        const lineItems = items.map((item: CheckoutItem) => {
            const absoluteImageUrl = item.image ? getAbsoluteImageUrl(item.image) : '';
            return {
                price_data: {
                    currency: 'usd',
                    product_data: {
                        name: item.title + (item.variantTitle ? ` - ${item.variantTitle}` : ''),
                        images: absoluteImageUrl ? [absoluteImageUrl] : [],
                        metadata: {
                            product_id: item.productId,
                            variant_id: item.variantId || '',
                        },
                    },
                    unit_amount: Math.round(item.price * 100),
                    ...(item.isSubscription && {
                        recurring: getStripeInterval(item.subscriptionFrequency || 'monthly'),
                    }),
                },
                quantity: item.quantity,
            };
        });

        // Create Stripe Checkout Session params
        const sessionParams: Stripe.Checkout.SessionCreateParams = {
            mode: hasSubscription ? 'subscription' : 'payment',
            payment_method_types: ['card'],
            line_items: lineItems,
            shipping_address_collection: {
                allowed_countries: ['US'],
            },
            success_url: successUrl || `${origin}/order-confirmation?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: cancelUrl || `${origin}/offerings`,
            metadata: {
                order_source: 'nefer-kali-healing',
                is_nonprofit: 'true',
                coupon_id: validatedCoupon?.coupon_id || '',
                coupon_code: couponCode || '',
            },
            billing_address_collection: 'required',
            phone_number_collection: { enabled: true },
            custom_text: {
                submit: {
                    message: 'Nefer Kali Healing is a 501(c)(3) non-profit. Thank you for your support!',
                },
            },
        };

        // Add customer email if provided
        if (customerEmail) {
            sessionParams.customer_email = customerEmail;
        }

        // Apply coupon discount via Stripe if validated
        if (validatedCoupon && validatedCoupon.discount_amount && validatedCoupon.discount_amount > 0) {
            const stripeCoupon = await stripe.coupons.create({
                amount_off: Math.round(validatedCoupon.discount_amount * 100),
                currency: 'usd',
                duration: 'once',
                name: couponCode,
            });
            sessionParams.discounts = [{ coupon: stripeCoupon.id }];
        }

        // For one-time payments, add shipping options
        if (!hasSubscription) {
            const FREE_SHIPPING_THRESHOLD = 75.00;
            const isTestCoupon = couponCode && couponCode.toUpperCase() === 'FREESHIPTEST';

            if (isTestCoupon || cartTotal >= FREE_SHIPPING_THRESHOLD) {
                // FREE SHIPPING
                sessionParams.shipping_options = [
                    {
                        shipping_rate_data: {
                            type: 'fixed_amount',
                            fixed_amount: { amount: 0, currency: 'usd' },
                            display_name: 'Free Shipping (USPS Ground Advantage)',
                            delivery_estimate: {
                                minimum: { unit: 'business_day', value: 6 },
                                maximum: { unit: 'business_day', value: 10 },
                            },
                        },
                    },
                    {
                        shipping_rate_data: {
                            type: 'fixed_amount',
                            fixed_amount: { amount: 0, currency: 'usd' },
                            display_name: 'Free Priority Mail',
                            delivery_estimate: {
                                minimum: { unit: 'business_day', value: 1 },
                                maximum: { unit: 'business_day', value: 3 },
                            },
                        },
                    },
                ];
            } else {
                // Standard shipping rates
                sessionParams.shipping_options = [
                    {
                        shipping_rate_data: {
                            type: 'fixed_amount',
                            fixed_amount: { amount: 530, currency: 'usd' },
                            display_name: 'USPS Ground Advantage',
                            delivery_estimate: {
                                minimum: { unit: 'business_day', value: 6 },
                                maximum: { unit: 'business_day', value: 10 },
                            },
                        },
                    },
                    {
                        shipping_rate_data: {
                            type: 'fixed_amount',
                            fixed_amount: { amount: 985, currency: 'usd' },
                            display_name: 'Priority Mail',
                            delivery_estimate: {
                                minimum: { unit: 'business_day', value: 1 },
                                maximum: { unit: 'business_day', value: 3 },
                            },
                        },
                    },
                    {
                        shipping_rate_data: {
                            type: 'fixed_amount',
                            fixed_amount: { amount: 3075, currency: 'usd' },
                            display_name: 'Priority Mail Express',
                            delivery_estimate: {
                                minimum: { unit: 'business_day', value: 1 },
                                maximum: { unit: 'business_day', value: 2 },
                            },
                        },
                    },
                ];
            }
        }

        const session = await stripe.checkout.sessions.create(sessionParams);

        return new Response(
            JSON.stringify({ url: session.url }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

    } catch (error: any) {
        console.error('Checkout error:', error);
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
});
