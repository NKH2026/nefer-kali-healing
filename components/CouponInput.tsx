import { useState } from 'react';
import { Tag, Check, X, Loader } from 'lucide-react';
import { useCoupon } from '../hooks/useCoupon';
import { useCart } from './cart/CartContext';

interface CouponInputProps {
    orderTotal: number;
    productIds?: string[];
    customerEmail?: string;
    onCouponApplied?: (discountAmount: number) => void;
    onCouponRemoved?: () => void;
}

export const CouponInput = ({
    orderTotal,
    productIds = [],
    customerEmail,
    onCouponApplied,
    onCouponRemoved
}: CouponInputProps) => {
    const [couponCode, setCouponCode] = useState('');
    const [error, setError] = useState('');
    const { validateCoupon, applyCoupon, removeCoupon, appliedCoupon, validating } = useCoupon();
    const { setCoupon, appliedCoupon: cartCoupon } = useCart();

    const handleApply = async () => {
        if (!couponCode.trim()) {
            setError('Please enter a coupon code');
            return;
        }

        setError('');
        const result = await validateCoupon(couponCode, orderTotal, productIds, customerEmail);

        if (result.isValid) {
            applyCoupon(result);
            // Save coupon to cart context for persistence
            setCoupon({
                code: couponCode.toUpperCase(),
                discountType: result.discountType || '',
                discountValue: result.discountValue || 0,
                discountAmount: result.discountAmount || 0,
            });
            setCouponCode('');
            if (onCouponApplied && result.discountAmount) {
                onCouponApplied(result.discountAmount);
            }
        } else {
            setError(result.errorMessage || 'Invalid coupon code');
        }
    };

    const handleRemove = () => {
        removeCoupon();
        setCoupon(null); // Clear from cart context
        setError('');
        if (onCouponRemoved) {
            onCouponRemoved();
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleApply();
        }
    };

    const getDiscountDisplay = () => {
        if (!appliedCoupon || !appliedCoupon.discountAmount) return '';

        if (appliedCoupon.discountType === 'percentage') {
            return `${appliedCoupon.discountValue}% off`;
        } else if (appliedCoupon.discountType === 'fixed_amount') {
            return `$${appliedCoupon.discountAmount.toFixed(2)} off`;
        } else if (appliedCoupon.discountType === 'free_shipping') {
            return 'Free Shipping';
        }
        return `$${appliedCoupon.discountAmount.toFixed(2)} off`;
    };

    if (appliedCoupon && appliedCoupon.isValid) {
        return (
            <div className="bg-gradient-to-r from-green-900/20 to-green-800/10 border-2 border-green-500/30 rounded-lg p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-green-500/20 p-2 rounded-full">
                            <Check className="text-green-400" size={18} />
                        </div>
                        <div>
                            <div className="text-white font-urbanist font-medium">
                                Coupon Applied
                            </div>
                            <div className="text-green-400 text-sm font-urbanist">
                                {getDiscountDisplay()}
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={handleRemove}
                        className="text-white/60 hover:text-white transition-colors"
                        title="Remove coupon"
                    >
                        <X size={20} />
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-2">
            <label className="block text-xs text-white/60 uppercase tracking-wider mb-2 font-urbanist">
                Have a coupon?
            </label>
            <div className="flex gap-2">
                <div className="flex-1 relative">
                    <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={18} />
                    <input
                        type="text"
                        value={couponCode}
                        onChange={(e) => {
                            setCouponCode(e.target.value.toUpperCase());
                            setError('');
                        }}
                        onKeyPress={handleKeyPress}
                        placeholder="ENTER CODE"
                        disabled={validating}
                        className="w-full bg-white/5 border-2 border-white/10 rounded-lg pl-10 pr-3 py-3 text-sm text-white font-mono uppercase focus:border-[#D4AF37] focus:outline-none placeholder-gray-600 font-urbanist transition-all disabled:opacity-50"
                    />
                </div>
                <button
                    onClick={handleApply}
                    disabled={validating || !couponCode.trim()}
                    className="px-6 py-3 bg-[#D4AF37] hover:bg-[#B8961F] text-black font-urbanist font-bold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                    {validating ? (
                        <>
                            <Loader className="animate-spin" size={16} />
                            Checking...
                        </>
                    ) : (
                        'Apply'
                    )}
                </button>
            </div>
            {error && (
                <div className="flex items-center gap-2 text-red-400 text-sm font-urbanist mt-2">
                    <X size={14} />
                    {error}
                </div>
            )}
        </div>
    );
};

export default CouponInput;
