import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { sendTicketEmail } from '../lib/resend';
import { ArrowLeft, Calendar, Clock, MapPin, Users, Check, Loader2 } from 'lucide-react';

interface Event {
    id: string;
    title: string;
    description: string;
    event_type: string;
    location_type: string;
    location_details: string | null;
    start_date: string;
    end_date: string | null;
    cover_image_url: string | null;
    max_capacity: number | null;
    is_free: boolean;
    ticket_price: number;
}

const EventDetail: React.FC = () => {
    const { eventId } = useParams<{ eventId: string }>();
    const [event, setEvent] = useState<Event | null>(null);
    const [loading, setLoading] = useState(true);
    const [registrationCount, setRegistrationCount] = useState(0);

    // Registration form state
    const [email, setEmail] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [registered, setRegistered] = useState(false);
    const [ticketCode, setTicketCode] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        if (eventId) {
            fetchEvent();
            fetchRegistrationCount();
        }
    }, [eventId]);

    const fetchEvent = async () => {
        try {
            const { data, error } = await supabase
                .from('events')
                .select('*')
                .eq('id', eventId)
                .eq('status', 'published')
                .single();

            if (error) throw error;
            setEvent(data);
        } catch (err) {
            console.error('Error fetching event:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchRegistrationCount = async () => {
        try {
            const { count } = await supabase
                .from('event_registrations')
                .select('*', { count: 'exact', head: true })
                .eq('event_id', eventId)
                .eq('status', 'confirmed');
            setRegistrationCount(count || 0);
        } catch (err) {
            console.error('Error fetching count:', err);
        }
    };

    const getLocationLabel = (type: string) => {
        if (type === 'virtual') return 'Virtual Event';
        if (type === 'in-person') return 'In-Person';
        return 'Hybrid';
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !eventId || !event) return;

        setSubmitting(true);
        setError('');

        try {
            const { data, error } = await supabase
                .from('event_registrations')
                .insert([{
                    event_id: eventId,
                    email: email.toLowerCase().trim(),
                    first_name: firstName.trim() || null,
                    last_name: lastName.trim() || null
                }])
                .select('ticket_code')
                .single();

            if (error) {
                if (error.code === '23505') { // Unique violation
                    setError('You are already registered for this event!');
                } else {
                    throw error;
                }
            } else if (data) {
                setRegistered(true);
                setTicketCode(data.ticket_code);
                fetchRegistrationCount();

                // Send ticket confirmation email
                const eventDate = new Date(event.start_date).toLocaleDateString('en-US', {
                    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
                });
                const eventTime = new Date(event.start_date).toLocaleTimeString('en-US', {
                    hour: 'numeric', minute: '2-digit'
                });

                sendTicketEmail({
                    to: email.toLowerCase().trim(),
                    firstName: firstName.trim() || undefined,
                    eventTitle: event.title,
                    eventDate: eventDate,
                    eventTime: eventTime,
                    eventLocation: getLocationLabel(event.location_type) + (event.location_details ? ` - ${event.location_details}` : ''),
                    ticketCode: data.ticket_code,
                    isFree: event.is_free
                }).then(result => {
                    if (!result.success) {
                        console.error('Failed to send ticket email:', result.error);
                    }
                });
            }
        } catch (err: any) {
            console.error('Error registering:', err);
            setError('Registration failed. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const formatTime = (dateString: string) => {
        return new Date(dateString).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit'
        });
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

    const spotsRemaining = event?.max_capacity ? event.max_capacity - registrationCount : null;
    const isFull = spotsRemaining !== null && spotsRemaining <= 0;

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0d1a10] flex items-center justify-center">
                <Loader2 className="animate-spin text-[#D4AF37]" size={40} />
            </div>
        );
    }

    if (!event) {
        return (
            <div className="min-h-screen bg-[#0d1a10] flex flex-col items-center justify-center text-white px-8">
                <h1 className="text-4xl font-display mb-4">Event Not Found</h1>
                <p className="text-white/50 mb-8">This event may have ended or been removed.</p>
                <Link to="/community" className="text-[#D4AF37] hover:underline flex items-center gap-2">
                    <ArrowLeft size={20} /> Back to Community
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0d1a10] text-white">
            {/* Hero Section */}
            <div className="relative h-[50vh] w-full">
                <div className="absolute inset-0 bg-gradient-to-t from-[#0d1a10] via-black/60 to-black/40 z-10" />
                {event.cover_image_url ? (
                    <img
                        src={event.cover_image_url}
                        alt={event.title}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-[#1b5e20]/40 to-[#D4AF37]/20" />
                )}

                <div className="absolute inset-0 z-20 flex flex-col justify-end pb-16 px-8">
                    <div className="max-w-4xl mx-auto w-full">
                        <Link to="/community" className="inline-flex items-center gap-2 text-white/60 hover:text-[#D4AF37] transition-colors mb-6 uppercase tracking-widest text-xs">
                            <ArrowLeft size={16} /> Back to Events
                        </Link>

                        <div className="flex items-center gap-3 mb-4">
                            <span className="px-3 py-1 bg-[#D4AF37] text-black text-[9px] uppercase font-bold tracking-wider rounded-full">
                                {getEventTypeLabel(event.event_type)}
                            </span>
                            <span className="px-3 py-1 bg-white/10 text-white text-[9px] uppercase tracking-wider rounded-full">
                                {getLocationLabel(event.location_type)}
                            </span>
                        </div>

                        <h1 className="text-4xl md:text-6xl font-display mb-4">{event.title}</h1>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-4xl mx-auto px-8 py-16">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Event Details */}
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 space-y-6">
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 rounded-xl bg-[#D4AF37]/20 flex items-center justify-center flex-shrink-0">
                                    <Calendar className="text-[#D4AF37]" size={24} />
                                </div>
                                <div>
                                    <h3 className="font-medium mb-1">Date</h3>
                                    <p className="text-white/60">{formatDate(event.start_date)}</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 rounded-xl bg-[#D4AF37]/20 flex items-center justify-center flex-shrink-0">
                                    <Clock className="text-[#D4AF37]" size={24} />
                                </div>
                                <div>
                                    <h3 className="font-medium mb-1">Time</h3>
                                    <p className="text-white/60">
                                        {formatTime(event.start_date)}
                                        {event.end_date && ` - ${formatTime(event.end_date)}`}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 rounded-xl bg-[#D4AF37]/20 flex items-center justify-center flex-shrink-0">
                                    <MapPin className="text-[#D4AF37]" size={24} />
                                </div>
                                <div>
                                    <h3 className="font-medium mb-1">Location</h3>
                                    <p className="text-white/60">{getLocationLabel(event.location_type)}</p>
                                    {event.location_details && (
                                        <p className="text-white/40 text-sm mt-1">{event.location_details}</p>
                                    )}
                                </div>
                            </div>

                            {event.max_capacity && (
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-[#D4AF37]/20 flex items-center justify-center flex-shrink-0">
                                        <Users className="text-[#D4AF37]" size={24} />
                                    </div>
                                    <div>
                                        <h3 className="font-medium mb-1">Capacity</h3>
                                        <p className="text-white/60">
                                            {registrationCount} / {event.max_capacity} registered
                                            {spotsRemaining !== null && spotsRemaining > 0 && (
                                                <span className="text-green-400 ml-2">({spotsRemaining} spots left)</span>
                                            )}
                                            {isFull && <span className="text-red-400 ml-2">(Full)</span>}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Description */}
                        {event.description && (
                            <div>
                                <h2 className="text-2xl font-display mb-4">About This Event</h2>
                                <div className="prose prose-invert prose-lg max-w-none text-white/70 leading-relaxed whitespace-pre-wrap">
                                    {event.description}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Registration Sidebar */}
                    <div className="lg:col-span-1">
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 sticky top-8">
                            <div className="text-center mb-6">
                                <div className="text-3xl font-display text-[#D4AF37] mb-2">
                                    {event.is_free ? 'Free' : `$${event.ticket_price}`}
                                </div>
                                <p className="text-white/40 text-sm">per person</p>
                            </div>

                            {registered ? (
                                <div className="text-center py-6">
                                    <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                                        <Check className="text-green-400" size={32} />
                                    </div>
                                    <h3 className="text-xl font-medium mb-2">You're Registered!</h3>
                                    <p className="text-white/50 text-sm mb-4">
                                        A confirmation email with your ticket will be sent shortly.
                                    </p>
                                    <div className="bg-black/40 rounded-lg p-4">
                                        <p className="text-[10px] uppercase tracking-widest text-white/40 mb-1">Your Ticket Code</p>
                                        <p className="text-[#D4AF37] font-mono text-lg">{ticketCode}</p>
                                    </div>
                                </div>
                            ) : isFull ? (
                                <div className="text-center py-6">
                                    <p className="text-red-400 mb-4">This event is at capacity</p>
                                    <p className="text-white/50 text-sm">
                                        Check back later for future events or join our newsletter.
                                    </p>
                                </div>
                            ) : (
                                <form onSubmit={handleRegister} className="space-y-4">
                                    <div>
                                        <label className="block text-sm text-white/60 mb-2">Email *</label>
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                            placeholder="your@email.com"
                                            className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:border-[#D4AF37]/50 transition-colors"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-sm text-white/60 mb-2">First Name</label>
                                            <input
                                                type="text"
                                                value={firstName}
                                                onChange={(e) => setFirstName(e.target.value)}
                                                placeholder="First"
                                                className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:border-[#D4AF37]/50 transition-colors"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm text-white/60 mb-2">Last Name</label>
                                            <input
                                                type="text"
                                                value={lastName}
                                                onChange={(e) => setLastName(e.target.value)}
                                                placeholder="Last"
                                                className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:border-[#D4AF37]/50 transition-colors"
                                            />
                                        </div>
                                    </div>

                                    {error && (
                                        <p className="text-red-400 text-sm text-center">{error}</p>
                                    )}

                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="w-full py-4 bg-[#D4AF37] hover:bg-[#c5a030] text-black font-bold text-sm uppercase tracking-widest rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        {submitting ? (
                                            <>
                                                <Loader2 className="animate-spin" size={18} />
                                                Registering...
                                            </>
                                        ) : (
                                            'Register Now'
                                        )}
                                    </button>

                                    <p className="text-[10px] text-white/30 text-center">
                                        By registering, you'll receive event updates via email.
                                    </p>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EventDetail;
