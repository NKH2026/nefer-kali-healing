import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Plus, Edit2, Trash2, Tag, TrendingUp, Power, PowerOff, Search } from 'lucide-react';

interface Coupon {
    id: string;
    code: string;
    name: string;
    discount_type: string;
    discount_value: number;
    is_active: boolean;
    current_usage: number;
    usage_limit: number | null;
    end_date: string | null;
    minimum_purchase: number | null;
}

interface CouponListProps {
    onEdit: (id: string) => void;
    onNew: () => void;
}

export const CouponList = ({ onEdit, onNew }: CouponListProps) => {
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive' | 'expired'>('all');

    useEffect(() => {
        fetchCoupons();
    }, []);

    const fetchCoupons = async () => {
        try {
            const { data, error } = await supabase
                .from('coupons')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setCoupons(data || []);
        } catch (error) {
            console.error('Error fetching coupons:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleActive = async (id: string, currentStatus: boolean) => {
        try {
            const { error } = await supabase
                .from('coupons')
                .update({ is_active: !currentStatus })
                .eq('id', id);

            if (error) throw error;
            fetchCoupons();
        } catch (error) {
            console.error('Error toggling coupon status:', error);
            alert('Failed to update coupon status');
        }
    };

    const deleteCoupon = async (id: string, code: string) => {
        if (!confirm(`Are you sure you want to delete coupon "${code}"? This action cannot be undone.`)) {
            return;
        }

        try {
            const { error } = await supabase
                .from('coupons')
                .delete()
                .eq('id', id);

            if (error) throw error;
            fetchCoupons();
            alert('Coupon deleted successfully');
        } catch (error) {
            console.error('Error deleting coupon:', error);
            alert('Failed to delete coupon');
        }
    };

    const getDiscountDisplay = (coupon: Coupon) => {
        if (coupon.discount_type === 'percentage') {
            return `${coupon.discount_value}% off`;
        } else if (coupon.discount_type === 'fixed_amount') {
            return `$${coupon.discount_value} off`;
        } else if (coupon.discount_type === 'free_shipping') {
            return 'Free Shipping';
        }
        return '-';
    };

    const isExpired = (coupon: Coupon) => {
        if (!coupon.end_date) return false;
        return new Date(coupon.end_date) < new Date();
    };

    const isLimitReached = (coupon: Coupon) => {
        if (!coupon.usage_limit) return false;
        return coupon.current_usage >= coupon.usage_limit;
    };

    const filteredCoupons = coupons.filter(coupon => {
        // Search filter
        if (searchTerm && !coupon.code.toLowerCase().includes(searchTerm.toLowerCase()) &&
            !coupon.name.toLowerCase().includes(searchTerm.toLowerCase())) {
            return false;
        }

        // Status filter
        if (filterStatus === 'active' && (!coupon.is_active || isExpired(coupon))) return false;
        if (filterStatus === 'inactive' && coupon.is_active) return false;
        if (filterStatus === 'expired' && !isExpired(coupon)) return false;

        return true;
    });

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-black via-purple-900/10 to-black flex items-center justify-center">
                <div className="text-white/60 font-urbanist">Loading coupons...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-black via-purple-900/10 to-black p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-4xl font-cinzel text-white mb-2">Coupons</h1>
                        <p className="text-gray-400 font-urbanist">Manage discount codes and promotions</p>
                    </div>
                    <button
                        onClick={onNew}
                        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-urbanist font-bold rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all"
                    >
                        <Plus size={20} />
                        New Coupon
                    </button>
                </div>

                {/* Filters */}
                <div className="bg-white/5 border border-white/10 rounded-lg p-4 mb-6">
                    <div className="flex gap-4">
                        <div className="flex-1">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={18} />
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Search by code or name..."
                                    className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-3 py-2 text-sm text-gray-300 focus:border-purple-500/50 focus:outline-none placeholder-gray-600 font-urbanist"
                                />
                            </div>
                        </div>
                        <div className="flex gap-2">
                            {['all', 'active', 'inactive', 'expired'].map((status) => (
                                <button
                                    key={status}
                                    onClick={() => setFilterStatus(status as any)}
                                    className={`px-4 py-2 rounded-lg text-sm font-urbanist transition-all ${filterStatus === status
                                            ? 'bg-purple-600 text-white'
                                            : 'bg-white/5 text-gray-400 hover:bg-white/10'
                                        }`}
                                >
                                    {status.charAt(0).toUpperCase() + status.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Coupon List */}
                {filteredCoupons.length === 0 ? (
                    <div className="bg-white/5 border border-white/10 rounded-lg p-12 text-center">
                        <Tag className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                        <h3 className="text-xl text-gray-400 font-urbanist mb-2">No coupons found</h3>
                        <p className="text-gray-500 font-urbanist mb-6">
                            {searchTerm || filterStatus !== 'all'
                                ? 'Try adjusting your filters'
                                : 'Create your first coupon to get started'}
                        </p>
                        {!searchTerm && filterStatus === 'all' && (
                            <button
                                onClick={onNew}
                                className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white font-urbanist rounded-lg transition-colors"
                            >
                                Create Coupon
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="bg-white/5 border border-white/10 rounded-lg overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-white/5 border-b border-white/10">
                                    <tr>
                                        <th className="text-left px-6 py-4 text-xs text-gray-500 uppercase tracking-wider font-urbanist">Code</th>
                                        <th className="text-left px-6 py-4 text-xs text-gray-500 uppercase tracking-wider font-urbanist">Name</th>
                                        <th className="text-left px-6 py-4 text-xs text-gray-500 uppercase tracking-wider font-urbanist">Discount</th>
                                        <th className="text-left px-6 py-4 text-xs text-gray-500 uppercase tracking-wider font-urbanist">Usage</th>
                                        <th className="text-left px-6 py-4 text-xs text-gray-500 uppercase tracking-wider font-urbanist">Status</th>
                                        <th className="text-right px-6 py-4 text-xs text-gray-500 uppercase tracking-wider font-urbanist">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/10">
                                    {filteredCoupons.map((coupon) => (
                                        <tr key={coupon.id} className="hover:bg-white/5 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <Tag className="text-purple-400" size={16} />
                                                    <span className="font-mono text-white font-bold">{coupon.code}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-gray-300 font-urbanist">{coupon.name}</div>
                                                {coupon.minimum_purchase && (
                                                    <div className="text-xs text-gray-500 font-urbanist">
                                                        Min: ${coupon.minimum_purchase}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-purple-400 font-urbanist font-medium">
                                                    {getDiscountDisplay(coupon)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <TrendingUp className="text-gray-500" size={14} />
                                                    <span className="text-gray-300 font-urbanist text-sm">
                                                        {coupon.current_usage}{coupon.usage_limit ? ` / ${coupon.usage_limit}` : ''}
                                                    </span>
                                                </div>
                                                {isLimitReached(coupon) && (
                                                    <div className="text-xs text-orange-400 font-urbanist mt-1">
                                                        Limit reached
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col gap-1">
                                                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-urbanist w-fit ${coupon.is_active && !isExpired(coupon)
                                                            ? 'bg-green-500/20 text-green-400'
                                                            : 'bg-gray-500/20 text-gray-400'
                                                        }`}>
                                                        {coupon.is_active && !isExpired(coupon) ? 'Active' : 'Inactive'}
                                                    </span>
                                                    {isExpired(coupon) && (
                                                        <span className="text-xs text-red-400 font-urbanist">
                                                            Expired
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => toggleActive(coupon.id, coupon.is_active)}
                                                        className={`p-2 rounded-lg transition-colors ${coupon.is_active
                                                                ? 'text-green-400 hover:bg-green-500/20'
                                                                : 'text-gray-500 hover:bg-gray-500/20'
                                                            }`}
                                                        title={coupon.is_active ? 'Deactivate' : 'Activate'}
                                                    >
                                                        {coupon.is_active ? <Power size={18} /> : <PowerOff size={18} />}
                                                    </button>
                                                    <button
                                                        onClick={() => onEdit(coupon.id)}
                                                        className="p-2 text-purple-400 hover:bg-purple-500/20 rounded-lg transition-colors"
                                                        title="Edit"
                                                    >
                                                        <Edit2 size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => deleteCoupon(coupon.id, coupon.code)}
                                                        className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                                                        title="Delete"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CouponList;
