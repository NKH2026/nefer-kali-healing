import { loadStripe } from '@stripe/stripe-js';

// Initialize Stripe with your publishable key
// This is safe to expose on the client side
// @ts-ignore - Vite injects import.meta.env
const stripePromise = loadStripe((import.meta as any).env?.VITE_STRIPE_PUBLISHABLE_KEY || '');

export { stripePromise };

// Stripe interval mapping for subscriptions
export const getStripeInterval = (frequency: string): { interval: 'day' | 'week' | 'month' | 'year'; interval_count: number } => {
    const intervalMap: { [key: string]: { interval: 'day' | 'week' | 'month' | 'year'; interval_count: number } } = {
        'every-2-weeks': { interval: 'week', interval_count: 2 },
        'monthly': { interval: 'month', interval_count: 1 },
        'every-3-months': { interval: 'month', interval_count: 3 },
    };
    return intervalMap[frequency] || { interval: 'month', interval_count: 1 };
};

// Types for checkout
export interface CheckoutItem {
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

export interface CheckoutRequest {
    items: CheckoutItem[];
    customerEmail?: string;
    successUrl?: string;
    cancelUrl?: string;
    couponCode?: string;
}

// Create checkout session via Supabase Edge Function
export async function createCheckoutSession(request: CheckoutRequest): Promise<{ url: string } | { error: string }> {
    try {
        // Supabase Edge Function URL and anon key
        const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || 'https://rwvdvobopcfzalfausxg.supabase.co';
        const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

        const response = await fetch(`${supabaseUrl}/functions/v1/create-checkout`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${supabaseAnonKey}`,
            },
            body: JSON.stringify({
                items: request.items,
                customerEmail: request.customerEmail,
                successUrl: request.successUrl || `${window.location.origin}/order-confirmation?session_id={CHECKOUT_SESSION_ID}`,
                cancelUrl: request.cancelUrl || `${window.location.origin}/offerings`,
                couponCode: request.couponCode,
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            return { error: error.message || 'Failed to create checkout session' };
        }

        return await response.json();
    } catch (error: any) {
        console.error('Checkout error:', error);
        return { error: error.message || 'An error occurred during checkout' };
    }
}

// Redirect to Stripe Checkout
export async function redirectToCheckout(request: CheckoutRequest): Promise<void> {
    const result = await createCheckoutSession(request);

    if ('error' in result) {
        throw new Error(result.error);
    }

    // Redirect to Stripe Checkout
    window.location.href = result.url;
}

// Customer portal for subscription management
export async function createCustomerPortalSession(customerId: string): Promise<{ url: string } | { error: string }> {
    try {
        const response = await fetch('/api/customer-portal', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ customerId }),
        });

        if (!response.ok) {
            const error = await response.json();
            return { error: error.message || 'Failed to create portal session' };
        }

        return await response.json();
    } catch (error: any) {
        console.error('Portal error:', error);
        return { error: error.message || 'An error occurred' };
    }
}
