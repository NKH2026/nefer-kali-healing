import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Calendar, User } from 'lucide-react';
import { subscribeToNewsletter } from '../lib/kit';


// We reuse the rendering logic from the editor, but in read-only mode, 
// OR we can just use a standard HTML parser if we saved HTML.
// Since Tiptap saves HTML, we can just render the HTML string safely.
// However, using Tiptap in read-only mode ensures consistent styling with the editor.

const BlogPost: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();
    const [post, setPost] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // Newsletter state
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');

    const handleNewsletterSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || status === 'loading') return;

        setStatus('loading');
        const result = await subscribeToNewsletter({ email });

        if (result.success) {
            setStatus('success');
            setMessage(result.message);
            setEmail('');
        } else {
            setStatus('error');
            setMessage(result.message);
        }

        // Reset status after 4 seconds
        setTimeout(() => {
            setStatus('idle');
            setMessage('');
        }, 4000);
    };

    useEffect(() => {
        const fetchPost = async () => {
            if (!slug) return;
            try {
                const { data, error } = await supabase
                    .from('blog_posts')
                    .select('*')
                    .eq('slug', slug)
                    .single();

                if (error) throw error;
                setPost(data);
            } catch (err) {
                console.error('Error fetching post:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchPost();
    }, [slug]);

    // Format date
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0d1a10] flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#D4AF37]"></div>
            </div>
        );
    }

    if (!post) {
        return (
            <div className="min-h-screen bg-[#0d1a10] flex flex-col items-center justify-center text-white">
                <h1 className="text-4xl font-display mb-4">Post Not Found</h1>
                <Link to="/wisdom" className="text-[#D4AF37] hover:underline flex items-center gap-2">
                    <ArrowLeft size={20} /> Back to Wisdom
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0d1a10] text-gray-300 selection:bg-[#D4AF37]/30">
            {/* Hero Section with Cover Image */}
            <div className="relative h-[60vh] w-full">
                <div className="absolute inset-0 bg-black/40 z-10" />
                <img
                    src={post.cover_image_url || 'https://images.unsplash.com/photo-1534067783941-51c9c23ecefd?auto=format&fit=crop&q=80&w=1600'}
                    alt={post.title}
                    className="w-full h-full object-cover"
                />

                <div className="absolute inset-0 z-20 flex flex-col justify-end pb-20 px-4">
                    <div className="max-w-4xl mx-auto w-full">
                        <Link to="/wisdom" className="inline-flex items-center gap-2 text-white/60 hover:text-[#D4AF37] transition-colors mb-8 uppercase tracking-widest text-xs">
                            <ArrowLeft size={16} /> Back to Wisdom
                        </Link>

                        <div className="flex items-center gap-4 text-[#D4AF37] text-xs uppercase tracking-widest mb-4">
                            <span>{post.category || 'Wisdom'}</span>
                        </div>

                        <h1 className="text-5xl md:text-7xl font-display text-white mb-8 leading-tight">
                            {post.title}
                        </h1>

                        <div className="flex flex-wrap items-center gap-8 text-sm text-white/70 font-light tracking-wide">
                            <div className="flex items-center gap-2">
                                <User size={16} className="text-[#D4AF37]" />
                                <span>{post.author || 'Nefer Kali'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Calendar size={16} className="text-[#D4AF37]" />
                                <span>{formatDate(post.created_at)}</span>
                            </div>
                            {/* <div className="flex items-center gap-2">
                                <Clock size={16} className="text-[#D4AF37]" />
                                <span>5 min read</span>
                            </div> */}
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Section */}
            <div className="max-w-3xl mx-auto px-4 py-20">
                <div
                    className={`prose prose-invert prose-lg max-w-none prose-headings:font-display prose-headings:text-white prose-a:text-[#D4AF37] prose-img:rounded-2xl prose-blockquote:border-l-[#D4AF37] prose-blockquote:bg-white/5 prose-blockquote:px-8 prose-blockquote:py-4 prose-blockquote:rounded-r-lg prose-strong:text-white ProseMirror ${post.text_color === 'cream' ? 'prose-p:text-[#F5F5DC] prose-li:text-[#F5F5DC]' :
                        post.text_color === 'white' ? 'prose-p:text-white prose-li:text-white' :
                            post.text_color === 'light-gray' ? 'prose-p:text-gray-200 prose-li:text-gray-200' :
                                post.text_color ? `prose-p:text-[${post.text_color}] prose-li:text-[${post.text_color}]` :
                                    'prose-p:text-[#F5F5DC] prose-li:text-[#F5F5DC]' // default to cream
                        }`}
                    style={post.text_color && !['cream', 'white', 'light-gray'].includes(post.text_color) ? {
                        '--tw-prose-body': post.text_color,
                        '--tw-prose-lists': post.text_color
                    } as React.CSSProperties : undefined}
                    dangerouslySetInnerHTML={{ __html: post.content }}
                />
            </div>

            {/* Newsletter / CTA */}
            <section className="py-20 border-t border-white/5 bg-black/20">
                <div className="max-w-4xl mx-auto px-4 text-center">
                    <h3 className="text-3xl font-display mb-6 text-white">Enjoyed this transmission?</h3>
                    <p className="text-white/50 mb-8 font-light">Subscribe to receive more wisdom directly to your inbox.</p>
                    <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row justify-center gap-4 max-w-md mx-auto">
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Email address"
                            className="bg-white/5 border border-white/10 rounded-full py-3 px-6 focus:outline-none focus:border-[#D4AF37]/50 transition-all font-light w-full"
                            disabled={status === 'loading'}
                        />
                        <button
                            type="submit"
                            disabled={status === 'loading'}
                            className="px-8 py-3 bg-[#D4AF37] text-black text-xs uppercase font-bold tracking-[0.2em] rounded-full hover:scale-105 transition-transform whitespace-nowrap disabled:opacity-50"
                        >
                            {status === 'loading' ? '...' : 'Subscribe'}
                        </button>
                    </form>
                    {status === 'success' && (
                        <p className="text-green-400 text-sm mt-4">{message}</p>
                    )}
                    {status === 'error' && (
                        <p className="text-red-400 text-sm mt-4">{message}</p>
                    )}
                </div>
            </section>
        </div>
    );
};

export default BlogPost;

