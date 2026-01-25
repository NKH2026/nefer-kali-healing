import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { RefreshCw, Pause, Play, XCircle, Mail, Calendar, DollarSign, Search } from 'lucide-react';

interface Subscription {
    id: string;
    created_at: string;
    stripe_subscription_id: string;
    customer_email: string;
    customer_name: string;
    status: string;
    billing_interval: string;
    next_billing_date: string | null;
    recurring_amount: number;
    paused_at: string | null;
    cancelled_at: string | null;
}

const statusColors: Record<string, string> = {
    active: 'bg-green-500/20 text-green-400',
    paused: 'bg-yellow-500/20 text-yellow-400',
    cancelled: 'bg-red-500/20 text-red-400',
    past_due: 'bg-orange-500/20 text-orange-400',
};

const AdminSubscriptions: React.FC = () => {
    const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);

    useEffect(() => {
        fetchSubscriptions();
    }, [statusFilter]);

    const fetchSubscriptions = async () => {
        setLoading(true);
        try {
            let query = supabase
                .from('subscriptions')
                .select('*')
                .order('created_at', { ascending: false });

            if (statusFilter !== 'all') {
                query = query.eq('status', statusFilter);
            }

            const { data, error } = await query;
            if (error) throw error;
            setSubscriptions(data || []);
        } catch (error) {
            console.error('Error fetching subscriptions:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredSubscriptions = subscriptions.filter(sub => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
            sub.customer_email.toLowerCase().includes(query) ||
            sub.customer_name.toLowerCase().includes(query) ||
            sub.stripe_subscription_id.toLowerCase().includes(query)
        );
    });

    const formatDate = (dateString: string | null) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    const getIntervalLabel = (interval: string) => {
        const labels: Record<string, string> = {
            'every-2-weeks': 'Every 2 weeks',
            'monthly': 'Monthly',
            'every-3-months': 'Quarterly',
        };
        return labels[interval] || interval;
    };

    // Stats
    const stats = {
        total: subscriptions.length,
        active: subscriptions.filter(s => s.status === 'active').length,
        paused: subscriptions.filter(s => s.status === 'paused').length,
        mrr: subscriptions
            .filter(s => s.status === 'active')
            .reduce((sum, s) => sum + s.recurring_amount, 0),
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-white">Subscriptions</h1>
                <p className="text-gray-400 text-sm">Manage recurring customer subscriptions</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-[#1a1a1a] rounded-xl p-4 border border-white/5">
                    <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Total Subscriptions</p>
                    <p className="text-2xl font-bold text-white">{stats.total}</p>
                </div>
                <div className="bg-[#1a1a1a] rounded-xl p-4 border border-green-500/20">
                    <p className="text-green-400 text-xs uppercase tracking-wider mb-1">Active</p>
                    <p className="text-2xl font-bold text-green-400">{stats.active}</p>
                </div>
                <div className="bg-[#1a1a1a] rounded-xl p-4 border border-yellow-500/20">
                    <p className="text-yellow-400 text-xs uppercase tracking-wider mb-1">Paused</p>
                    <p className="text-2xl font-bold text-yellow-400">{stats.paused}</p>
                </div>
                <div className="bg-[#1a1a1a] rounded-xl p-4 border border-[#D4AF37]/20">
                    <p className="text-[#D4AF37] text-xs uppercase tracking-wider mb-1">Monthly Revenue</p>
                    <p className="text-2xl font-bold text-[#D4AF37]">${stats.mrr.toFixed(2)}</p>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search by email, name, or ID..."
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
                    <option value="active">Active</option>
                    <option value="paused">Paused</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="past_due">Past Due</option>
                </select>
            </div>

            {/* Subscriptions Table */}
            <div className="bg-[#1a1a1a] rounded-xl border border-white/5 overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center text-gray-400">Loading subscriptions...</div>
                ) : filteredSubscriptions.length === 0 ? (
                    <div className="p-8 text-center text-gray-400">
                        {searchQuery || statusFilter !== 'all'
                            ? 'No subscriptions match your filters'
                            : 'No subscriptions yet'}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-[#0f0f0f]">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Customer</th>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Frequency</th>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Amount</th>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Next Billing</th>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {filteredSubscriptions.map((sub) => (
                                    <tr key={sub.id} className="hover:bg-white/5 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div>
                                                <p className="text-white text-sm font-medium">{sub.customer_name}</p>
                                                <p className="text-gray-400 text-xs">{sub.customer_email}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-white text-sm flex items-center gap-2">
                                                <RefreshCw size={14} className="text-[#D4AF37]" />
                                                {getIntervalLabel(sub.billing_interval)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-[#D4AF37] font-medium">
                                            ${sub.recurring_amount.toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-gray-400 text-sm">
                                            {formatDate(sub.next_billing_date)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${statusColors[sub.status] || 'bg-gray-500/20 text-gray-400'}`}>
                                                {sub.status.charAt(0).toUpperCase() + sub.status.slice(1)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <button
                                                onClick={() => setSelectedSubscription(sub)}
                                                className="text-gray-400 hover:text-white transition-colors text-sm underline"
                                            >
                                                Manage
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Subscription Detail Modal */}
            {selectedSubscription && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-[#1a1a1a] rounded-2xl max-w-lg w-full">
                        <div className="p-6 border-b border-white/10">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-bold text-white">Subscription Details</h2>
                                <button
                                    onClick={() => setSelectedSubscription(null)}
                                    className="text-gray-400 hover:text-white transition-colors"
                                >
                                    ✕
                                </button>
                            </div>
                        </div>

                        <div className="p-6 space-y-4">
                            <div>
                                <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Customer</p>
                                <p className="text-white">{selectedSubscription.customer_name}</p>
                                <p className="text-gray-400 text-sm">{selectedSubscription.customer_email}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Amount</p>
                                    <p className="text-[#D4AF37] font-bold text-xl">${selectedSubscription.recurring_amount.toFixed(2)}</p>
                                </div>
                                <div>
                                    <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Frequency</p>
                                    <p className="text-white">{getIntervalLabel(selectedSubscription.billing_interval)}</p>
                                </div>
                            </div>

                            <div>
                                <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Status</p>
                                <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${statusColors[selectedSubscription.status]}`}>
                                    {selectedSubscription.status.charAt(0).toUpperCase() + selectedSubscription.status.slice(1)}
                                </span>
                            </div>

                            <div>
                                <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Next Billing</p>
                                <p className="text-white">{formatDate(selectedSubscription.next_billing_date)}</p>
                            </div>

                            <div>
                                <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Stripe ID</p>
                                <p className="text-gray-400 text-sm font-mono">{selectedSubscription.stripe_subscription_id}</p>
                            </div>

                            {/* Note about managing in Stripe */}
                            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mt-4">
                                <p className="text-blue-400 text-sm">
                                    To pause, resume, or cancel this subscription, use the{' '}
                                    <a
                                        href="https://dashboard.stripe.com/subscriptions"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="underline hover:text-blue-300"
                                    >
                                        Stripe Dashboard
                                    </a>
                                    . Changes will sync automatically.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminSubscriptions;
