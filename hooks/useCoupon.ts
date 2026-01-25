import { useState } from 'react';
import { supabase } from '../lib/supabase';

interface CouponValidationResult {
    isValid: boolean;
    errorMessage: string | null;
    couponId: string | null;
    discountType: string | null;
    discountValue: number | null;
    discountAmount: number | null;
}

export const useCoupon = () => {
    const [validating, setValidating] = useState(false);
    const [appliedCoupon, setAppliedCoupon] = useState<CouponValidationResult | null>(null);

    const validateCoupon = async (
        code: string,
        orderTotal: number,
        productIds: string[] = [],
        customerEmail?: string
    ): Promise<CouponValidationResult> => {
        setValidating(true);
        try {
            // Call the validate_coupon function
            const { data, error } = await supabase.rpc('validate_coupon', {
                p_code: code.toUpperCase(),
                p_order_total: orderTotal,
                p_product_ids: productIds,
                p_customer_email: customerEmail || null
            });

            if (error) {
                console.error('Coupon validation error:', error);
                return {
                    isValid: false,
                    errorMessage: 'Failed to validate coupon',
                    couponId: null,
                    discountType: null,
                    discountValue: null,
                    discountAmount: null
                };
            }

            // The function returns a single row
            const result = data[0];

            return {
                isValid: result.is_valid,
                errorMessage: result.error_message,
                couponId: result.coupon_id,
                discountType: result.discount_type,
                discountValue: result.discount_value,
                discountAmount: result.discount_amount
            };
        } catch (error) {
            console.error('Error validating coupon:', error);
            return {
                isValid: false,
                errorMessage: 'An error occurred while validating the coupon',
                couponId: null,
                discountType: null,
                discountValue: null,
                discountAmount: null
            };
        } finally {
            setValidating(false);
        }
    };

    const applyCoupon = (result: CouponValidationResult) => {
        if (result.isValid) {
            setAppliedCoupon(result);
        }
    };

    const removeCoupon = () => {
        setAppliedCoupon(null);
    };

    const recordRedemption = async (
        couponId: string,
        customerEmail: string,
        discountAmount: number,
        orderTotal: number,
        finalTotal: number,
        productIds: string[]
    ) => {
        try {
            const { error } = await supabase
                .from('coupon_redemptions')
                .insert([{
                    coupon_id: couponId,
                    customer_email: customerEmail,
                    discount_amount: discountAmount,
                    order_total: orderTotal,
                    final_total: finalTotal,
                    product_ids: productIds
                }]);

            if (error) throw error;
        } catch (error) {
            console.error('Error recording coupon redemption:', error);
        }
    };

    return {
        validateCoupon,
        applyCoupon,
        removeCoupon,
        recordRedemption,
        appliedCoupon,
        validating
    };
};

export default useCoupon;
