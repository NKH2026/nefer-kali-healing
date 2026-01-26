
import React, { useLayoutEffect, useRef, useState, useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { DestinyPath } from '../types';
import { Link } from 'react-router-dom';
import { subscribeToNewsletter } from '../lib/kit';
import { supabase } from '../lib/supabase';

interface Props {
  id: string;
  path: DestinyPath;
}

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  category: string;
  slug: string;
}

const CosmicFeed: React.FC<Props> = ({ id, path }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [blogsLoaded, setBlogsLoaded] = useState(false);

  // Newsletter form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [subscribeChecked, setSubscribeChecked] = useState(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  // Fetch blogs from Supabase
  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        const { data, error } = await supabase
          .from('blog_posts')
          .select('id, title, excerpt, category, slug')
          .eq('published', true);

        if (error) {
          console.error('Error fetching blogs:', error);
        } else if (data) {
          // Shuffle the blogs randomly each time
          const shuffled = [...data].sort(() => Math.random() - 0.5);
          setBlogs(shuffled.slice(0, 4).map(post => ({
            id: post.id,
            title: post.title,
            excerpt: post.excerpt || '',
            category: post.category || 'Wisdom',
            slug: post.slug,
          })));
        }
      } catch (err) {
        console.error('Exception fetching blogs:', err);
      } finally {
        setBlogsLoaded(true);
      }
    };

    fetchBlogs();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || status === 'loading') return;

    setStatus('loading');
    const result = await subscribeToNewsletter({
      email,
      firstName,
      lastName
    });

    if (result.success) {
      setStatus('success');
      setMessage(result.message);
      setEmail('');
      setFirstName('');
      setLastName('');
      setSubscribeChecked(false);
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

  useLayoutEffect(() => {
    if (!blogsLoaded) return;

    const ctx = gsap.context(() => {
      // Only apply parallax on desktop (768px+)
      const isMobile = window.innerWidth < 768;

      gsap.utils.toArray<HTMLElement>(".blog-card").forEach((card, i) => {
        // Parallax drift - only on desktop
        if (!isMobile) {
          gsap.to(card, {
            scrollTrigger: {
              trigger: card,
              start: "top bottom",
              end: "bottom top",
              scrub: true,
            },
            y: (i % 2 === 0 ? -100 : 100),
            rotationZ: (i % 2 === 0 ? 2 : -2),
            rotationX: 10,
            ease: "none"
          });
        }

        // Perspective hover
        card.addEventListener('mousemove', (e) => {
          const rect = card.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          const xPercent = (x / rect.width - 0.5) * 20;
          const yPercent = (y / rect.height - 0.5) * -20;

          gsap.to(card, {
            rotationY: xPercent,
            rotationX: yPercent,
            scale: 1.02,
            duration: 0.5,
            ease: "power2.out"
          });
        });

        card.addEventListener('mouseleave', () => {
          gsap.to(card, {
            rotationY: 0,
            rotationX: 0,
            scale: 1,
            duration: 1,
            ease: "elastic.out(1, 0.3)"
          });
        });
      });
    }, containerRef);

    return () => ctx.revert();
  }, [blogsLoaded]);

  return (
    <section
      id={id}
      ref={containerRef}
      className={`relative py-16 sm:py-32 px-4 sm:px-8 min-h-screen bg-black overflow-hidden bg-gradient-to-b ${path.color}`}
    >
      {/* Background Constellation Lines */}
      <svg className="absolute inset-0 w-full h-full opacity-10 pointer-events-none">
        <pattern id="grid" width="100" height="100" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="1" fill="#D4AF37" />
        </pattern>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>

      <div className="max-w-6xl mx-auto relative z-10">
        <div className="text-center mb-24">
          <h3 className="text-sm uppercase tracking-[0.5em] text-[#D4AF37] mb-4">Healing Wisdom</h3>
          <h2 className="text-5xl font-display">Nefer Kali Healing</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-16 md:gap-24 perspective-1000 mb-16 sm:mb-32">
          {blogs.map((blog) => (
            <Link
              key={blog.id}
              to={`/wisdom/${blog.slug}`}
              className="blog-card group relative bg-[#121212]/80 border border-white/5 p-6 sm:p-12 rounded-2xl cursor-pointer hover:shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-shadow block"
              style={{ transformStyle: 'preserve-3d' }}
            >
              <span className="text-[10px] uppercase tracking-widest text-[#D4AF37] mb-4 sm:mb-6 block font-bold">
                {blog.category}
              </span>
              <h4 className="text-xl sm:text-3xl font-display mb-4 sm:mb-6 group-hover:text-[#D4AF37] transition-colors">
                {blog.title}
              </h4>
              <p className="text-white/50 font-light text-sm sm:text-lg mb-6 sm:mb-8 leading-relaxed line-clamp-3">
                {blog.excerpt}
              </p>
              <div className="flex items-center gap-4">
                <div className="h-px w-8 bg-[#D4AF37]/50" />
                <span className="text-[9px] uppercase tracking-widest text-white/40">Read Transmissions</span>
              </div>

              {/* Corner Accent */}
              <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:opacity-100 transition-opacity">
                <div className="w-8 h-8 border-t border-r border-[#D4AF37]" />
              </div>
            </Link>
          ))}
        </div>

        <div className="flex justify-center mb-16 sm:mb-32">
          <Link
            to="/wisdom"
            className="px-12 py-5 border border-[#D4AF37]/30 text-[#D4AF37] text-[10px] uppercase font-bold tracking-[0.2em] rounded-full hover:bg-[#D4AF37] hover:text-black transition-all duration-300"
          >
            Explore Wisdom Vault
          </Link>
        </div>

        {/* Newsletter Signup */}
        <div className="max-w-4xl mx-auto bg-[#121212]/40 border border-white/5 backdrop-blur-xl p-12 rounded-3xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#D4AF37]/50 to-transparent" />

          <div className="text-center mb-12">
            <h3 className="text-2xl font-display mb-4">Subscribe to our newsletter</h3>
            <p className="text-[10px] uppercase tracking-[0.2em] text-white/40">Receive monthly transmissions & lunar updates</p>
          </div>

          <form className="space-y-8" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-white/60 ml-1">First name</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-full px-6 py-4 text-sm focus:outline-none focus:border-[#D4AF37]/50 transition-colors"
                  disabled={status === 'loading'}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-white/60 ml-1">Last name</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-full px-6 py-4 text-sm focus:outline-none focus:border-[#D4AF37]/50 transition-colors"
                  disabled={status === 'loading'}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest text-white/60 ml-1">Email *</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-white/5 border border-white/10 rounded-full px-6 py-4 text-sm focus:outline-none focus:border-[#D4AF37]/50 transition-colors"
                disabled={status === 'loading'}
              />
            </div>

            <div className="flex items-center gap-3 ml-1">
              <input
                type="checkbox"
                id="subscribe"
                checked={subscribeChecked}
                onChange={(e) => setSubscribeChecked(e.target.checked)}
                className="accent-[#D4AF37]"
              />
              <label htmlFor="subscribe" className="text-[10px] uppercase tracking-widest text-white/40 cursor-pointer">
                Yes, subscribe me to your newsletter.
              </label>
            </div>

            {status === 'success' && (
              <p className="text-center text-green-400 text-sm">{message}</p>
            )}
            {status === 'error' && (
              <p className="text-center text-red-400 text-sm">{message}</p>
            )}

            <button
              type="submit"
              disabled={status === 'loading'}
              className="w-full py-4 bg-[#8B7322] hover:bg-[#D4AF37] text-black font-bold text-[10px] uppercase tracking-[0.3em] rounded-full transition-all duration-500 shadow-[0_0_30px_rgba(139,115,34,0.2)] disabled:opacity-50"
            >
              {status === 'loading' ? 'Submitting...' : 'Submit'}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
};

export default CosmicFeed;

