
import React, { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { Sun, ShieldCheck, Award, Star, Heart } from 'lucide-react';

const About: React.FC = () => {
    const containerRef = useRef<HTMLDivElement>(null);

    useLayoutEffect(() => {
        const ctx = gsap.context(() => {
            gsap.from(".animate-content", {
                y: 50,
                opacity: 0,
                duration: 1.2,
                ease: "power3.out",
                stagger: 0.2
            });
        }, containerRef);
        return () => ctx.revert();
    }, []);

    return (
        <div ref={containerRef} className="min-h-screen bg-[#0d1a10] text-white selection:bg-[#D4AF37]/30">
            {/* Mission Section - Matching Home Section Aesthetic */}
            <section className="min-h-screen py-32 px-8 flex flex-col items-center justify-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-[#1b5e20]/20 to-black pointer-events-none" />

                <div className="max-w-4xl w-full flex flex-col items-center text-center relative z-10">
                    <div className="relative mb-16 animate-content">
                        <div className="w-32 h-32 rounded-full border border-[#D4AF37] flex items-center justify-center shadow-[0_0_30px_rgba(212,175,55,0.2)]">
                            <Sun className="text-[#D4AF37]" size={40} />
                        </div>
                        <div className="absolute -inset-4 border border-white/5 rounded-full animate-[spin_20s_linear_infinite]" />
                    </div>

                    <h3 className="text-sm uppercase tracking-[0.5em] text-[#D4AF37] mb-4 animate-content">Our Mission</h3>
                    <h1 className="text-5xl md:text-7xl font-display mb-8 animate-content">Our Journey</h1>

                    <div className="max-w-2xl text-lg md:text-xl text-white/70 font-light leading-relaxed animate-content space-y-6">
                        <p>
                            Nefer Kali Healing is a spiritually grounded nonprofit founded by a husband-and-wife team devoted to the esoteric wisdom and ancient healing sciences of diverse ancestral traditions.
                        </p>
                        <p>
                            Our path is one of multicultural synthesis—bridging the gap between ancient ritual and modern needs, supporting each soul in remembering their divine origin and restoring balance.
                        </p>
                    </div>
                </div>
            </section>

            {/* Founders Photo Section */}
            <section className="pb-32 px-8">
                <div className="max-w-5xl mx-auto">
                    <div className="relative animate-content">
                        <div className="absolute -inset-4 bg-[#D4AF37]/10 blur-2xl rounded-[4rem] opacity-30" />
                        <div className="relative aspect-[3/4] max-w-2xl mx-auto rounded-[3rem] md:rounded-[4rem] overflow-hidden border border-white/10 shadow-2xl">
                            <img
                                src="/assets/founders.jpg"
                                alt="Founders of Nefer Kali Healing"
                                className="w-full h-full object-cover object-center grayscale-[20%] hover:grayscale-0 transition-all duration-700"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                            <div className="absolute bottom-12 left-12 right-12">
                                <p className="text-2xl md:text-3xl font-display italic text-[#D4AF37] mb-2">Sacred Union</p>
                                <p className="text-sm md:text-base text-white/60 font-light uppercase tracking-[0.3em]">Ogun Keyede & Y'Marii Shango BunMi</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Credentials Section - Two Squares */}
            <section className="py-32 px-8 bg-black/40 border-t border-white/5">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-24 animate-content">
                        <h2 className="text-4xl font-display mb-4">Sacred Lineage</h2>
                        <p className="text-white/40 text-[10px] uppercase tracking-[0.5em]">Credentials & Mastery</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch max-w-5xl mx-auto">
                        {/* Ogun Keyede - Square Card */}
                        <div className="bg-white/5 border border-white/10 p-8 md:p-12 md:aspect-square rounded-[2rem] md:rounded-[3rem] flex flex-col justify-center animate-content hover:border-[#D4AF37]/30 transition-colors">
                            <h3 className="text-2xl font-display text-[#D4AF37] mb-8 uppercase tracking-widest text-center">Ogun Keyede</h3>
                            <ul className="space-y-6 text-xs md:text-sm text-white/60 font-light leading-relaxed">
                                <li className="flex gap-4">
                                    <ShieldCheck className="text-[#D4AF37] shrink-0" size={18} />
                                    <span>Blue Dragon Medical QiGong Instructor • Certified 2022</span>
                                </li>
                                <li className="flex gap-4">
                                    <Award className="text-[#D4AF37] shrink-0" size={18} />
                                    <span>Diploma in Yoga Therapy • Kerala India (2022-2023)</span>
                                </li>
                                <li className="flex gap-4">
                                    <Star className="text-[#D4AF37] shrink-0" size={18} />
                                    <span>Ammi Unnut Adept at Kalapurusha Astrology</span>
                                </li>
                                <li className="flex gap-4">
                                    <Star className="text-[#D4AF37] shrink-0" size={18} />
                                    <span>Parāśara Jyotiṣa (Ongoing) • Teaching of Sanjay Rath</span>
                                </li>
                            </ul>
                        </div>

                        {/* Y'Marii Shango BunMi - Square Card */}
                        <div className="bg-white/5 border border-white/10 p-8 md:p-12 md:aspect-square rounded-[2rem] md:rounded-[3rem] flex flex-col justify-center animate-content hover:border-[#D4AF37]/30 transition-colors">
                            <h3 className="text-2xl font-display text-[#D4AF37] mb-8 uppercase tracking-widest text-center">Y'Marii Shango BunMi</h3>
                            <ul className="space-y-6 text-xs md:text-sm text-white/60 font-light leading-relaxed">
                                <li className="flex gap-4">
                                    <Star className="text-[#D4AF37] shrink-0" size={18} />
                                    <span>Parāśara Jyotiṣa (Ongoing) • Teaching of Sanjay Rath</span>
                                </li>
                                <li className="flex gap-4">
                                    <Award className="text-[#D4AF37] shrink-0" size={18} />
                                    <span>Associates in Ayurveda & Panchakarma • Kerala India</span>
                                </li>
                                <li className="flex gap-4">
                                    <Heart className="text-[#D4AF37] shrink-0" size={18} />
                                    <span>Certified Ayurvedic Pregnancy Care & Baby Message</span>
                                </li>
                                <li className="flex gap-4">
                                    <ShieldCheck className="text-[#D4AF37] shrink-0" size={18} />
                                    <span>Health Coach (Ongoing) • Inst. for Integrative Nutrition</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            {/* Final CTA */}
            <section className="py-32 px-8 border-t border-white/5 flex flex-col items-center justify-center text-center">
                <div className="max-w-4xl w-full">
                    <h2 className="text-4xl md:text-6xl font-display mb-12 animate-content italic">Walk with us.</h2>
                    <div className="flex flex-col sm:flex-row gap-6 justify-center animate-content">
                        <a href="/support" className="px-12 py-5 bg-[#D4AF37] text-black text-[10px] uppercase font-bold tracking-[0.2em] transition-transform duration-300 hover:scale-105">
                            Support Mission
                        </a>
                        <a href="/community" className="px-12 py-5 border border-white/20 text-white text-[10px] uppercase font-bold tracking-[0.2em] transition-all duration-300 hover:bg-white hover:text-black">
                            Join Community
                        </a>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default About;
