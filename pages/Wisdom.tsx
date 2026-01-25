
import React, { useLayoutEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { BookOpen, Search, ArrowRight, Calendar, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import { subscribeToNewsletter } from '../lib/kit';

const Wisdom: React.FC = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [activeCategory, setActiveCategory] = useState("All");

    const [posts, setPosts] = useState<any[]>([]);
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

    // Fetch posts from Supabase
    useLayoutEffect(() => {
        const fetchPosts = async () => {
            try {
                // We're selecting all fields. Note: Ensure your Supabase table has a 'category' column 
                // or we'll default it to 'Wisdom' in the map below.
                const { data, error } = await import('../lib/supabase').then(m => m.supabase
                    .from('blog_posts')
                    .select('*')
                    .eq('published', true)
                    .order('created_at', { ascending: false })
                );

                if (error) {
                    console.error('Error fetching posts:', error);
                } else if (data) {
                    const mappedPosts = data.map(post => ({
                        id: post.id,
                        title: post.title,
                        excerpt: post.excerpt || '',
                        // Format date from created_at (YY-MM-DD) to "MMM DD, YYYY"
                        date: new Date(post.created_at).toLocaleDateString('en-US', {
                            month: 'short', day: '2-digit', year: 'numeric'
                        }),
                        author: post.author || 'Nefer Kali',
                        category: post.category || 'Wisdom', // Fallback if column missing/empty
                        image: post.cover_image_url || 'https://images.unsplash.com/photo-1534067783941-51c9c23ecefd?auto=format&fit=crop&q=80&w=800',
                        slug: post.slug
                    }));
                    setPosts(mappedPosts);
                }
            } catch (err) {
                console.error('Exception fetching posts:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchPosts();
    }, []);

    useLayoutEffect(() => {
        if (loading) return; // Don't animate until loaded

        const ctx = gsap.context(() => {
            // Animate only the visible content
            gsap.fromTo(".animate-content",
                { y: 30, opacity: 0 },
                {
                    y: 0,
                    opacity: 1,
                    duration: 0.8,
                    ease: "power2.out",
                    stagger: 0.1,
                    clearProps: "all" // Clears GSAP styles after animation to avoid layout issues
                }
            );
        }, containerRef);
        return () => ctx.revert();
    }, [activeCategory, loading]); // Re-run animation when category changes or loading finishes

    const categories = ["All", "Astrology", "Womb Health", "Holistic Healing", "Spirituality"];

    const filteredPosts = activeCategory === "All"
        ? posts
        : posts.filter(post => post.category === activeCategory);

    return (
        <div ref={containerRef} className="min-h-screen bg-[#0d1a10] text-white selection:bg-[#D4AF37]/30">
            {/* Wisdom Hero */}
            <section className="pt-48 pb-24 px-8 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-[#1b5e20]/20 to-black pointer-events-none" />

                <div className="max-w-7xl mx-auto flex flex-col items-center text-center relative z-10">
                    <div className="relative mb-12 animate-content">
                        <div className="w-24 h-24 rounded-full border border-[#D4AF37]/30 flex items-center justify-center">
                            <BookOpen className="text-[#D4AF37]" size={32} />
                        </div>
                        <div className="absolute -inset-2 border border-[#D4AF37]/10 rounded-full animate-pulse" />
                    </div>

                    <h3 className="text-xs uppercase tracking-[0.5em] text-[#D4AF37] mb-4 animate-content">The Vault</h3>
                    <h1 className="text-6xl md:text-8xl font-display mb-8 animate-content italic">Ancestral Wisdom</h1>
                    <p className="max-w-2xl text-lg text-white/50 font-light leading-relaxed animate-content">
                        Decoding the celestial blue-print and terrestrial biology. Weekly transmissions from our founding guardians and guests.
                    </p>

                    {/* Search Bar Placeholder */}
                    <div className="mt-16 w-full max-w-xl relative animate-content">
                        <input
                            type="text"
                            placeholder="Search the archives..."
                            className="w-full bg-white/5 border border-white/10 rounded-full py-5 px-10 focus:outline-none focus:border-[#D4AF37]/50 transition-all font-light tracking-widest text-sm"
                        />
                        <Search className="absolute right-6 top-1/2 -translate-y-1/2 text-white/20" size={20} />
                    </div>

                    {/* Category Tabs */}
                    <div className="mt-12 flex flex-wrap justify-center gap-4 animate-content">
                        {categories.map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setActiveCategory(cat)}
                                className={`px-6 py-2 rounded-full text-[10px] uppercase tracking-widest transition-all duration-300 border ${activeCategory === cat
                                    ? "bg-[#D4AF37] text-black border-[#D4AF37]"
                                    : "bg-transparent text-white/40 border-white/10 hover:border-[#D4AF37]/40"
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>
            </section>

            {/* Blogs Grid */}
            <section className="pb-32 px-8">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {filteredPosts.map((post, i) => (
                            <article key={i} className="group relative animate-content flex flex-col bg-white/5 border border-white/5 rounded-[2.5rem] overflow-hidden hover:border-[#D4AF37]/20 transition-all duration-500">
                                {/* Post Image */}
                                <Link to={`/wisdom/${post.slug}`} className="aspect-[16/10] overflow-hidden relative block">
                                    <img
                                        src={post.image}
                                        alt={post.title}
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                    />
                                    <div className="absolute top-6 left-6 px-4 py-1.5 bg-black/60 backdrop-blur-md rounded-full border border-white/10 text-[10px] uppercase tracking-widest text-[#D4AF37]">
                                        {post.category}
                                    </div>
                                </Link>

                                {/* Post Content */}
                                <div className="p-10 flex flex-col flex-grow">
                                    <div className="flex items-center gap-6 text-[10px] uppercase tracking-[0.2em] text-white/30 mb-6">
                                        <span className="flex items-center gap-2"><Calendar size={12} /> {post.date}</span>
                                        <span className="flex items-center gap-2"><User size={12} /> {post.author}</span>
                                    </div>
                                    <Link to={`/wisdom/${post.slug}`} className="block mb-4">
                                        <h2 className="text-2xl font-display group-hover:text-[#D4AF37] transition-colors line-clamp-2">{post.title}</h2>
                                    </Link>
                                    <p className="text-sm text-white/40 font-light leading-relaxed mb-10 line-clamp-3">
                                        {post.excerpt}
                                    </p>
                                    <div className="mt-auto pt-6 border-t border-white/5">
                                        <Link to={`/wisdom/${post.slug}`} className="flex items-center gap-3 text-[10px] uppercase font-bold tracking-[0.2em] text-[#D4AF37] hover:gap-5 transition-all w-fit">
                                            Read More <ArrowRight size={14} />
                                        </Link>
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>

                    {filteredPosts.length === 0 && (
                        <div className="text-center py-20 animate-content">
                            <p className="text-white/20 italic">No transmissions found in this category yet...</p>
                        </div>
                    )}

                    {/* Load More/Pagination placeholder */}
                    <div className="mt-20 flex justify-center animate-content">
                        <button className="px-12 py-5 border border-white/10 text-white/60 text-[10px] uppercase font-bold tracking-[0.2em] rounded-full hover:bg-white hover:text-black transition-all">
                            Load More Wisdom
                        </button>
                    </div>
                </div>
            </section>

            {/* Newsletter Integration */}
            <section className="py-32 px-8 bg-black/40 border-t border-white/5">
                <div className="max-w-4xl mx-auto text-center animate-content">
                    <h2 className="text-4xl font-display mb-8">Sacred Transmissions</h2>
                    <p className="text-white/50 mb-12 font-light leading-relaxed max-w-xl mx-auto">
                        Join our inner circle to receive monthly celestial insights and ancestral wellness guides directly in your inbox.
                    </p>
                    <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Email address"
                            className="flex-grow bg-white/5 border border-white/10 rounded-full py-4 px-8 focus:outline-none focus:border-[#D4AF37]/50 transition-all font-light"
                            disabled={status === 'loading'}
                        />
                        <button
                            type="submit"
                            disabled={status === 'loading'}
                            className="px-10 py-4 bg-[#D4AF37] text-black text-[10px] uppercase font-bold tracking-[0.2em] rounded-full hover:scale-105 transition-transform disabled:opacity-50"
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

export default Wisdom;

