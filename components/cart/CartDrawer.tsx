import React, { useState, useEffect } from 'react';
import { X, Minus, Plus, Trash2, ShoppingBag, RefreshCw, Loader2, Check, Tag } from 'lucide-react';
import { useCart, CartItem } from './CartContext';
import { redirectToCheckout, CheckoutItem } from '../../lib/stripe';

const CartDrawer: React.FC = () => {
    const {
        items,
        isOpen,
        subtotal,
        closeCart,
        updateQuantity,
        removeItem,
        toggleSubscription,
        clearCart,
        appliedCoupon,
        setCoupon
    } = useCart();

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [couponCode, setCouponCode] = useState('');

    // Sync coupon code input with applied coupon
    useEffect(() => {
        if (appliedCoupon) {
            setCouponCode(appliedCoupon.code);
        }
    }, [appliedCoupon]);

    const handleCheckout = async () => {
        if (items.length === 0) return;

        setIsLoading(true);
        setError(null);

        try {
            const checkoutItems: CheckoutItem[] = items.map(item => ({
                productId: item.productId,
                variantId: item.variantId,
                title: item.title,
                variantTitle: item.variantTitle,
                price: item.isSubscription && item.subscriptionDiscount
                    ? item.price * (1 - item.subscriptionDiscount / 100)
                    : item.price,
                quantity: item.quantity,
                image: item.image,
                isSubscription: item.isSubscription,
                subscriptionFrequency: item.subscriptionFrequency,
            }));

            await redirectToCheckout({
                items: checkoutItems,
                couponCode: appliedCoupon?.code || couponCode.trim() || undefined,
            });
        } catch (err: any) {
            console.error('Checkout error:', err);
            setError(err.message || 'Something went wrong. Please try again.');
            setIsLoading(false);
        }
    };

    const getFrequencyLabel = (freq?: string) => {
        const labels: { [key: string]: string } = {
            'every-2-weeks': 'Every 2 weeks',
            'monthly': 'Monthly',
            'every-3-months': 'Every 3 months'
        };
        return freq ? labels[freq] || freq : '';
    };

    const getItemPrice = (item: CartItem): number => {
        if (item.isSubscription && item.subscriptionDiscount) {
            return item.price * (1 - item.subscriptionDiscount / 100);
        }
        return item.price;
    };

    return (
        <>
            {/* Backdrop */}
            <div
                className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
                    }`}
                onClick={closeCart}
            />

            {/* Drawer */}
            <div
                className={`fixed top-0 right-0 h-full w-full max-w-md bg-[#0a0a0a] border-l border-white/10 z-[201] transform transition-transform duration-300 ease-out ${isOpen ? 'translate-x-0' : 'translate-x-full'
                    }`}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/10">
                    <h2 className="text-xl font-display text-white flex items-center gap-3">
                        <ShoppingBag className="text-[#D4AF37]" size={24} />
                        Your Cart
                    </h2>
                    <button
                        onClick={closeCart}
                        className="text-white/60 hover:text-white transition-colors p-2"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Cart Items */}
                <div className="flex-1 overflow-y-auto p-6 max-h-[calc(100vh-240px)]">
                    {items.length === 0 ? (
                        <div className="text-center py-16">
                            <ShoppingBag className="mx-auto text-white/20 mb-4" size={48} />
                            <p className="text-white/40 font-urbanist">Your cart is empty</p>
                            <button
                                onClick={closeCart}
                                className="mt-4 text-[#D4AF37] hover:underline text-sm"
                            >
                                Continue Shopping
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {items.map((item) => (
                                <div key={item.id} className="flex gap-4 pb-6 border-b border-white/10">
                                    {/* Image */}
                                    <div className="w-20 h-20 rounded-lg overflow-hidden bg-[#1a1a1a] flex-shrink-0">
                                        <img
                                            src={item.image}
                                            alt={item.title}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>

                                    {/* Details */}
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-white font-medium text-sm mb-1 truncate">
                                            {item.title}
                                        </h3>
                                        {item.variantTitle && (
                                            <p className="text-white/40 text-xs mb-2">{item.variantTitle}</p>
                                        )}

                                        {/* Subscription badge */}
                                        {item.isSubscription && (
                                            <div className="flex items-center gap-1 text-[#D4AF37] text-xs mb-2">
                                                <RefreshCw size={12} />
                                                <span>{getFrequencyLabel(item.subscriptionFrequency)}</span>
                                                {item.subscriptionDiscount && (
                                                    <span className="bg-[#D4AF37]/20 px-1.5 py-0.5 rounded text-[10px]">
                                                        -{item.subscriptionDiscount}%
                                                    </span>
                                                )}
                                            </div>
                                        )}

                                        {/* Price & Quantity */}
                                        <div className="flex items-center justify-between">
                                            <span className="text-[#D4AF37] font-medium">
                                                ${getItemPrice(item).toFixed(2)}
                                            </span>

                                            {/* Quantity Controls */}
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                    className="w-7 h-7 rounded-full border border-white/20 flex items-center justify-center text-white/60 hover:border-[#D4AF37] hover:text-[#D4AF37] transition-colors"
                                                >
                                                    <Minus size={12} />
                                                </button>
                                                <span className="text-white text-sm w-6 text-center">{item.quantity}</span>
                                                <button
                                                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                    className="w-7 h-7 rounded-full border border-white/20 flex items-center justify-center text-white/60 hover:border-[#D4AF37] hover:text-[#D4AF37] transition-colors"
                                                >
                                                    <Plus size={12} />
                                                </button>
                                                <button
                                                    onClick={() => removeItem(item.id)}
                                                    className="ml-2 text-red-400/60 hover:text-red-400 transition-colors"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {/* Clear Cart */}
                            <button
                                onClick={clearCart}
                                className="text-white/40 text-xs hover:text-white/60 transition-colors"
                            >
                                Clear Cart
                            </button>
                        </div>
                    )}
                </div>

                {/* Footer */}
                {items.length > 0 && (
                    <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-white/10 bg-[#0a0a0a]">
                        {/* Coupon Section */}
                        {appliedCoupon ? (
                            <div className="flex items-center justify-between mb-4 bg-green-900/20 border border-green-500/30 rounded-lg px-3 py-2">
                                <div className="flex items-center gap-2">
                                    <Check className="text-green-400" size={16} />
                                    <span className="text-green-400 text-sm font-urbanist">
                                        {appliedCoupon.code} • {appliedCoupon.discountType === 'percentage'
                                            ? `${appliedCoupon.discountValue}% off`
                                            : appliedCoupon.discountType === 'free_shipping'
                                                ? 'Free Shipping'
                                                : `$${appliedCoupon.discountAmount.toFixed(2)} off`}
                                    </span>
                                </div>
                                <button
                                    onClick={() => setCoupon(null)}
                                    className="text-white/40 hover:text-white text-xs"
                                >
                                    Remove
                                </button>
                            </div>
                        ) : (
                            <div className="flex gap-2 mb-4">
                                <input
                                    type="text"
                                    value={couponCode}
                                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                                    placeholder="Coupon code"
                                    className="flex-1 px-3 py-2 bg-[#1a1a1a] border border-white/10 rounded-lg text-white text-sm placeholder:text-white/30 focus:border-[#D4AF37] focus:outline-none transition-colors"
                                />
                                {couponCode && (
                                    <button
                                        onClick={() => setCouponCode('')}
                                        className="px-3 py-2 text-white/40 hover:text-white text-xs"
                                    >
                                        Clear
                                    </button>
                                )}
                            </div>
                        )}

                        {/* Subtotal */}
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-white/60 font-urbanist">Subtotal</span>
                            <span className="text-xl font-medium text-white">${subtotal.toFixed(2)}</span>
                        </div>

                        <p className="text-white/40 text-xs mb-4 font-urbanist">
                            Shipping calculated at checkout
                        </p>

                        {/* Error Message */}
                        {error && (
                            <p className="text-red-400 text-xs mb-4 text-center font-urbanist">
                                {error}
                            </p>
                        )}

                        {/* Checkout Button */}
                        <button
                            onClick={handleCheckout}
                            disabled={isLoading}
                            className="w-full py-4 bg-gradient-to-r from-[#D4AF37] to-[#8B7322] text-black font-bold text-sm uppercase tracking-[0.2em] rounded-full hover:shadow-2xl hover:shadow-[#D4AF37]/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 size={18} className="animate-spin" />
                                    Processing...
                                </>
                            ) : (
                                'Proceed to Checkout'
                            )}
                        </button>

                        <p className="text-center text-white/30 text-xs mt-4 font-urbanist">
                            Secure checkout powered by Stripe
                        </p>
                    </div>
                )}
            </div>
        </>
    );
};

export default CartDrawer;
