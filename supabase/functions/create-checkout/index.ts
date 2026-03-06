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
    category?: string;
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

        // Calculate final total
        const finalTotal = Math.max(0, cartTotal - (validatedCoupon?.discount_amount || 0));

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

        // --- 100% FREE ORDER BYPASS ---
        // If the order is free because of a coupon, bypass Stripe entirely.
        // Stripe does not allow $0 checkout sessions.
        if (finalTotal === 0 && validatedCoupon && validatedCoupon.discount_amount && validatedCoupon.discount_amount > 0) {
            console.log('Processing 100% free order bypass');

            // 1. Create a mock checkout session ID
            const sessionId = `FREE_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
            const orderNumber = `NKH-${Date.now().toString().slice(-6)}`;

            // 2. Insert into orders table
            const { data: order, error: orderError } = await supabase
                .from('orders')
                .insert({
                    order_number: orderNumber,
                    stripe_checkout_session_id: sessionId,
                    stripe_payment_intent_id: 'free_order',
                    stripe_customer_id: 'guest',
                    status: 'processing',
                    payment_status: 'paid',
                    customer_email: customerEmail || 'guest@example.com',
                    customer_name: 'Guest User',
                    shipping_address_line1: 'N/A',
                    shipping_city: 'N/A',
                    shipping_state: 'N/A',
                    shipping_postal_code: 'N/A',
                    shipping_country: 'US',
                    subtotal: cartTotal,
                    shipping_cost: 0,
                    discount_amount: validatedCoupon.discount_amount,
                    total: 0,
                    is_subscription_order: hasSubscription,
                    review_email_send_at: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
                    review_email_sent: false,
                })
                .select()
                .single();

            if (orderError) {
                console.error('Error creating free order:', orderError);
                return new Response(
                    JSON.stringify({ error: 'Failed to create free order' }),
                    { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                );
            }

            // 3. Setup Order Items
            // We need to fetch product data to see what's digital
            const uniqueProductIds = [...new Set(items.map((item: CheckoutItem) => item.productId))];
            const { data: productData } = await supabase
                .from('products')
                .select('id, is_digital, digital_asset_url, digital_asset_url_printable')
                .in('id', uniqueProductIds);

            const productsMap = new Map(productData?.map((p: any) => [p.id, p]) || []);

            const orderItemsInsert = items.map((item: CheckoutItem) => {
                const product = productsMap.get(item.productId);
                return {
                    order_id: order.id,
                    product_id: item.productId,
                    variant_id: item.variantId || null,
                    product_title: item.title,
                    variant_title: item.variantTitle || null,
                    image_url: item.image,
                    quantity: item.quantity,
                    unit_price: item.price,
                    total_price: item.price * item.quantity,
                    is_subscription: item.isSubscription || false,
                };
            });

            // 4. Insert order items
            await supabase.from('order_items').insert(orderItemsInsert);

            // 5. Record Coupon Redemption
            await supabase.from('coupon_redemptions').insert({
                coupon_id: validatedCoupon.coupon_id,
                customer_email: customerEmail || 'guest@example.com',
                order_id: order.id,
                discount_amount: validatedCoupon.discount_amount,
                order_total: cartTotal,
                final_total: 0,
            });

            // 6. Return success URL
            const finalSuccessUrl = (successUrl || `${origin}/order-confirmation?session_id={CHECKOUT_SESSION_ID}`)
                .replace('{CHECKOUT_SESSION_ID}', sessionId);

            return new Response(
                JSON.stringify({ url: finalSuccessUrl }),
                { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }
        // --- END FREE ORDER BYPASS ---

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
                            variant_title: item.variantTitle || '',
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
            const SEA_MOSS_WEIGHT_THRESHOLD_OZ = 40;
            const SEA_MOSS_FLAT_SHIPPING_CENTS = 2300; // $23.00
            const isTestCoupon = couponCode && couponCode.toUpperCase() === 'FREESHIPTEST';
            const isFreeShippingCoupon = validatedCoupon?.discount_type === 'free_shipping';

            // --- Sea Moss heavy-order detection ---
            // Look up product categories from the database (don't rely on frontend passing category)
            // Then calculate total weight from variant titles or option1.
            let totalSeaMossWeightOz = 0;

            // Fetch categories and digital flags for all products in the order
            const uniqueProductIds = [...new Set(items.map((item: CheckoutItem) => item.productId))];
            const { data: productData } = await supabase
                .from('products')
                .select('id, category, is_digital')
                .in('id', uniqueProductIds);

            const digitalProductIds = new Set(
                (productData || [])
                    .filter((p: any) => p.is_digital === true)
                    .map((p: any) => p.id)
            );

            const hasPhysicalItems = items.some((item: CheckoutItem) => !digitalProductIds.has(item.productId));

            if (!hasPhysicalItems) {
                // Order is purely digital, remove shipping requirements
                delete sessionParams.shipping_address_collection;
            } else {

                const seaMossProductIds = new Set(
                    (productData || [])
                        .filter((p: any) => p.category?.toLowerCase() === 'sea moss')
                        .map((p: any) => p.id)
                );

                const seaMossItems = items.filter((item: CheckoutItem) =>
                    seaMossProductIds.has(item.productId)
                );

                if (seaMossItems.length > 0) {
                    // Helper: parse oz from a string like "8 oz", "16 oz", "16oz", "1 lb"
                    const parseWeightOz = (text: string): number => {
                        if (!text) return 0;
                        const lower = text.toLowerCase().trim();
                        const ozMatch = lower.match(/(\d+(?:\.\d+)?)\s*oz/);
                        if (ozMatch) return parseFloat(ozMatch[1]);
                        const lbMatch = lower.match(/(\d+(?:\.\d+)?)\s*lb/);
                        if (lbMatch) return parseFloat(lbMatch[1]) * 16;
                        return 0;
                    };

                    for (const item of seaMossItems) {
                        let weightOz = 0;

                        // Try variant title first (e.g. "16oz" or "8 oz")
                        if (item.variantTitle) {
                            weightOz = parseWeightOz(item.variantTitle);
                        }

                        // Try the item title itself (e.g. "Purple Sea Moss - 16oz")
                        if (weightOz === 0 && item.title) {
                            weightOz = parseWeightOz(item.title);
                        }

                        // Fall back to looking up variant option1 from DB
                        if (weightOz === 0 && item.variantId) {
                            const { data: variantData } = await supabase
                                .from('product_variants')
                                .select('option1')
                                .eq('id', item.variantId)
                                .single();
                            if (variantData?.option1) {
                                weightOz = parseWeightOz(variantData.option1);
                            }
                        }

                        // Default: if still no weight, assume 8 oz per unit
                        if (weightOz === 0) {
                            weightOz = 8;
                        }

                        totalSeaMossWeightOz += weightOz * item.quantity;
                    }

                    console.log(`Sea Moss total weight: ${totalSeaMossWeightOz} oz (threshold: ${SEA_MOSS_WEIGHT_THRESHOLD_OZ} oz)`);
                }

                const isHeavySeaMossOrder = totalSeaMossWeightOz > SEA_MOSS_WEIGHT_THRESHOLD_OZ;

                if (isHeavySeaMossOrder) {
                    // Heavy sea moss order: flat $23 shipping regardless of cart total
                    sessionParams.shipping_options = [
                        {
                            shipping_rate_data: {
                                type: 'fixed_amount',
                                fixed_amount: { amount: SEA_MOSS_FLAT_SHIPPING_CENTS, currency: 'usd' },
                                display_name: 'Flat Rate Shipping (Heavy Order)',
                                delivery_estimate: {
                                    minimum: { unit: 'business_day', value: 5 },
                                    maximum: { unit: 'business_day', value: 10 },
                                },
                            },
                        },
                    ];
                } else if (isTestCoupon || isFreeShippingCoupon || cartTotal >= FREE_SHIPPING_THRESHOLD) {
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
            } // End of hasPhysicalItems else block
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
