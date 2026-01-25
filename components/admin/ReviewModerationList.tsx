import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Star, Check, X, Upload, Eye, MessageSquare, Package, Search, Filter, Edit } from 'lucide-react';

interface Review {
    id: string;
    product_id: string | null;
    customer_name: string;
    customer_email: string;
    rating: number;
    title: string;
    review_text: string;
    is_general_testimonial: boolean;
    is_verified_buyer: boolean;
    status: 'pending' | 'approved' | 'rejected';
    created_at: string;
    reviewed_at: string;
    products?: { title: string };
}

interface ReviewModerationListProps {
    onImport: () => void;
    onAddManual: () => void;
    onEdit: (reviewId: string) => void;
}

export const ReviewModerationList = ({ onImport, onAddManual, onEdit }: ReviewModerationListProps) => {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
    const [search, setSearch] = useState('');

    useEffect(() => {
        fetchReviews();
    }, [filter]);

    const fetchReviews = async () => {
        try {
            let query = supabase
                .from('reviews')
                .select('*, products(title)')
                .order('created_at', { ascending: false });

            if (filter !== 'all') {
                query = query.eq('status', filter);
            }

            const { data, error } = await query;
            if (error) throw error;
            setReviews(data || []);
        } catch (error) {
            console.error('Error fetching reviews:', error);
        } finally {
            setLoading(false);
        }
    };

    const updateReviewStatus = async (id: string, newStatus: 'approved' | 'rejected') => {
        try {
            const { error } = await supabase
                .from('reviews')
                .update({ status: newStatus })
                .eq('id', id);

            if (error) throw error;
            fetchReviews();
        } catch (error) {
            console.error('Error updating review:', error);
            alert('Failed to update review status');
        }
    };

    const filteredReviews = reviews.filter(review => {
        if (!search) return true;
        return review.customer_name.toLowerCase().includes(search.toLowerCase()) ||
            review.review_text.toLowerCase().includes(search.toLowerCase()) ||
            review.products?.title?.toLowerCase().includes(search.toLowerCase());
    });

    const pendingCount = reviews.filter(r => r.status === 'pending').length;

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-black via-purple-900/10 to-black flex items-center justify-center">
                <div className="text-white/60 font-urbanist">Loading reviews...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-black via-purple-900/10 to-black p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-4xl font-cinzel text-white mb-2">Review Management</h1>
                        <p className="text-gray-400 font-urbanist">
                            Moderate customer reviews and testimonials
                            {pendingCount > 0 && (
                                <span className="ml-2 px-2 py-1 bg-orange-500/20 text-orange-400 rounded text-sm">
                                    {pendingCount} pending
                                </span>
                            )}
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={onAddManual}
                            className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-urbanist font-bold rounded-lg transition-all"
                        >
                            <MessageSquare size={20} />
                            Add Review
                        </button>
                        <button
                            onClick={onImport}
                            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-urbanist font-bold rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all"
                        >
                            <Upload size={20} />
                            Import Reviews
                        </button>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white/5 border border-white/10 rounded-lg p-4 mb-6">
                    <div className="flex gap-4">
                        <div className="flex-1">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={18} />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Search reviews..."
                                    className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-3 py-2 text-sm text-gray-300 focus:border-purple-500/50 focus:outline-none placeholder-gray-600 font-urbanist"
                                />
                            </div>
                        </div>
                        <div className="flex gap-2">
                            {(['pending', 'approved', 'rejected', 'all'] as const).map((status) => (
                                <button
                                    key={status}
                                    onClick={() => setFilter(status)}
                                    className={`px-4 py-2 rounded-lg text-sm font-urbanist transition-all ${filter === status
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

                {/* Reviews List */}
                {filteredReviews.length === 0 ? (
                    <div className="bg-white/5 border border-white/10 rounded-lg p-12 text-center">
                        <MessageSquare className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                        <h3 className="text-xl text-gray-400 font-urbanist mb-2">No reviews found</h3>
                        <p className="text-gray-500 font-urbanist">
                            {filter === 'pending' ? 'No reviews waiting for moderation' : 'Try changing your filter'}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredReviews.map((review) => (
                            <div
                                key={review.id}
                                className="bg-white/5 border border-white/10 rounded-lg p-6 hover:bg-white/10 transition-colors"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        {/* Header */}
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="flex">
                                                {Array.from({ length: 5 }).map((_, i) => (
                                                    <Star
                                                        key={i}
                                                        size={16}
                                                        fill={i < review.rating ? '#D4AF37' : 'none'}
                                                        className={i < review.rating ? 'text-[#D4AF37]' : 'text-gray-600'}
                                                    />
                                                ))}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {review.is_general_testimonial ? (
                                                    <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs font-urbanist">
                                                        General Testimonial
                                                    </span>
                                                ) : (
                                                    <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded text-xs font-urbanist flex items-center gap-1">
                                                        <Package size={12} />
                                                        {review.products?.title || 'Product Review'}
                                                    </span>
                                                )}
                                                {review.is_verified_buyer && (
                                                    <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs font-urbanist">
                                                        Verified Buyer
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Customer */}
                                        <div className="text-white font-urbanist font-medium mb-2">
                                            {review.customer_name}
                                        </div>

                                        {/* Title & Text */}
                                        {review.title && (
                                            <div className="text-white/80 font-urbanist font-medium mb-2">
                                                "{review.title}"
                                            </div>
                                        )}
                                        <div className="text-gray-400 font-urbanist text-sm mb-3">
                                            {review.review_text}
                                        </div>

                                        {/* Date */}
                                        <div className="text-xs text-gray-600 font-urbanist">
                                            {new Date(review.reviewed_at).toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric'
                                            })}
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-2 ml-4">
                                        {/* Edit button - always visible */}
                                        <button
                                            onClick={() => onEdit(review.id)}
                                            className="p-2 bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 rounded-lg transition-colors"
                                            title="Edit Review"
                                        >
                                            <Edit size={18} />
                                        </button>

                                        {review.status === 'pending' && (
                                            <>
                                                <button
                                                    onClick={() => updateReviewStatus(review.id, 'approved')}
                                                    className="p-2 bg-green-500/20 text-green-400 hover:bg-green-500/30 rounded-lg transition-colors"
                                                    title="Approve"
                                                >
                                                    <Check size={18} />
                                                </button>
                                                <button
                                                    onClick={() => updateReviewStatus(review.id, 'rejected')}
                                                    className="p-2 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-lg transition-colors"
                                                    title="Reject"
                                                >
                                                    <X size={18} />
                                                </button>
                                            </>
                                        )}
                                        {review.status !== 'pending' && (
                                            <span className={`px-3 py-1 rounded text-sm font-urbanist ${review.status === 'approved'
                                                ? 'bg-green-500/20 text-green-400'
                                                : 'bg-red-500/20 text-red-400'
                                                }`}>
                                                {review.status}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ReviewModerationList;
