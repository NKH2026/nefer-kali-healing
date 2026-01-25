import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import BlogEditor from '../../components/admin/BlogEditor';
import { Plus, Search, Edit2, Trash2, Eye, Calendar } from 'lucide-react';

const Blog = () => {
    const [view, setView] = useState<'list' | 'editor'>('list');
    const [posts, setPosts] = useState<any[]>([]);
    const [selectedPostId, setSelectedPostId] = useState<string | undefined>(undefined);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean, postId: string | null, postTitle: string }>({ show: false, postId: null, postTitle: '' });

    useEffect(() => {
        if (view === 'list') {
            fetchPosts();
        }
    }, [view]);

    const fetchPosts = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('blog_posts')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setPosts(data || []);
        } catch (error) {
            console.error('Error fetching posts:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateNew = () => {
        setSelectedPostId(undefined);
        setView('editor');
    };

    const handleEdit = (id: string) => {
        setSelectedPostId(id);
        setView('editor');
    };

    const handleDeleteClick = (id: string, title: string) => {
        setDeleteConfirm({ show: true, postId: id, postTitle: title });
    };

    const handleDeleteConfirm = async () => {
        if (!deleteConfirm.postId) return;

        try {
            const { error } = await supabase
                .from('blog_posts')
                .delete()
                .eq('id', deleteConfirm.postId);

            if (error) throw error;
            setDeleteConfirm({ show: false, postId: null, postTitle: '' });
            fetchPosts(); // Refresh list
        } catch (error) {
            console.error('Error deleting post:', error);
            alert('Failed to delete post.');
        }
    };

    const handleDeleteCancel = () => {
        setDeleteConfirm({ show: false, postId: null, postTitle: '' });
    };

    const filteredPosts = posts.filter(post =>
        post.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (view === 'editor') {
        return (
            <BlogEditor
                postId={selectedPostId}
                onBack={() => {
                    setView('list');
                    fetchPosts();
                }}
            />
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-cinzel text-white mb-2">Wisdom Vault</h2>
                    <p className="text-gray-400 font-urbanist">Manage your blog posts and spiritual transmissions.</p>
                </div>
                <button
                    onClick={handleCreateNew}
                    className="flex items-center gap-2 px-6 py-3 bg-[#D4AF37] hover:bg-[#b5952f] text-black font-urbanist font-bold rounded-lg transition-transform hover:scale-105"
                >
                    <Plus size={20} />
                    Create Transmission
                </button>
            </div>

            {/* Filters & Search */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Search posts..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-black/20 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-white focus:border-purple-500/50 focus:outline-none placeholder-gray-600"
                    />
                </div>
            </div>

            {/* Posts Grid */}
            {loading ? (
                <div className="text-center py-20">
                    <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-gray-400 font-urbanist">Loading wisdom...</p>
                </div>
            ) : filteredPosts.length === 0 ? (
                <div className="text-center py-20 bg-white/5 rounded-xl border border-white/10 border-dashed">
                    <p className="text-gray-400 font-urbanist mb-4">No posts found.</p>
                    <button onClick={handleCreateNew} className="text-[#D4AF37] hover:underline">Create your first post</button>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {filteredPosts.map((post) => (
                        <div key={post.id} className="bg-white/5 border border-white/10 rounded-xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 group hover:border-purple-500/30 transition-colors">
                            <div className="flex items-start gap-4 flex-1">
                                {post.cover_image_url && (
                                    <div className="w-24 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-black/40">
                                        <img src={post.cover_image_url} alt="" className="w-full h-full object-cover" />
                                    </div>
                                )}
                                <div>
                                    <h3 className="text-xl font-cinzel text-white mb-2 group-hover:text-purple-300 transition-colors">{post.title}</h3>
                                    <div className="flex items-center gap-4 text-sm text-gray-400 font-urbanist">
                                        <span className={`px-2 py-0.5 rounded-full text-xs ${post.published ? 'bg-green-900/30 text-green-400' : 'bg-yellow-900/30 text-yellow-400'}`}>
                                            {post.published ? 'Published' : 'Draft'}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Calendar size={14} />
                                            {new Date(post.created_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => handleEdit(post.id)}
                                    className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                                    title="Edit"
                                >
                                    <Edit2 size={18} />
                                </button>
                                <button
                                    onClick={() => handleDeleteClick(post.id, post.title)}
                                    className="p-2 text-gray-400 hover:text-red-400 hover:bg-white/10 rounded-lg transition-colors"
                                    title="Delete"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteConfirm.show && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-[#1a1a1a] border border-white/20 rounded-2xl p-8 max-w-md w-full shadow-2xl">
                        <h3 className="text-2xl font-cinzel text-white mb-4">Delete Blog Post?</h3>
                        <p className="text-gray-400 font-urbanist mb-2">
                            Are you sure you want to delete:
                        </p>
                        <p className="text-white font-urbanist font-semibold mb-6 bg-white/5 p-3 rounded-lg border border-white/10">
                            "{deleteConfirm.postTitle}"
                        </p>
                        <p className="text-gray-500 text-sm font-urbanist mb-8">
                            This action cannot be undone.
                        </p>
                        <div className="flex gap-4">
                            <button
                                onClick={handleDeleteCancel}
                                className="flex-1 px-6 py-3 bg-white/5 hover:bg-white/10 text-white font-urbanist rounded-lg transition-colors border border-white/10"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteConfirm}
                                className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-urbanist font-bold rounded-lg transition-colors"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Blog;
