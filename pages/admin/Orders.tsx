import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Package, Eye, Truck, Clock, CheckCircle, XCircle, Search, DollarSign, RotateCcw, X, Loader2, MapPin, Tag } from 'lucide-react';

interface OrderItem {
    id: string;
    product_title: string;
    variant_title: string | null;
    quantity: number;
    unit_price: number;
    total_price: number;
    image_url: string | null;
}

interface Order {
    id: string;
    order_number: string;
    created_at: string;
    status: string;
    payment_status: string;
    customer_email: string;
    customer_name: string;
    customer_phone: string | null;
    total: number;
    subtotal: number;
    shipping_cost: number;
    discount_amount: number;
    tracking_number: string | null;
    tracking_url: string | null;
    shipping_carrier: string | null;
    is_subscription_order: boolean;
    stripe_payment_intent_id: string | null;
    shipping_address_line1: string | null;
    shipping_address_line2: string | null;
    shipping_city: string | null;
    shipping_state: string | null;
    shipping_postal_code: string | null;
    coupon_code: string | null;
    internal_notes: string | null;
    shipped_at: string | null;
    delivered_at: string | null;
}

const statusColors: Record<string, string> = {
    pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    processing: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    shipped: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    delivered: 'bg-green-500/20 text-green-400 border-green-500/30',
    cancelled: 'bg-red-500/20 text-red-400 border-red-500/30',
    refunded: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
};

const paymentStatusColors: Record<string, string> = {
    pending: 'text-yellow-400',
    paid: 'text-green-400',
    failed: 'text-red-400',
    refunded: 'text-gray-400',
};

const statusIcons: Record<string, React.ReactNode> = {
    pending: <Clock size={14} />,
    processing: <Package size={14} />,
    shipped: <Truck size={14} />,
    delivered: <CheckCircle size={14} />,
    cancelled: <XCircle size={14} />,
    refunded: <RotateCcw size={14} />,
};

