
import React, { useLayoutEffect, useRef, useState, useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Users, Calendar, MapPin, ExternalLink, Clock, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

gsap.registerPlugin(ScrollTrigger);

interface Event {
    id: string;
    title: string;
    description: string;
    event_type: string;
    location_type: string;
    start_date: string;
    end_date: string | null;
    cover_image_url: string | null;
    is_free: boolean;
    ticket_price: number;
}

const Community: React.FC = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const { data, error } = await supabase
                    .from('events')
                    .select('*')
                    .eq('status', 'published')
                    .gte('start_date', new Date().toISOString())
                    .order('start_date', { ascending: true })
                    .limit(6);

                if (error) throw error;
                setEvents(data || []);
            } catch (err) {
                console.error('Error fetching events:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchEvents();
    }, []);

    useLayoutEffect(() => {
        const ctx = gsap.context(() => {
            gsap.from(".animate-content", {
                y: 50,
                opacity: 0,
                duration: 1.2,
                ease: "power3.out",
                stagger: 0.2
            });

            // Set initial state visible, then animate position only
            gsap.set(".event-card", { opacity: 1 });
            gsap.from(".event-card", {
                scrollTrigger: {
                    trigger: ".events-grid",
                    start: "top 90%",
                },
                y: 30,
                duration: 0.8,
                stagger: 0.1,
                ease: "power2.out"
            });
        }, containerRef);
        return () => ctx.revert();
    }, [loading]);

    const formatEventDate = (dateString: string) => {
        const date = new Date(dateString);
        return {
            month: date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
            day: date.getDate(),
            time: date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
            full: date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
        };
    };

    const getLocationLabel = (type: string) => {
        if (type === 'virtual') return '🌐 Virtual Event';
        if (type === 'in-person') return '📍 In-Person';
        return '🔄 Hybrid';
    };

    const getEventTypeLabel = (type: string) => {
        const labels: Record<string, string> = {
            workshop: 'Workshop',
            ceremony: 'Ceremony',
            circle: 'Circle',
            retreat: 'Retreat',
            other: 'Gathering'
        };
        return labels[type] || 'Event';
    };

    return (
        <div ref={containerRef} className="min-h-screen bg-[#0d1a10] text-white selection:bg-[#D4AF37]/30">
            {/* Community Hero - Unified Styling */}
            <section className="min-h-[80vh] pt-32 pb-24 px-8 flex flex-col items-center justify-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-[#1b5e20]/20 to-black pointer-events-none" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[60vw] bg-[#D4AF37]/5 rounded-full blur-[120px] pointer-events-none" />

                <div className="max-w-4xl w-full flex flex-col items-center text-center relative z-10">
                    <div className="relative mb-16 animate-content">
                        <div className="w-32 h-32 rounded-full border border-[#D4AF37] flex items-center justify-center shadow-[0_0_30px_rgba(212,175,55,0.2)]">
                            <Users className="text-[#D4AF37]" size={40} />
                        </div>
                        <div className="absolute -inset-4 border border-white/5 rounded-full animate-[spin_30s_linear_infinite]" />
                    </div>

                    <h3 className="text-sm uppercase tracking-[0.5em] text-[#D4AF37] mb-4 animate-content">Gatherings</h3>
                    <h1 className="text-6xl md:text-8xl font-display mb-8 animate-content italic">Unity Circle</h1>
                    <p className="max-w-2xl text-lg md:text-xl text-white/70 font-light leading-relaxed animate-content mb-12">
                        A collective sanctuary for monthly gatherings, shared rituals, and a support network dedicated to collective evolution and soulful connection.
                    </p>

                    <a href="#events" className="animate-content px-12 py-5 border border-[#D4AF37]/30 text-[#D4AF37] text-[10px] uppercase font-bold tracking-[0.2em] rounded-full hover:bg-[#D4AF37] hover:text-black transition-all duration-300">
                        Explore Gatherings
                    </a>
                </div>
            </section>

            {/* Upcoming Events & Workshops */}
            <section id="events" className="py-32 px-8 bg-black/40 border-t border-white/5">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-24 animate-content">
                        <h2 className="text-4xl md:text-6xl font-display mb-6">Workshops & Events</h2>
                        <p className="text-white/40 text-[10px] uppercase tracking-[0.5em]">Join us in the virtual or physical realm</p>
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-20">
                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-[#D4AF37]"></div>
                        </div>
                    ) : events.length === 0 ? (
                        <div className="flex justify-center events-grid">
                            <div className="event-card bg-white/5 border border-white/10 p-16 rounded-[3rem] text-center max-w-2xl w-full backdrop-blur-sm">
                                <div className="w-16 h-16 rounded-full bg-[#D4AF37]/10 flex items-center justify-center text-[#D4AF37] mx-auto mb-8">
                                    <Calendar size={32} />
                                </div>
                                <h3 className="text-3xl font-display mb-4">Events Coming Soon</h3>
                                <p className="text-white/40 font-light leading-relaxed">
                                    We are currently weaving new sacred gatherings and virtual rituals.
                                    Check back soon or join our mailing list to be the first to know.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-wrap justify-center gap-8 events-grid">
                            {events.map((event) => {
                                const dateInfo = formatEventDate(event.start_date);
                                return (
                                    <Link
                                        key={event.id}
                                        to={`/community/events/${event.id}`}
                                        className="event-card group bg-[#f5f0e8] rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all duration-500 block max-w-md w-full"
                                    >
                                        {/* Event Image */}
                                        <div className="aspect-[4/3] relative overflow-hidden">
                                            {event.cover_image_url ? (
                                                <img
                                                    src={event.cover_image_url}
                                                    alt={event.title}
                                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                                />
                                            ) : (
                                                <div className="w-full h-full bg-gradient-to-br from-[#c4a574] to-[#8b6914] flex items-center justify-center">
                                                    <Calendar size={64} className="text-white/60" />
                                                </div>
                                            )}
                                        </div>

                                        {/* Event Content - White/Cream Section */}
                                        <div className="p-6 bg-white">
                                            <h3 className="text-xl text-[#1a1a1a] font-display mb-2 group-hover:text-[#8b6914] transition-colors">
                                                {event.title}
                                            </h3>

                                            <p className="text-[#666] text-sm mb-4">
                                                {dateInfo.full} | {getLocationLabel(event.location_type).replace(/[🌐📍🔄]\s*/, '')}
                                            </p>

                                            <div className="text-center">
                                                <span className="text-[#666] text-sm underline hover:text-[#8b6914] transition-colors">
                                                    More info
                                                </span>
                                            </div>

                                            <div className="mt-4 text-center">
                                                <span className="inline-block px-8 py-3 bg-[#7a7556] hover:bg-[#5a5540] text-white text-sm font-medium rounded transition-colors">
                                                    Details
                                                </span>
                                            </div>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    )}
                </div>
            </section>

            {/* Donation / Support Integration */}
            <section className="py-32 px-8 bg-black/40 border-t border-white/5">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-4xl font-display mb-8 animate-content">Support our Gatherings</h2>
                    <p className="text-white/60 mb-12 animate-content max-w-2xl mx-auto">
                        Nefer Kali Healing is a 501(c)(3) nonprofit. Your contributions ensure our community workshops and virtual circles remain accessible to all.
                    </p>
                    <div className="bg-gradient-to-b from-[#1b5e20]/40 to-black/80 border border-[#D4AF37]/20 rounded-[3rem] overflow-hidden animate-content">
                        <div className="min-h-[600px] w-full bg-white m-2 rounded-[2.5rem] overflow-hidden">
                            <iframe
                                title="Community Support"
                                src="https://www.zeffy.com/embed/donation-form/donate-to-nefer-kali-healing"
                                style={{ width: '100%', height: '800px', border: 'none' }}
                                allow="payment"
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer-like CTA */}
            <section className="py-32 px-8 border-t border-white/5 text-center">
                <h2 className="text-4xl md:text-6xl font-display mb-12 italic">Join the Circle.</h2>
                <div className="flex flex-col sm:flex-row gap-6 justify-center">
                    <a href="/support" className="px-12 py-5 bg-[#D4AF37] text-black text-[10px] uppercase font-bold tracking-[0.2em] rounded-full hover:scale-105 transition-transform duration-300">
                        Support Mission
                    </a>
                    <a href="mailto:info@neferkalihealing.org" className="px-12 py-5 border border-white/20 text-white text-[10px] uppercase font-bold tracking-[0.2em] rounded-full hover:bg-white hover:text-black transition-all duration-300">
                        Contact Us
                    </a>
                </div>
            </section>
        </div>
    );
};

export default Community;
