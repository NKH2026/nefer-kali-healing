import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

const Dashboard = () => {
    const [stats, setStats] = useState({
        publishedPosts: 0,
        pendingReviews: 0,
        totalProducts: 0,
    });
    const [recentReviews, setRecentReviews] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            // 1. Get Stats
            const { count: postsCount } = await supabase
                .from('blog_posts')
                .select('*', { count: 'exact', head: true })
                .eq('published', true);

            // Fixed: Use status = 'pending' instead of is_approved = false
            const { count: reviewsCount } = await supabase
                .from('reviews')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'pending');

            const { count: productsCount } = await supabase
                .from('products')
                .select('*', { count: 'exact', head: true });

            setStats({
                publishedPosts: postsCount || 0,
                pendingReviews: reviewsCount || 0,
                totalProducts: productsCount || 0,
            });

            // 2. Get Recent Activity (Latest Reviews)
            const { data: reviews } = await supabase
                .from('reviews')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(5);

            if (reviews) {
                setRecentReviews(reviews);
            }
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="text-white font-urbanist">Loading dashboard...</div>;
    }

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-3xl font-cinzel text-white mb-2">Dashboard Overview</h2>
                <p className="text-gray-400 font-urbanist">Welcome back to your command center.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white/5 border border-white/10 rounded-xl p-6 hover:border-purple-500/30 transition-colors">
                    <p className="text-gray-400 font-urbanist text-sm uppercase tracking-wider mb-1">Published Blog Posts</p>
                    <p className="text-3xl font-cinzel text-white">{stats.publishedPosts}</p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-6 hover:border-purple-500/30 transition-colors">
                    <p className="text-gray-400 font-urbanist text-sm uppercase tracking-wider mb-1">Pending Reviews</p>
                    <p className="text-3xl font-cinzel text-white">{stats.pendingReviews}</p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-6 hover:border-purple-500/30 transition-colors">
                    <p className="text-gray-400 font-urbanist text-sm uppercase tracking-wider mb-1">Total Products</p>
                    <p className="text-3xl font-cinzel text-white">{stats.totalProducts}</p>
                </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                <h3 className="text-xl font-cinzel text-white mb-6">Recent Reviews</h3>

                <div className="space-y-4">
                    {recentReviews.length === 0 ? (
                        <p className="text-gray-400 font-urbanist italic">No recent reviews found.</p>
                    ) : (
                        recentReviews.map((review) => (
                            <div key={review.id} className="flex items-start justify-between border-b border-white/5 pb-4 last:border-0 last:pb-0">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-purple-300 font-cinzel">{review.customer_name}</span>
                                        <span className={`text-xs px-2 py-0.5 rounded-full ${review.status === 'approved'
                                                ? 'bg-green-900/30 text-green-400'
                                                : review.status === 'rejected'
                                                    ? 'bg-red-900/30 text-red-400'
                                                    : 'bg-yellow-900/30 text-yellow-400'
                                            }`}>
                                            {review.status === 'approved' ? 'Approved' : review.status === 'rejected' ? 'Rejected' : 'Pending'}
                                        </span>
                                    </div>
                                    <p className="text-gray-400 text-sm font-urbanist line-clamp-1">"{review.review_text}"</p>
                                    <p className="text-white/30 text-xs mt-1">{new Date(review.created_at).toLocaleDateString()}</p>
                                </div>
                                <div className="text-yellow-500 font-urbanist text-sm">
                                    {'★'.repeat(review.rating)}
                                    <span className="text-white/20">{'★'.repeat(5 - review.rating)}</span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;

