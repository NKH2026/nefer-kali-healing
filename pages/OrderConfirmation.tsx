import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, Package, Truck, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { useCart } from '../components/cart';

interface OrderDetails {
    orderNumber: string;
    customerEmail: string;
    customerName: string;
    total: number;
    items: Array<{
        title: string;
        quantity: number;
        price: number;
    }>;
    shippingAddress: {
        line1: string;
        line2?: string;
        city: string;
        state: string;
        postalCode: string;
    };
}

const OrderConfirmation: React.FC = () => {
    const [searchParams] = useSearchParams();
    const { clearCart } = useCart();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [order, setOrder] = useState<OrderDetails | null>(null);

    const sessionId = searchParams.get('session_id');

    useEffect(() => {
        // Clear cart on successful order
        clearCart();

        // In a real implementation, fetch order details from the session_id
        // For now, show a generic success message
        const timer = setTimeout(() => {
            setLoading(false);
            // Mock order data - in production, fetch from API
            setOrder({
                orderNumber: 'NKH-26-00001',
                customerEmail: 'customer@example.com',
                customerName: 'Valued Customer',
                total: 45.99,
                items: [
                    { title: 'Sample Product', quantity: 1, price: 39.00 }
                ],
                shippingAddress: {
                    line1: '123 Main St',
                    city: 'Indianapolis',
                    state: 'IN',
                    postalCode: '46205',
                }
            });
        }, 1500);

        return () => clearTimeout(timer);
    }, [clearCart]);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0a0a0a] pt-32 pb-24 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 text-[#D4AF37] animate-spin mx-auto mb-4" />
                    <p className="text-white/60 font-urbanist">Processing your order...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-[#0a0a0a] pt-32 pb-24">
                <div className="max-w-2xl mx-auto px-8 text-center">
                    <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-6" />
                    <h1 className="text-3xl font-display text-white mb-4">Something Went Wrong</h1>
                    <p className="text-white/60 font-urbanist mb-8">{error}</p>
                    <Link
                        to="/offerings"
                        className="inline-flex items-center gap-2 text-[#D4AF37] hover:underline"
                    >
                        Return to Shop <ArrowRight size={16} />
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0a0a0a] pt-32 pb-24">
            <div className="max-w-3xl mx-auto px-8">
                {/* Success Header */}
                <div className="text-center mb-12">
                    <div className="w-20 h-20 bg-gradient-to-tr from-[#D4AF37] to-[#8B7322] rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-[#D4AF37]/20">
                        <CheckCircle className="w-10 h-10 text-black" />
                    </div>
                    <h1 className="text-4xl font-display text-white mb-4">Thank You!</h1>
                    <p className="text-white/60 font-urbanist text-lg">
                        Your order has been received and is being processed.
                    </p>
                </div>

                {/* Order Info Card */}
                <div className="bg-[#121212] border border-white/10 rounded-2xl p-8 mb-8">
                    <div className="flex items-center justify-between mb-6 pb-6 border-b border-white/10">
                        <div>
                            <p className="text-white/40 text-sm font-urbanist mb-1">Order Number</p>
                            <p className="text-xl font-display text-[#D4AF37]">{order?.orderNumber}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-white/40 text-sm font-urbanist mb-1">Total</p>
                            <p className="text-2xl font-display text-white">${order?.total.toFixed(2)}</p>
                        </div>
                    </div>

                    {/* Order Timeline */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-[#D4AF37]/20 flex items-center justify-center">
                                <CheckCircle className="w-5 h-5 text-[#D4AF37]" />
                            </div>
                            <div>
                                <p className="text-white font-medium">Order Confirmed</p>
                                <p className="text-white/40 text-sm font-urbanist">We've received your order</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                                <Package className="w-5 h-5 text-white/40" />
                            </div>
                            <div>
                                <p className="text-white/60">Processing</p>
                                <p className="text-white/40 text-sm font-urbanist">We're preparing your items</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                                <Truck className="w-5 h-5 text-white/40" />
                            </div>
                            <div>
                                <p className="text-white/60">Shipped</p>
                                <p className="text-white/40 text-sm font-urbanist">On the way to you</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Non-Profit Receipt Notice */}
                <div className="bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-xl p-6 mb-8">
                    <h3 className="text-[#D4AF37] font-display text-lg mb-2">Tax Receipt</h3>
                    <p className="text-white/70 text-sm font-urbanist">
                        A tax-deductible receipt will be sent to <span className="text-white">{order?.customerEmail}</span>.
                        Nefer Kali Healing is a 501(c)(3) non-profit organization (EIN: 99-3021724).
                    </p>
                </div>

                {/* Shipping Address */}
                {order?.shippingAddress && (
                    <div className="bg-[#121212] border border-white/10 rounded-xl p-6 mb-8">
                        <h3 className="text-white font-display mb-3">Shipping To</h3>
                        <p className="text-white/60 font-urbanist">
                            {order.customerName}<br />
                            {order.shippingAddress.line1}<br />
                            {order.shippingAddress.line2 && <>{order.shippingAddress.line2}<br /></>}
                            {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}
                        </p>
                    </div>
                )}

                {/* Continue Shopping */}
                <div className="text-center">
                    <Link
                        to="/offerings"
                        className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-[#D4AF37] to-[#8B7322] text-black font-bold text-sm uppercase tracking-[0.2em] rounded-full hover:shadow-2xl hover:shadow-[#D4AF37]/20 transition-all"
                    >
                        Continue Shopping <ArrowRight size={16} />
                    </Link>
                </div>

                {/* Contact Info */}
                <p className="text-center text-white/40 text-sm font-urbanist mt-8">
                    Questions about your order? Contact us at{' '}
                    <a href="mailto:asasa@neferkalihealing.org" className="text-[#D4AF37] hover:underline">
                        asasa@neferkalihealing.org
                    </a>
                </p>
            </div>
        </div>
    );
};

export default OrderConfirmation;
