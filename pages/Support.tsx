
import React, { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { Heart, Globe, Users, ShieldCheck } from 'lucide-react';

const Support: React.FC = () => {
    const containerRef = useRef<HTMLDivElement>(null);

    useLayoutEffect(() => {
        const ctx = gsap.context(() => {
            gsap.from(".support-content", {
                y: 30,
                opacity: 0,
                duration: 1.2,
                ease: "power3.out",
                stagger: 0.2
            });

            gsap.to(".floating-heart", {
                y: -15,
                repeat: -1,
                yoyo: true,
                duration: 2,
                ease: "power1.inOut"
            });
        }, containerRef);
        return () => ctx.revert();
    }, []);

    return (
        <div ref={containerRef} className="min-h-screen bg-[#1a0b09] pt-32 pb-24 px-8 relative overflow-hidden">
            {/* Background Gradient Orbs */}
            <div className="absolute top-0 right-0 w-[50vw] h-[50vw] bg-[#4a1c17]/30 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-[40vw] h-[40vw] bg-[#D4AF37]/5 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/4" />

            <div className="max-w-7xl mx-auto relative z-10">
                {/* Hero Section */}
                <div className="text-center mb-24">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full border border-[#D4AF37]/30 mb-8 floating-heart shadow-[0_0_20px_rgba(212,175,55,0.1)]">
                        <Heart className="text-[#D4AF37]" size={32} />
                    </div>
                    <h1 className="text-6xl md:text-7xl font-display mb-6 support-content">Support Our Mission</h1>
                    <p className="text-white/60 max-w-2xl mx-auto text-sm md:text-base tracking-widest uppercase font-light leading-relaxed support-content">
                        Your generosity fuels the preservation of ancestral wisdom and provides
                        holistic wellness to underserved communities. Every contribution is a seed of collective healing.
                    </p>
                </div>

                {/* Impact Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-24">
                    {[
                        {
                            icon: <Globe className="text-[#D4AF37]" />,
                            title: "Global Preservation",
                            desc: "Funding the documentation and protection of indigenous healing practices and sacred botanical knowledge."
                        },
                        {
                            icon: <Users className="text-[#D4AF37]" />,
                            title: "Community Outreach",
                            desc: "Providing free herbal education, workshops, and traditional remedies to families in transition."
                        },
                        {
                            icon: <div className="text-[#D4AF37] font-bold">100%</div>,
                            title: "Direct Impact",
                            desc: "Nefer Kali Healing is a verified non-profit. 100% of your donation directly funds our community initiatives."
                        }
                    ].map((item, i) => (
                        <div key={i} className="bg-white/5 border border-white/5 p-10 rounded-3xl backdrop-blur-xl support-content hover:border-[#D4AF37]/30 transition-colors group">
                            <div className="w-12 h-12 rounded-2xl bg-[#D4AF37]/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                {item.icon}
                            </div>
                            <h3 className="text-xl font-display mb-4">{item.title}</h3>
                            <p className="text-sm text-white/40 leading-relaxed font-light">{item.desc}</p>
                        </div>
                    ))}
                </div>

                {/* Donation Action - The Sacred Altar */}
                <div className="max-w-4xl mx-auto support-content">
                    <div className="text-center mb-12">
                        <h2 className="text-4xl font-display mb-4">Divine Contribution</h2>
                        <p className="text-white/40 text-[10px] uppercase tracking-[0.3em] max-w-xl mx-auto">
                            Sow a seed into our collective sanctuary. 100% of your donation is received via Zeffy.
                        </p>
                    </div>

                    <div className="bg-gradient-to-b from-[#4a1c17]/60 to-black/80 border border-[#D4AF37]/20 rounded-[2.5rem] overflow-hidden shadow-[0_0_50px_rgba(74,28,23,0.3)] relative">
                        {/* Subtle glow behind the form */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[#D4AF37]/5 blur-[80px] pointer-events-none" />

                        {/* The Zeffy Embed */}
                        <div className="relative z-10 w-full min-h-[600px] bg-white rounded-[2rem] m-2 overflow-hidden shadow-inner">
                            <iframe
                                title="Donation Form"
                                src="https://www.zeffy.com/embed/donation-form/donate-to-nefer-kali-healing"
                                style={{
                                    width: '100%',
                                    height: '800px',
                                    border: 'none',
                                }}
                                allow="payment"
                            />
                        </div>
                    </div>

                    <div className="mt-8 text-center">
                        <p className="text-[9px] text-white/20 uppercase tracking-[0.4em] flex items-center justify-center gap-3">
                            <span className="w-8 h-[1px] bg-white/10" />
                            Secure encrypted connection via Zeffy
                            <span className="w-8 h-[1px] bg-white/10" />
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Support;
