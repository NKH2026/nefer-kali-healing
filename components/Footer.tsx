
import React, { useLayoutEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { subscribeToNewsletter } from '../lib/kit';

const Footer: React.FC = () => {
  const { pathname } = useLocation();
  const isAdmin = pathname.startsWith('/admin');
  const footerRef = useRef<HTMLElement>(null);
  const gemRef = useRef<HTMLDivElement>(null);

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

  useLayoutEffect(() => {
    if (isAdmin) return;
    const ctx = gsap.context(() => {
      // Docking the sun at the bottom
      ScrollTrigger.create({
        trigger: footerRef.current,
        start: "top 80%",
        onEnter: () => {
          gsap.to("#nav-sun-dock", { opacity: 0, duration: 0.5 });
          gsap.fromTo(gemRef.current,
            { opacity: 0, y: -200, scale: 0.5 },
            { opacity: 1, y: 0, scale: 1, duration: 1.5, ease: "power2.out" }
          );
        },
        onLeaveBack: () => {
          gsap.to("#nav-sun-dock", { opacity: 1, duration: 0.5 });
          gsap.to(gemRef.current, { opacity: 0, duration: 0.5 });
        }
      });

      // Incense Smoke Effect
      gsap.to(".smoke", {
        y: -100,
        opacity: 0,
        x: "random(-20, 20)",
        duration: "random(4, 8)",
        repeat: -1,
        stagger: 0.5,
        ease: "sine.inOut"
      });

    }, footerRef);

    return () => ctx.revert();
  }, [isAdmin]);

  if (isAdmin) return null;

  return (
    <footer ref={footerRef} className="relative bg-[#050505] pt-48 pb-12 overflow-hidden px-8">
      {/* Incense Smoke Elements */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex gap-8">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="smoke w-12 h-48 bg-gradient-to-t from-white/5 to-transparent blur-2xl rounded-full"
          />
        ))}
      </div>

      <div className="max-w-6xl mx-auto relative z-10 text-center">
        {/* The Final Resting Place of the Solar Gem */}
        <div
          ref={gemRef}
          className="w-16 h-16 rounded-full bg-gradient-to-tr from-[#D4AF37] to-[#8B7322] shadow-[0_0_40px_rgba(212,175,55,0.6)] mx-auto mb-12 opacity-0"
        />

        <h2 className="text-4xl md:text-5xl font-display mb-16 tracking-wider">
          Nefer Kali Healing <br />
          <span className="text-lg uppercase tracking-[0.4em] text-white/40">Rooted in Ancient Truth</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-left mb-24">
          <div>
            <h4 className="text-[10px] uppercase tracking-widest text-[#D4AF37] mb-6">Contact</h4>
            <ul className="text-white/60 space-y-2 text-sm font-light">
              <li>info@neferkalihealing.org</li>
              <li>PO Box 322</li>
              <li>McCordsville IN 46055</li>
            </ul>
          </div>
          <div>
            <h4 className="text-[10px] uppercase tracking-widest text-[#D4AF37] mb-6">Navigate</h4>
            <ul className="text-white/60 space-y-2 text-sm font-light">
              <li><Link to="/about" className="hover:text-[#D4AF37] transition-colors">Our Nonprofit Journey</Link></li>
              <li><Link to="/community" className="hover:text-[#D4AF37] transition-colors">Community Circle</Link></li>
              <li><Link to="/shop" className="hover:text-[#D4AF37] transition-colors">Natural Wellness Store</Link></li>
              <li><Link to="/wisdom" className="hover:text-[#D4AF37] transition-colors">Spiritual Education Blog</Link></li>
              <li><Link to="/sky-watch" className="hover:text-[#D4AF37] transition-colors">Planetary Sky Watch</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-[10px] uppercase tracking-widest text-[#D4AF37] mb-6">Newsletter</h4>
            <form onSubmit={handleNewsletterSubmit} className="flex border-b border-white/20 pb-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="bg-transparent border-none outline-none text-sm w-full font-light"
                disabled={status === 'loading'}
              />
              <button
                type="submit"
                disabled={status === 'loading'}
                className="text-[10px] uppercase tracking-widest text-[#D4AF37]"
              >
                {status === 'loading' ? '...' : 'Join'}
              </button>
            </form>
            {status === 'success' && (
              <p className="text-[9px] text-green-400 mt-4 uppercase tracking-widest">{message}</p>
            )}
            {status === 'error' && (
              <p className="text-[9px] text-red-400 mt-4 uppercase tracking-widest">{message}</p>
            )}
            {status === 'idle' && (
              <p className="text-[9px] text-white/30 mt-4 uppercase tracking-widest">Receive monthly transmissions & lunar updates.</p>
            )}
          </div>
        </div>

        <div className="pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-[9px] uppercase tracking-[0.3em] text-white/30">
            © 2024 Nefer Kali Healing & Spiritual Education. All Rights Reserved.
          </p>
          <div className="flex gap-8">
            <a href="https://www.instagram.com/neferkalihealing/" target="_blank" rel="noopener noreferrer" className="text-[9px] uppercase tracking-widest text-white/40 hover:text-[#D4AF37] transition-colors">
              Instagram
            </a>
            <a href="https://www.youtube.com/@neferkalihealing" target="_blank" rel="noopener noreferrer" className="text-[9px] uppercase tracking-widest text-white/40 hover:text-[#D4AF37] transition-colors">
              Youtube
            </a>
            <a href="https://www.pinterest.com/NeferKaliHealing/" target="_blank" rel="noopener noreferrer" className="text-[9px] uppercase tracking-widest text-white/40 hover:text-[#D4AF37] transition-colors">
              Pinterest
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

