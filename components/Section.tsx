import React, { useLayoutEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ICONS } from '../constants';
import { DestinyPath } from '../types';

interface SectionProps {
  id: string;
  path: DestinyPath;
  content: string;
  href?: string;
}

const Section: React.FC<SectionProps> = ({ id, path, content, href }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const haloRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(haloRef.current, {
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top 80%",
          end: "top 20%",
          scrub: true
        },
        scale: 0.5,
        opacity: 0,
        borderColor: 'transparent'
      });

      gsap.from(".section-content", {
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top 70%",
        },
        y: 50,
        opacity: 0,
        duration: 1.2,
        ease: "power2.out"
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      id={id}
      ref={containerRef}
      className={`min-h-screen py-32 px-8 flex flex-col items-center justify-center bg-gradient-to-b ${path.color} border-t border-white/5`}
    >
      <div className="max-w-4xl w-full flex flex-col items-center text-center">
        {/* Header Cluster */}
        <div className="relative mb-16">
          <div
            ref={haloRef}
            className="w-32 h-32 rounded-full border border-[#D4AF37] flex items-center justify-center shadow-[0_0_30px_rgba(212,175,55,0.2)]"
          >
            <div className="text-[#D4AF37] scale-125">
              {ICONS[path.icon as keyof typeof ICONS]}
            </div>
          </div>
          <div className="absolute -inset-4 border border-white/5 rounded-full animate-[spin_20s_linear_infinite]" />
        </div>

        <h3 className="text-sm uppercase tracking-[0.5em] text-[#D4AF37] mb-4">{path.label}</h3>
        <h2 className="text-4xl md:text-6xl font-display mb-8">{path.subLabel}</h2>
        <div className="section-content max-w-2xl text-lg md:text-xl text-white/70 font-light leading-relaxed">
          {content}
        </div>

        {href ? (
          <Link
            to={href}
            className="mt-12 px-10 py-4 border border-[#D4AF37]/40 text-[10px] uppercase tracking-[0.3em] hover:bg-[#D4AF37] hover:text-black transition-all duration-500 inline-block"
          >
            Explore {path.label}
          </Link>
        ) : (
          <button className="mt-12 px-10 py-4 border border-[#D4AF37]/40 text-[10px] uppercase tracking-[0.3em] hover:bg-[#D4AF37] hover:text-black transition-all duration-500">
            Explore {path.label}
          </button>
        )}
      </div>
    </section>
  );
};

export default Section;
