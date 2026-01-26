
import React, { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { DESTINY_PATHS, ICONS, NAKSHATRAS } from '../constants';

const Hero: React.FC = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const portalRef = useRef<HTMLDivElement>(null);
  const sunRef = useRef<HTMLDivElement>(null);
  const zodiacRef = useRef<HTMLDivElement>(null);
  const nakshatraRef = useRef<HTMLDivElement>(null);
  const starFieldRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      // 0. Continuous Rotations
      gsap.to(zodiacRef.current, {
        rotation: 360,
        duration: 360,
        repeat: -1,
        ease: "none"
      });
      gsap.to(nakshatraRef.current, {
        rotation: -360,
        duration: 480,
        repeat: -1,
        ease: "none"
      });

      // 1. Entrance Animation
      const tl = gsap.timeline();

      tl.from(sunRef.current, {
        scale: 0.7,
        opacity: 0,
        duration: 2,
        ease: "power3.out"
      })
        .from(".hero-text", {
          y: 50,
          opacity: 0,
          stagger: 0.2,
          duration: 1.5,
          ease: "power2.out"
        }, "-=1");

      // Star twinkles
      const stars = starFieldRef.current?.children || [];
      Array.from(stars).forEach((star) => {
        gsap.to(star as Element, {
          opacity: "random(0.1, 0.8)",
          scale: "random(0.5, 1.2)",
          duration: "random(1, 3)",
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut"
        });
      });

      // 2. Scroll Animation (The Ceremony)
      ScrollTrigger.create({
        trigger: sectionRef.current,
        start: "top top",
        end: "+=200%",
        pin: true,
        scrub: 1,
        onEnterBack: () => {
          tl.play(0);
        },
        animation: gsap.timeline()
          .to(".hero-text", { opacity: 0, y: -50, stagger: 0.05 })
          .to(sunRef.current, {
            scale: 0.08,
            x: "-42vw",
            y: "-45vh",
            duration: 1,
            ease: "power2.inOut"
          }, 0)
          .to("#nav-sun-dock", { opacity: 1, duration: 0.1 }, "-=0.1")
          .to(sunRef.current, { opacity: 0, duration: 0.1 }, "-=0.1")
      });

    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="min-h-screen min-h-[100dvh] w-full relative overflow-hidden bg-[#0a0a0a] flex items-center justify-center">
      {/* Star Field */}
      <div ref={starFieldRef} className="absolute inset-0 z-0 pointer-events-none">
        {Array.from({ length: 150 }).map((_, i) => (
          <div
            key={i}
            className="absolute bg-white rounded-full"
            style={{
              width: Math.random() * 2 + 'px',
              height: Math.random() * 2 + 'px',
              top: Math.random() * 100 + '%',
              left: Math.random() * 100 + '%'
            }}
          />
        ))}
      </div>

      {/* Zodiac Ring (12 Signs) */}
      <div
        ref={zodiacRef}
        className="absolute w-[70vw] h-[70vw] md:w-[95vh] md:h-[95vh] border border-white/5 rounded-full z-10 flex items-center justify-center pointer-events-none"
      >
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="absolute h-full w-px bg-white/5"
            style={{ transform: `rotate(${i * 30}deg)` }}
          >
            <div className="absolute top-0 -translate-x-1/2 w-8 h-[1px] bg-white/10" />
          </div>
        ))}
        {/* Rashi labels placeholder */}
        <div className="absolute inset-0 p-12 flex items-center justify-center text-[10px] text-white/10 uppercase tracking-[0.6em] font-display">
          <span className="absolute top-[5%]">Mesha</span>
          <span className="absolute right-[5%] rotate-90">Karka</span>
          <span className="absolute bottom-[5%]">Tula</span>
          <span className="absolute left-[5%] -rotate-90">Makara</span>
        </div>
      </div>

      {/* Nakshatra Ring (27 Lunar Mansions) */}
      <div
        ref={nakshatraRef}
        className="absolute w-[55vw] h-[55vw] md:w-[75vh] md:h-[75vh] border border-[#D4AF37]/5 rounded-full z-10 flex items-center justify-center pointer-events-none hidden sm:flex"
      >
        {NAKSHATRAS.map((nak, i) => (
          <div
            key={nak.name}
            className="absolute h-full w-px bg-[#D4AF37]/10"
            style={{ transform: `rotate(${i * (360 / 27)}deg)` }}
          >
            <div className="absolute top-0 -translate-x-1/2 flex flex-col items-center">
              <span className="text-[10px] mb-1 opacity-40">{nak.symbol}</span>
              <div className="w-[1px] h-4 bg-[#D4AF37]/20" />
              <span className="text-[6px] uppercase tracking-tighter text-[#D4AF37]/30 rotate-90 translate-y-8 origin-left whitespace-nowrap">
                {nak.name}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* The Solar Portal */}
      <div ref={portalRef} className="relative z-20 flex items-center justify-center w-full max-w-4xl px-4 md:px-6 text-center">

        {/* Sun & Silhouette */}
        <div
          ref={sunRef}
          className="absolute w-48 h-48 sm:w-64 sm:h-64 md:w-80 md:h-80 rounded-full bg-gradient-to-tr from-[#D4AF37] to-[#8B7322] shadow-[0_0_80px_rgba(212,175,55,0.4)] flex items-center justify-center overflow-hidden"
        >
          <div className="w-full h-full opacity-30 bg-center bg-no-repeat bg-contain mix-blend-overlay"
            style={{ backgroundImage: `radial-gradient(ellipse at center, transparent 30%, #121212 90%), linear-gradient(to top, #121212, transparent 50%)` }} />
        </div>



        {/* Hero Text */}
        <div className="relative z-30">
          <p className="hero-text text-[#D4AF37] uppercase tracking-[0.4em] text-sm mb-4">Transform with...</p>
          <h1 className="hero-text text-5xl md:text-7xl lg:text-8xl font-display mb-8 leading-tight">
            Nefer Kali Healing <br />
            <span className="text-white/80">& Spiritual Education</span>
          </h1>
          <p className="hero-text max-w-lg mx-auto text-white/60 tracking-widest text-[10px] uppercase font-light">
            Nonprofit • Spiritual Education • Community • Natural Wellness
          </p>
        </div>
      </div>
    </section>
  );
};

export default Hero;
