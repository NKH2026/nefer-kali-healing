
import React, { useLayoutEffect, useRef, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { supabase } from '../lib/supabase';
import { DestinyPath } from '../types';

interface Props {
  id: string;
  path: DestinyPath;
}

interface Product {
  id: string;
  title: string;
  slug: string;
  short_description: string;
  price: number;
  category: string;
}

const WombOfOfferings: React.FC<Props> = ({ id, path }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const spineRef = useRef<HTMLDivElement>(null);
  const pulseRef = useRef<HTMLDivElement>(null);
  const [products, setProducts] = useState<Product[]>([]);

  // Fetch products from database
  useEffect(() => {
    const fetchProducts = async () => {
      const { data, error } = await supabase
        .from('products')
        .select('id, title, slug, short_description, price, category')
        .eq('status', 'active')
        .eq('published', true)
        .limit(12); // Fetch more to shuffle from

      if (data && !error) {
        // Shuffle the products and take 6
        const shuffled = [...data].sort(() => Math.random() - 0.5);
        setProducts(shuffled.slice(0, 6));
      }
    };
    fetchProducts();
  }, []);

  useLayoutEffect(() => {
    if (products.length === 0) return;

    const ctx = gsap.context(() => {
      // Pulse animation linked to scroll
      gsap.to(pulseRef.current, {
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top top",
          end: "bottom bottom",
          scrub: 0.5,
        },
        top: "100%",
        ease: "none"
      });

      // Cards sliding in
      gsap.utils.toArray<HTMLElement>(".product-card").forEach((card, i) => {
        gsap.from(card, {
          scrollTrigger: {
            trigger: card,
            start: "top 80%",
            toggleActions: "play none none reverse"
          },
          x: i % 2 === 0 ? -100 : 100,
          opacity: 0,
          duration: 1,
          ease: "power2.out"
        });

        // Spine glow intensify on center
        gsap.to(spineRef.current, {
          scrollTrigger: {
            trigger: card,
            start: "top center",
            end: "bottom center",
            toggleActions: "play reverse play reverse",
            onEnter: () => {
              gsap.to(spineRef.current, { backgroundColor: '#D4AF37', boxShadow: '0 0 20px #D4AF37', duration: 0.3 });
            },
            onLeave: () => {
              gsap.to(spineRef.current, { backgroundColor: 'rgba(212,175,55,0.2)', boxShadow: 'none', duration: 0.3 });
            },
            onEnterBack: () => {
              gsap.to(spineRef.current, { backgroundColor: '#D4AF37', boxShadow: '0 0 20px #D4AF37', duration: 0.3 });
            },
            onLeaveBack: () => {
              gsap.to(spineRef.current, { backgroundColor: 'rgba(212,175,55,0.2)', boxShadow: 'none', duration: 0.3 });
            }
          }
        });
      });
    }, containerRef);

    return () => ctx.revert();
  }, [products]);

  return (
    <section id={id} ref={containerRef} className={`relative py-32 px-8 min-h-screen bg-gradient-to-b ${path.color}`}>
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-24">
          <h3 className="text-sm uppercase tracking-[0.5em] text-[#D4AF37] mb-4">The Womb of Offerings</h3>
          <h2 className="text-5xl font-display">Sacred Botanical Remedies</h2>
        </div>

        <div className="relative flex flex-col items-center">
          {/* Energy Spine (Sushumna) */}
          <div
            ref={spineRef}
            className="absolute left-1/2 top-0 -translate-x-1/2 w-[1px] h-full bg-[#D4AF37]/20 z-0 transition-all"
          >
            <div
              ref={pulseRef}
              className="absolute top-0 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-[#D4AF37] blur-[6px] shadow-[0_0_15px_#D4AF37]"
            />
          </div>

          <div className="w-full flex flex-col gap-24 relative z-10">
            {products.map((item, i) => (
              <div
                key={item.id}
                className={`product-card group relative w-full flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'} items-center`}
              >
                <Link
                  to={`/offerings/${item.slug}`}
                  className="w-full md:w-[45%] p-8 bg-black/40 border border-white/5 backdrop-blur-md rounded-lg hover:border-[#D4AF37]/50 transition-all duration-500 block"
                >
                  <div className="flex justify-between items-start mb-6">
                    <span className="text-[10px] uppercase tracking-widest text-[#D4AF37] font-bold">
                      {item.category || 'Product'}
                    </span>
                    <span className="text-sm font-light text-white/40">
                      {item.price ? `$${item.price.toFixed(2)}` : 'Contact Us'}
                    </span>
                  </div>
                  <h4 className="text-2xl font-display mb-4 group-hover:text-[#D4AF37] transition-colors">
                    {item.title}
                  </h4>
                  <p className="text-sm text-white/60 leading-relaxed font-light mb-6">
                    {item.short_description || 'Discover this sacred botanical remedy crafted with ancestral wisdom.'}
                  </p>
                  <span className="text-[9px] uppercase tracking-[0.2em] flex items-center gap-2 text-[#D4AF37] opacity-60 group-hover:opacity-100">
                    Discover More <span className="text-xs">→</span>
                  </span>

                  {/* Orbital Speck Decor */}
                  <div className="absolute -top-2 -right-2 w-4 h-4 rounded-full border border-white/10 group-hover:border-[#D4AF37] transition-colors" />
                </Link>
              </div>
            ))}
          </div>

          <div className="mt-24 text-center relative z-10">
            <Link
              to="/offerings"
              className="inline-block px-10 py-4 border border-[#D4AF37]/30 text-[#D4AF37] text-xs uppercase tracking-[0.4em] rounded-full hover:bg-[#D4AF37] hover:text-black hover:border-[#D4AF37] transition-all duration-500 backdrop-blur-sm group"
            >
              View All Offerings
              <span className="inline-block ml-3 group-hover:translate-x-2 transition-transform duration-300">→</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WombOfOfferings;
