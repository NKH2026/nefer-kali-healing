import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Plus, Edit2, Trash2, Calendar, MapPin, Users, Eye, EyeOff } from 'lucide-react';

interface Event {
    id: string;
    title: string;
    event_type: string;
    location_type: string;
    start_date: string;
    end_date: string | null;
    max_capacity: number | null;
    ticket_price: number;
    is_free: boolean;
    status: string;
    created_at: string;
    registration_count?: number;
}

interface EventListProps {
    onEdit: (eventId: string) => void;
    onNew: () => void;
}

const EventList: React.FC<EventListProps> = ({ onEdit, onNew }) => {
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'draft' | 'published' | 'completed'>('all');

    useEffect(() => {
        fetchEvents();
    }, [filter]);

    const fetchEvents = async () => {
        setLoading(true);
        try {
            let query = supabase
                .from('events')
                .select('*')
                .order('start_date', { ascending: false });

            if (filter !== 'all') {
                query = query.eq('status', filter);
            }

            const { data, error } = await query;

            if (error) throw error;

            // Get registration counts for each event
            if (data) {
                const eventsWithCounts = await Promise.all(
                    data.map(async (event) => {
                        const { count } = await supabase
                            .from('event_registrations')
                            .select('*', { count: 'exact', head: true })
                            .eq('event_id', event.id)
                            .eq('status', 'confirmed');
                        return { ...event, registration_count: count || 0 };
                    })
                );
                setEvents(eventsWithCounts);
            }
        } catch (error) {
            console.error('Error fetching events:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleStatus = async (event: Event) => {
        const newStatus = event.status === 'published' ? 'draft' : 'published';
        try {
            const { error } = await supabase
                .from('events')
                .update({ status: newStatus })
                .eq('id', event.id);

            if (error) throw error;
            fetchEvents();
        } catch (error) {
            console.error('Error updating status:', error);
        }
    };

    const deleteEvent = async (eventId: string) => {
        if (!confirm('Are you sure you want to delete this event? This will also delete all registrations.')) return;

        try {
            const { error } = await supabase
                .from('events')
                .delete()
                .eq('id', eventId);

            if (error) throw error;
            fetchEvents();
        } catch (error) {
            console.error('Error deleting event:', error);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric',
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
            other: 'Other'
        };
        return labels[type] || type;
    };

    const getLocationIcon = (type: string) => {
        if (type === 'virtual') return '🌐';
        if (type === 'in-person') return '📍';
        return '🔄';
    };

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            draft: 'bg-gray-500/20 text-gray-400',
            published: 'bg-green-500/20 text-green-400',
            cancelled: 'bg-red-500/20 text-red-400',
            completed: 'bg-purple-500/20 text-purple-400'
        };
        return styles[status] || styles.draft;
    };

    return (
        <div>
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-cinzel text-purple-300">Events</h1>
                    <p className="text-gray-500 mt-1">Manage your community events and workshops</p>
                </div>
                <button
                    onClick={onNew}
                    className="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-500 rounded-lg transition-colors"
                >
                    <Plus size={20} />
                    New Event
                </button>
            </div>

            {/* Filters */}
            <div className="flex gap-2 mb-6">
                {(['all', 'draft', 'published', 'completed'] as const).map((f) => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-4 py-2 rounded-lg text-sm capitalize transition-colors ${filter === f
                                ? 'bg-purple-600 text-white'
                                : 'bg-white/5 text-gray-400 hover:bg-white/10'
                            }`}
                    >
                        {f}
                    </button>
                ))}
            </div>

            {/* Events Table */}
            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-purple-500"></div>
                </div>
            ) : events.length === 0 ? (
                <div className="text-center py-20 bg-white/5 rounded-xl border border-white/10">
                    <Calendar className="mx-auto mb-4 text-gray-600" size={48} />
                    <p className="text-gray-500">No events found</p>
                    <button
                        onClick={onNew}
                        className="mt-4 text-purple-400 hover:text-purple-300"
                    >
                        Create your first event
                    </button>
                </div>
            ) : (
                <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-black/40">
                            <tr>
                                <th className="text-left p-4 text-gray-400 font-normal text-sm">Event</th>
                                <th className="text-left p-4 text-gray-400 font-normal text-sm">Date</th>
                                <th className="text-left p-4 text-gray-400 font-normal text-sm">Type</th>
                                <th className="text-left p-4 text-gray-400 font-normal text-sm">Registrations</th>
                                <th className="text-left p-4 text-gray-400 font-normal text-sm">Status</th>
                                <th className="text-right p-4 text-gray-400 font-normal text-sm">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {events.map((event) => (
                                <tr key={event.id} className="border-t border-white/5 hover:bg-white/5 transition-colors">
                                    <td className="p-4">
                                        <div className="font-medium">{event.title}</div>
                                        <div className="text-sm text-gray-500 flex items-center gap-1">
                                            {getLocationIcon(event.location_type)} {event.location_type}
                                            {!event.is_free && ` • $${event.ticket_price}`}
                                        </div>
                                    </td>
                                    <td className="p-4 text-gray-400 text-sm">
                                        {formatDate(event.start_date)}
                                    </td>
                                    <td className="p-4">
                                        <span className="px-2 py-1 bg-white/10 rounded text-xs">
                                            {getEventTypeLabel(event.event_type)}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-2 text-gray-400">
                                            <Users size={16} />
                                            <span>{event.registration_count || 0}</span>
                                            {event.max_capacity && (
                                                <span className="text-gray-600">/ {event.max_capacity}</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded text-xs capitalize ${getStatusBadge(event.status)}`}>
                                            {event.status}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => toggleStatus(event)}
                                                className="p-2 hover:bg-white/10 rounded transition-colors"
                                                title={event.status === 'published' ? 'Unpublish' : 'Publish'}
                                            >
                                                {event.status === 'published' ? (
                                                    <EyeOff size={18} className="text-gray-400" />
                                                ) : (
                                                    <Eye size={18} className="text-green-400" />
                                                )}
                                            </button>
                                            <button
                                                onClick={() => onEdit(event.id)}
                                                className="p-2 hover:bg-white/10 rounded transition-colors"
                                                title="Edit"
                                            >
                                                <Edit2 size={18} className="text-purple-400" />
                                            </button>
                                            <button
                                                onClick={() => deleteEvent(event.id)}
                                                className="p-2 hover:bg-white/10 rounded transition-colors"
                                                title="Delete"
                                            >
                                                <Trash2 size={18} className="text-red-400" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default EventList;