const Orders: React.FC = () => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
    const [loadingItems, setLoadingItems] = useState(false);

    // Modal states
    const [showShipModal, setShowShipModal] = useState(false);
    const [showRefundModal, setShowRefundModal] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);

    // Form states
    const [trackingNumber, setTrackingNumber] = useState('');
    const [trackingUrl, setTrackingUrl] = useState('');
    const [refundAmount, setRefundAmount] = useState('');
    const [refundReason, setRefundReason] = useState('');
    const [isFullRefund, setIsFullRefund] = useState(true);
    const [internalNotes, setInternalNotes] = useState('');

    // Action states
    const [actionLoading, setActionLoading] = useState(false);
    const [actionError, setActionError] = useState<string | null>(null);
    const [actionSuccess, setActionSuccess] = useState<string | null>(null);
    const [sendEmailNotification, setSendEmailNotification] = useState(true);

    // Helper: Send order email notification
    const sendOrderEmail = async (orderId: string, emailType: 'shipping' | 'refund' | 'cancellation', extraData?: Record<string, any>) => {
        try {
            const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://rwvdvobopcfzalfausxg.supabase.co';
            const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

            await fetch(`${supabaseUrl}/functions/v1/send-order-email`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${supabaseAnonKey}`,
                },
                body: JSON.stringify({
                    orderId,
                    emailType,
                    ...extraData,
                }),
            });
            console.log(`${emailType} email sent for order ${orderId}`);
        } catch (error) {
            console.error('Failed to send email:', error);
            // Don't throw - email failure shouldn't block the action
        }
    };

    useEffect(() => {
        fetchOrders();
    }, [statusFilter]);

    useEffect(() => {
        if (selectedOrder) {
            fetchOrderItems(selectedOrder.id);
            setInternalNotes(selectedOrder.internal_notes || '');
        }
    }, [selectedOrder]);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            let query = supabase
                .from('orders')
                .select('*')
                .order('created_at', { ascending: false });

            if (statusFilter !== 'all') {
                query = query.eq('status', statusFilter);
            }

            const { data, error } = await query;

            if (error) throw error;
            setOrders(data || []);
        } catch (error) {
            console.error('Error fetching orders:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchOrderItems = async (orderId: string) => {
        setLoadingItems(true);
        try {
            const { data, error } = await supabase
                .from('order_items')
                .select('*')
                .eq('order_id', orderId);

            if (error) throw error;
            setOrderItems(data || []);
        } catch (error) {
            console.error('Error fetching order items:', error);
        } finally {
            setLoadingItems(false);
        }
    };

    const updateOrderStatus = async (orderId: string, newStatus: string, additionalData?: Record<string, any>) => {
        setActionLoading(true);
        setActionError(null);
        try {
            const updateData: Record<string, any> = {
                status: newStatus,
                ...additionalData
            };

            // Set timestamps based on status
            if (newStatus === 'shipped') {
                updateData.shipped_at = new Date().toISOString();
            } else if (newStatus === 'delivered') {
                updateData.delivered_at = new Date().toISOString();
            }

            const { error } = await supabase
                .from('orders')
                .update(updateData)
                .eq('id', orderId);

            if (error) throw error;

            setActionSuccess(`Order marked as ${newStatus}`);
            await fetchOrders();

            // Update selected order if it exists
            if (selectedOrder?.id === orderId) {
                const { data } = await supabase
                    .from('orders')
                    .select('*')
                    .eq('id', orderId)
                    .single();
                if (data) setSelectedOrder(data);
            }

            // Send email notifications based on status change
            if (sendEmailNotification) {
                if (newStatus === 'shipped' && additionalData?.tracking_number) {
                    await sendOrderEmail(orderId, 'shipping', {
                        trackingNumber: additionalData.tracking_number,
                        trackingUrl: additionalData.tracking_url,
                    });
                    setActionSuccess('Order marked as shipped & email sent');
                } else if (newStatus === 'cancelled') {
                    await sendOrderEmail(orderId, 'cancellation');
                    setActionSuccess('Order cancelled & email sent');
                }
            }

            // Clear modals
            setShowShipModal(false);
            setShowCancelModal(false);
            setTrackingNumber('');
            setTrackingUrl('');

            setTimeout(() => setActionSuccess(null), 3000);
        } catch (error: any) {
            console.error('Error updating order:', error);
            setActionError(error.message || 'Failed to update order');
        } finally {
            setActionLoading(false);
        }
    };

    const processRefund = async () => {
        if (!selectedOrder) return;

        setActionLoading(true);
        setActionError(null);

        try {
            const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://rwvdvobopcfzalfausxg.supabase.co';
            const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

            const response = await fetch(`${supabaseUrl}/functions/v1/refund-order`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${supabaseAnonKey}`,
                },
                body: JSON.stringify({
                    orderId: selectedOrder.id,
                    amount: isFullRefund ? null : parseFloat(refundAmount),
                    reason: refundReason,
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Refund failed');
            }

            setActionSuccess(`Refund processed successfully`);
            setShowRefundModal(false);
            setRefundAmount('');
            setRefundReason('');
            setIsFullRefund(true);

            await fetchOrders();
            if (selectedOrder) {
                const { data } = await supabase
                    .from('orders')
                    .select('*')
                    .eq('id', selectedOrder.id)
                    .single();
                if (data) setSelectedOrder(data);
            }

            // Send refund email notification
            if (sendEmailNotification) {
                await sendOrderEmail(selectedOrder.id, 'refund', {
                    refundAmount: isFullRefund ? selectedOrder.total : parseFloat(refundAmount),
                    isFullRefund,
                    reason: refundReason,
                });
                setActionSuccess('Refund processed & email sent');
            }

            setTimeout(() => setActionSuccess(null), 3000);
        } catch (error: any) {
            console.error('Refund error:', error);
            setActionError(error.message || 'Failed to process refund');
        } finally {
            setActionLoading(false);
        }
    };

    const saveInternalNotes = async () => {
        if (!selectedOrder) return;

        try {
            const { error } = await supabase
                .from('orders')
                .update({ internal_notes: internalNotes })
                .eq('id', selectedOrder.id);

            if (error) throw error;
            setActionSuccess('Notes saved');
            setTimeout(() => setActionSuccess(null), 2000);
        } catch (error) {
            console.error('Error saving notes:', error);
        }
    };

    const filteredOrders = orders.filter(order => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
            order.order_number.toLowerCase().includes(query) ||
            order.customer_email.toLowerCase().includes(query) ||
            order.customer_name.toLowerCase().includes(query)
        );
    });

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
        });
    };

    const formatShortDate = (dateString: string | null) => {
        if (!dateString) return null;
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
        });
    };

    // Stats
    const stats = {
        total: orders.length,
        pending: orders.filter(o => o.status === 'pending').length,
        processing: orders.filter(o => o.status === 'processing').length,
        shipped: orders.filter(o => o.status === 'shipped').length,
        delivered: orders.filter(o => o.status === 'delivered').length,
    };

    const closeDetailModal = () => {
        setSelectedOrder(null);
        setOrderItems([]);
        setActionError(null);
        setActionSuccess(null);
    };

    return (
        <div className="space-y-6">
            {/* Success/Error Toast */}
            {(actionSuccess || actionError) && (
                <div className={`fixed top-4 right-4 z-[100] px-4 py-3 rounded-lg shadow-lg ${actionSuccess ? 'bg-green-500/20 border border-green-500/30 text-green-400' :
                    'bg-red-500/20 border border-red-500/30 text-red-400'
                    }`}>
                    {actionSuccess || actionError}
                </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Orders</h1>
                    <p className="text-gray-400 text-sm">Manage customer orders and shipments</p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="bg-[#1a1a1a] rounded-xl p-4 border border-white/5">
                    <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Total Orders</p>
                    <p className="text-2xl font-bold text-white">{stats.total}</p>
                </div>
                <div className="bg-[#1a1a1a] rounded-xl p-4 border border-yellow-500/20">
                    <p className="text-yellow-400 text-xs uppercase tracking-wider mb-1">Pending</p>
                    <p className="text-2xl font-bold text-yellow-400">{stats.pending}</p>
                </div>
                <div className="bg-[#1a1a1a] rounded-xl p-4 border border-blue-500/20">
                    <p className="text-blue-400 text-xs uppercase tracking-wider mb-1">Processing</p>
                    <p className="text-2xl font-bold text-blue-400">{stats.processing}</p>
                </div>
                <div className="bg-[#1a1a1a] rounded-xl p-4 border border-purple-500/20">
                    <p className="text-purple-400 text-xs uppercase tracking-wider mb-1">Shipped</p>
                    <p className="text-2xl font-bold text-purple-400">{stats.shipped}</p>
                </div>
                <div className="bg-[#1a1a1a] rounded-xl p-4 border border-green-500/20">
                    <p className="text-green-400 text-xs uppercase tracking-wider mb-1">Delivered</p>
                    <p className="text-2xl font-bold text-green-400">{stats.delivered}</p>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search by order #, name, or email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-500 focus:border-[#D4AF37] focus:outline-none"
                    />
                </div>
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="bg-[#1a1a1a] border border-white/10 rounded-lg px-4 py-3 text-white focus:border-[#D4AF37] focus:outline-none"
                >
                    <option value="all">All Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="processing">Processing</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="refunded">Refunded</option>
                </select>
            </div>

            {/* Orders Table */}
            <div className="bg-[#1a1a1a] rounded-xl border border-white/5 overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center text-gray-400">Loading orders...</div>
                ) : filteredOrders.length === 0 ? (
                    <div className="p-8 text-center text-gray-400">
                        {searchQuery || statusFilter !== 'all'
                            ? 'No orders match your filters'
                            : 'No orders yet'}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-[#0f0f0f]">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Order</th>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Customer</th>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Date</th>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Total</th>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Payment</th>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {filteredOrders.map((order) => (
                                    <tr key={order.id} className="hover:bg-white/5 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <span className="text-[#D4AF37] font-medium">{order.order_number}</span>
                                                {order.is_subscription_order && (
                                                    <span className="text-[8px] bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full uppercase">
                                                        Sub
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div>
                                                <p className="text-white text-sm">{order.customer_name}</p>
                                                <p className="text-gray-400 text-xs">{order.customer_email}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-gray-400 text-sm">
                                            {formatDate(order.created_at)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-white font-medium">
                                            ${order.total.toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`text-xs font-medium capitalize ${paymentStatusColors[order.payment_status] || 'text-gray-400'}`}>
                                                {order.payment_status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${statusColors[order.status] || 'bg-gray-500/20 text-gray-400'}`}>
                                                {statusIcons[order.status]}
                                                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <button
                                                onClick={() => setSelectedOrder(order)}
                                                className="text-gray-400 hover:text-white transition-colors p-2 bg-white/5 rounded-lg hover:bg-white/10"
                                                title="View Details"
                                            >
                                                <Eye size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Order Detail Modal */}
            {selectedOrder && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-[#1a1a1a] rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        {/* Modal Header */}
                        <div className="sticky top-0 bg-[#1a1a1a] p-6 border-b border-white/10 z-10">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-xl font-bold text-white flex items-center gap-3">
                                        Order {selectedOrder.order_number}
                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${statusColors[selectedOrder.status]}`}>
                                            {statusIcons[selectedOrder.status]}
                                            {selectedOrder.status.charAt(0).toUpperCase() + selectedOrder.status.slice(1)}
                                        </span>
                                    </h2>
                                    <p className="text-gray-400 text-sm">{formatDate(selectedOrder.created_at)}</p>
                                </div>
                                <button
                                    onClick={closeDetailModal}
                                    className="text-gray-400 hover:text-white transition-colors p-2"
                                >
                                    <X size={24} />
                                </button>
                            </div>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Quick Actions */}
                            <div className="flex flex-wrap gap-3">
                                {selectedOrder.status === 'pending' && (
                                    <button
                                        onClick={() => updateOrderStatus(selectedOrder.id, 'processing')}
                                        disabled={actionLoading}
                                        className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors text-sm font-medium"
                                    >
                                        <Package size={16} /> Mark Processing
                                    </button>
                                )}

                                {(selectedOrder.status === 'pending' || selectedOrder.status === 'processing') && (
                                    <button
                                        onClick={() => setShowShipModal(true)}
                                        disabled={actionLoading}
                                        className="flex items-center gap-2 px-4 py-2 bg-purple-500/20 text-purple-400 rounded-lg hover:bg-purple-500/30 transition-colors text-sm font-medium"
                                    >
                                        <Truck size={16} /> Mark Shipped
                                    </button>
                                )}

                                {selectedOrder.status === 'shipped' && (
                                    <button
                                        onClick={() => updateOrderStatus(selectedOrder.id, 'delivered')}
                                        disabled={actionLoading}
                                        className="flex items-center gap-2 px-4 py-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors text-sm font-medium"
                                    >
                                        <CheckCircle size={16} /> Mark Delivered
                                    </button>
                                )}

                                {selectedOrder.status !== 'cancelled' && selectedOrder.status !== 'refunded' && (
                                    <button
                                        onClick={() => setShowCancelModal(true)}
                                        disabled={actionLoading}
                                        className="flex items-center gap-2 px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors text-sm font-medium"
                                    >
                                        <XCircle size={16} /> Cancel Order
                                    </button>
                                )}

                                {selectedOrder.payment_status === 'paid' && selectedOrder.status !== 'refunded' && (
                                    <button
                                        onClick={() => setShowRefundModal(true)}
                                        disabled={actionLoading}
                                        className="flex items-center gap-2 px-4 py-2 bg-gray-500/20 text-gray-400 rounded-lg hover:bg-gray-500/30 transition-colors text-sm font-medium"
                                    >
                                        <DollarSign size={16} /> Issue Refund
                                    </button>
                                )}
                            </div>

                            <div className="grid md:grid-cols-2 gap-6">
                                {/* Left Column */}
                                <div className="space-y-6">
                                    {/* Customer Info */}
                                    <div className="bg-[#0f0f0f] rounded-xl p-4">
                                        <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                            <MapPin size={14} /> Customer & Shipping
                                        </h3>
                                        <div className="space-y-2">
                                            <p className="text-white font-medium">{selectedOrder.customer_name}</p>
                                            <p className="text-gray-400 text-sm">{selectedOrder.customer_email}</p>
                                            {selectedOrder.customer_phone && (
                                                <p className="text-gray-400 text-sm">{selectedOrder.customer_phone}</p>
                                            )}
                                            {selectedOrder.shipping_address_line1 && (
                                                <div className="pt-2 border-t border-white/10 mt-3">
                                                    <p className="text-white text-sm">{selectedOrder.shipping_address_line1}</p>
                                                    {selectedOrder.shipping_address_line2 && (
                                                        <p className="text-gray-400 text-sm">{selectedOrder.shipping_address_line2}</p>
                                                    )}
                                                    <p className="text-gray-400 text-sm">
                                                        {selectedOrder.shipping_city}, {selectedOrder.shipping_state} {selectedOrder.shipping_postal_code}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Order Items */}
                                    <div className="bg-[#0f0f0f] rounded-xl p-4">
                                        <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-3">Order Items</h3>
                                        {loadingItems ? (
                                            <div className="text-gray-400 text-sm">Loading items...</div>
                                        ) : orderItems.length === 0 ? (
                                            <div className="text-gray-400 text-sm">No items found</div>
                                        ) : (
                                            <div className="space-y-3">
                                                {orderItems.map((item) => (
                                                    <div key={item.id} className="flex gap-3 items-center">
                                                        {item.image_url && (
                                                            <img
                                                                src={item.image_url}
                                                                alt={item.product_title}
                                                                className="w-12 h-12 rounded-lg object-cover bg-[#1a1a1a]"
                                                            />
                                                        )}
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-white text-sm truncate">{item.product_title}</p>
                                                            {item.variant_title && (
                                                                <p className="text-gray-500 text-xs">{item.variant_title}</p>
                                                            )}
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-white text-sm">×{item.quantity}</p>
                                                            <p className="text-[#D4AF37] text-sm">${item.total_price.toFixed(2)}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Right Column */}
                                <div className="space-y-6">
                                    {/* Order Summary */}
                                    <div className="bg-[#0f0f0f] rounded-xl p-4">
                                        <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                            <DollarSign size={14} /> Payment Summary
                                        </h3>
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-400">Subtotal</span>
                                                <span className="text-white">${selectedOrder.subtotal?.toFixed(2) || '—'}</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-400">Shipping</span>
                                                <span className="text-white">${selectedOrder.shipping_cost?.toFixed(2) || '0.00'}</span>
                                            </div>
                                            {selectedOrder.discount_amount > 0 && (
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-gray-400">Discount</span>
                                                    <span className="text-green-400">-${selectedOrder.discount_amount.toFixed(2)}</span>
                                                </div>
                                            )}
                                            <div className="flex justify-between text-lg font-bold pt-2 border-t border-white/10">
                                                <span className="text-white">Total</span>
                                                <span className="text-[#D4AF37]">${selectedOrder.total.toFixed(2)}</span>
                                            </div>
                                            <div className="pt-2">
                                                <span className={`text-xs font-medium capitalize ${paymentStatusColors[selectedOrder.payment_status]}`}>
                                                    Payment: {selectedOrder.payment_status}
                                                </span>
                                            </div>
                                            {selectedOrder.coupon_code && (
                                                <div className="flex items-center gap-2 pt-2">
                                                    <Tag size={12} className="text-[#D4AF37]" />
                                                    <span className="text-xs text-[#D4AF37]">{selectedOrder.coupon_code}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Shipping/Tracking Info */}
                                    {(selectedOrder.tracking_number || selectedOrder.shipped_at) && (
                                        <div className="bg-[#0f0f0f] rounded-xl p-4">
                                            <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                                <Truck size={14} /> Shipping Info
                                            </h3>
                                            <div className="space-y-2">
                                                {selectedOrder.tracking_number && (
                                                    <div>
                                                        <p className="text-gray-400 text-xs">Tracking Number</p>
                                                        <p className="text-white font-mono text-sm">{selectedOrder.tracking_number}</p>
                                                    </div>
                                                )}
                                                {selectedOrder.tracking_url && (
                                                    <a
                                                        href={selectedOrder.tracking_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-[#D4AF37] text-sm hover:underline"
                                                    >
                                                        Track Package →
                                                    </a>
                                                )}
                                                {selectedOrder.shipped_at && (
                                                    <p className="text-gray-400 text-xs">
                                                        Shipped: {formatShortDate(selectedOrder.shipped_at)}
                                                    </p>
                                                )}
                                                {selectedOrder.delivered_at && (
                                                    <p className="text-green-400 text-xs">
                                                        Delivered: {formatShortDate(selectedOrder.delivered_at)}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Internal Notes */}
                                    <div className="bg-[#0f0f0f] rounded-xl p-4">
                                        <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-3">Internal Notes</h3>
                                        <textarea
                                            value={internalNotes}
                                            onChange={(e) => setInternalNotes(e.target.value)}
                                            onBlur={saveInternalNotes}
                                            placeholder="Add notes about this order..."
                                            className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500 focus:border-[#D4AF37] focus:outline-none resize-none h-24"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Ship Modal */}
            {showShipModal && selectedOrder && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
                    <div className="bg-[#1a1a1a] rounded-2xl max-w-md w-full p-6">
                        <h3 className="text-lg font-bold text-white mb-4">Mark as Shipped</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm text-gray-400 mb-2">Tracking Number *</label>
                                <input
                                    type="text"
                                    value={trackingNumber}
                                    onChange={(e) => setTrackingNumber(e.target.value)}
                                    placeholder="9400111899223..."
                                    className="w-full bg-[#0f0f0f] border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-[#D4AF37] focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400 mb-2">Tracking URL (optional)</label>
                                <input
                                    type="text"
                                    value={trackingUrl}
                                    onChange={(e) => setTrackingUrl(e.target.value)}
                                    placeholder="https://tools.usps.com/go/TrackConfirmAction?..."
                                    className="w-full bg-[#0f0f0f] border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-[#D4AF37] focus:outline-none"
                                />
                            </div>
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => {
                                    setShowShipModal(false);
                                    setTrackingNumber('');
                                    setTrackingUrl('');
                                }}
                                className="flex-1 px-4 py-3 border border-white/10 text-white rounded-lg hover:bg-white/5 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    updateOrderStatus(selectedOrder.id, 'shipped', {
                                        tracking_number: trackingNumber,
                                        tracking_url: trackingUrl || null,
                                        shipping_carrier: 'USPS',
                                    });
                                }}
                                disabled={!trackingNumber || actionLoading}
                                className="flex-1 px-4 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {actionLoading ? <Loader2 size={18} className="animate-spin" /> : <Truck size={18} />}
                                Mark Shipped
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Cancel Modal */}
            {showCancelModal && selectedOrder && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
                    <div className="bg-[#1a1a1a] rounded-2xl max-w-md w-full p-6">
                        <h3 className="text-lg font-bold text-white mb-2">Cancel Order</h3>
                        <p className="text-gray-400 text-sm mb-4">
                            Are you sure you want to cancel order {selectedOrder.order_number}? This action cannot be undone.
                        </p>
                        {selectedOrder.payment_status === 'paid' && (
                            <p className="text-yellow-400 text-sm mb-4 bg-yellow-500/10 px-3 py-2 rounded-lg">
                                ⚠️ This order has been paid. You may want to issue a refund after cancelling.
                            </p>
                        )}
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowCancelModal(false)}
                                className="flex-1 px-4 py-3 border border-white/10 text-white rounded-lg hover:bg-white/5 transition-colors"
                            >
                                Keep Order
                            </button>
                            <button
                                onClick={() => updateOrderStatus(selectedOrder.id, 'cancelled')}
                                disabled={actionLoading}
                                className="flex-1 px-4 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {actionLoading ? <Loader2 size={18} className="animate-spin" /> : <XCircle size={18} />}
                                Cancel Order
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Refund Modal */}
            {showRefundModal && selectedOrder && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
                    <div className="bg-[#1a1a1a] rounded-2xl max-w-md w-full p-6">
                        <h3 className="text-lg font-bold text-white mb-4">Issue Refund</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input
                                        type="radio"
                                        checked={isFullRefund}
                                        onChange={() => setIsFullRefund(true)}
                                        className="w-4 h-4 accent-[#D4AF37]"
                                    />
                                    <span className="text-white">Full Refund (${selectedOrder.total.toFixed(2)})</span>
                                </label>
                            </div>
                            <div>
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input
                                        type="radio"
                                        checked={!isFullRefund}
                                        onChange={() => setIsFullRefund(false)}
                                        className="w-4 h-4 accent-[#D4AF37]"
                                    />
                                    <span className="text-white">Partial Refund</span>
                                </label>
                            </div>
                            {!isFullRefund && (
                                <div>
                                    <label className="block text-sm text-gray-400 mb-2">Refund Amount ($)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0.01"
                                        max={selectedOrder.total}
                                        value={refundAmount}
                                        onChange={(e) => setRefundAmount(e.target.value)}
                                        placeholder="0.00"
                                        className="w-full bg-[#0f0f0f] border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-[#D4AF37] focus:outline-none"
                                    />
                                </div>
                            )}
                            <div>
                                <label className="block text-sm text-gray-400 mb-2">Reason (optional)</label>
                                <textarea
                                    value={refundReason}
                                    onChange={(e) => setRefundReason(e.target.value)}
                                    placeholder="Reason for refund..."
                                    className="w-full bg-[#0f0f0f] border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-[#D4AF37] focus:outline-none resize-none h-20"
                                />
                            </div>
                            {actionError && (
                                <p className="text-red-400 text-sm">{actionError}</p>
                            )}
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => {
                                    setShowRefundModal(false);
                                    setRefundAmount('');
                                    setRefundReason('');
                                    setIsFullRefund(true);
                                    setActionError(null);
                                }}
                                className="flex-1 px-4 py-3 border border-white/10 text-white rounded-lg hover:bg-white/5 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={processRefund}
                                disabled={(!isFullRefund && !refundAmount) || actionLoading}
                                className="flex-1 px-4 py-3 bg-[#D4AF37] text-black font-medium rounded-lg hover:bg-[#B8972E] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {actionLoading ? <Loader2 size={18} className="animate-spin" /> : <DollarSign size={18} />}
                                Process Refund
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Orders;
