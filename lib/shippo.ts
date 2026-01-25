// Shippo Types for shipping integration
// Note: Shippo API calls will be made from Supabase Edge Functions (server-side)
// This file contains types and client-side helpers

export interface ShippingAddress {
    name: string;
    street1: string;
    street2?: string;
    city: string;
    state: string;
    zip: string;
    country: string;
    phone?: string;
    email?: string;
}

export interface ShippingRate {
    id: string;
    provider: string;
    servicelevel: string;
    amount: number;
    currency: string;
    estimatedDays: number;
    duration_terms?: string;
}

export interface ShipmentDetails {
    shippoShipmentId: string;
    trackingNumber: string;
    trackingUrl: string;
    labelUrl: string;
    carrier: string;
    service: string;
    estimatedDeliveryDate?: string;
}

// Business address (Nefer Kali Healing ship from address)
export const BUSINESS_ADDRESS: ShippingAddress = {
    name: 'Nefer Kali Healing',
    street1: 'PO Box 322',
    city: 'McCordsville',
    state: 'IN',
    zip: '46055',
    country: 'US',
};

// Allowed shipping destinations (US only for now)
export const ALLOWED_COUNTRIES = ['US'];

// Preferred carrier (USPS only per user request)
export const PREFERRED_CARRIERS = ['usps'];

// Service level preferences
export const PREFERRED_SERVICES = [
    'usps_priority',
    'usps_ground_advantage',
    'usps_priority_express',
];

// ============================================
// STRIPE SHIPPING RATES (configured in Stripe Dashboard)
// These are the rates customers are charged at checkout
// Update these if you change rates in Stripe Dashboard
// ============================================
export const SHIPPING_RATES = {
    ground: {
        name: 'USPS Ground Advantage',
        deliveryTime: '6-10 Business Days',
        rate: 5.30,
        freeOverAmount: 75.00,
    },
    priority: {
        name: 'Priority Mail',
        deliveryTime: '1-3 Business Days',
        rate: 9.85,
        freeOverAmount: 75.00,
    },
    express: {
        name: 'Priority Mail Express',
        deliveryTime: 'Next day - 2 Business Days',
        rate: 30.75,
        freeOverAmount: 75.00,
    },
};

// Free shipping threshold
export const FREE_SHIPPING_THRESHOLD = 75.00;

// Check if order qualifies for free shipping
export function qualifiesForFreeShipping(orderTotal: number): boolean {
    return orderTotal >= FREE_SHIPPING_THRESHOLD;
}

// Get shipping cost based on method and order total
export function getShippingCost(
    method: 'ground' | 'priority' | 'express',
    orderTotal: number
): number {
    if (qualifiesForFreeShipping(orderTotal)) {
        return 0;
    }
    return SHIPPING_RATES[method].rate;
}

// Calculate parcel size based on items
export function calculateParcelSize(itemCount: number): {
    length: number;
    width: number;
    height: number;
    weight: number;
    distance_unit: 'in';
    mass_unit: 'oz';
} {
    // Default sizes - adjust based on your product dimensions
    if (itemCount === 1) {
        return {
            length: 6,
            width: 4,
            height: 3,
            weight: 8, // 8 oz
            distance_unit: 'in',
            mass_unit: 'oz',
        };
    } else if (itemCount <= 3) {
        return {
            length: 8,
            width: 6,
            height: 4,
            weight: 16, // 1 lb
            distance_unit: 'in',
            mass_unit: 'oz',
        };
    } else {
        return {
            length: 12,
            width: 8,
            height: 6,
            weight: 32, // 2 lbs
            distance_unit: 'in',
            mass_unit: 'oz',
        };
    }
}

// Fetch shipping rates from API
export async function getShippingRates(address: ShippingAddress, itemCount: number): Promise<ShippingRate[] | { error: string }> {
    try {
        const response = await fetch('/api/shipping-rates', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                addressTo: address,
                itemCount,
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            return { error: error.message || 'Failed to fetch shipping rates' };
        }

        return await response.json();
    } catch (error: any) {
        console.error('Shipping rates error:', error);
        return { error: error.message || 'An error occurred' };
    }
}

// Get tracking info
export async function getTrackingInfo(trackingNumber: string, carrier: string): Promise<any> {
    try {
        const response = await fetch(`/api/tracking?number=${trackingNumber}&carrier=${carrier}`);

        if (!response.ok) {
            const error = await response.json();
            return { error: error.message || 'Failed to fetch tracking info' };
        }

        return await response.json();
    } catch (error: any) {
        console.error('Tracking error:', error);
        return { error: error.message || 'An error occurred' };
    }
}

// Format tracking status for display
export function formatTrackingStatus(status: string): { label: string; color: string } {
    const statusMap: { [key: string]: { label: string; color: string } } = {
        'PRE_TRANSIT': { label: 'Label Created', color: 'text-yellow-400' },
        'TRANSIT': { label: 'In Transit', color: 'text-blue-400' },
        'DELIVERED': { label: 'Delivered', color: 'text-green-400' },
        'RETURNED': { label: 'Returned', color: 'text-red-400' },
        'FAILURE': { label: 'Delivery Failed', color: 'text-red-400' },
        'UNKNOWN': { label: 'Unknown', color: 'text-gray-400' },
    };

    return statusMap[status] || { label: status, color: 'text-gray-400' };
}
