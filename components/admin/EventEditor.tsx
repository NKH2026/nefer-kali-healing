import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { ArrowLeft, Save, Loader2, Calendar, MapPin, Users, DollarSign, Image, Trash2, Upload, X } from 'lucide-react';

interface EventData {
    id?: string;
    title: string;
    description: string;
    event_type: string;
    location_type: string;
    location_details: string;
    start_date: string;
    end_date: string;
    cover_image_url: string;
    max_capacity: number | null;
    ticket_price: number;
    is_free: boolean;
    status: string;
}

interface Registration {
    id: string;
    email: string;
    first_name: string | null;
    last_name: string | null;
    ticket_code: string;
    status: string;
    registered_at: string;
}

interface EventEditorProps {
    eventId: string | null;
    onBack: () => void;
}

const initialEvent: EventData = {
    title: '',
    description: '',
    event_type: 'workshop',
    location_type: 'virtual',
    location_details: '',
    start_date: '',
    end_date: '',
    cover_image_url: '',
    max_capacity: null,
    ticket_price: 0,
    is_free: true,
    status: 'draft'
};

const EventEditor: React.FC<EventEditorProps> = ({ eventId, onBack }) => {
    const [event, setEvent] = useState<EventData>(initialEvent);
    const [registrations, setRegistrations] = useState<Registration[]>([]);
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'details' | 'registrations'>('details');
    const [uploading, setUploading] = useState(false);
    const [dragOver, setDragOver] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (eventId) {
            fetchEvent();
            fetchRegistrations();
        } else {
            // Set default start date to tomorrow at 7pm
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            tomorrow.setHours(19, 0, 0, 0);
            setEvent({
                ...initialEvent,
                start_date: formatDateTimeLocal(tomorrow),
                end_date: formatDateTimeLocal(new Date(tomorrow.getTime() + 2 * 60 * 60 * 1000)) // 2 hours later
            });
        }
    }, [eventId]);

    const formatDateTimeLocal = (date: Date) => {
        return date.toISOString().slice(0, 16);
    };

    const fetchEvent = async () => {
        if (!eventId) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('events')
                .select('*')
                .eq('id', eventId)
                .single();

            if (error) throw error;
            if (data) {
                setEvent({
                    ...data,
                    start_date: data.start_date ? formatDateTimeLocal(new Date(data.start_date)) : '',
                    end_date: data.end_date ? formatDateTimeLocal(new Date(data.end_date)) : ''
                });
            }
        } catch (error) {
            console.error('Error fetching event:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchRegistrations = async () => {
        if (!eventId) return;
        try {
            const { data, error } = await supabase
                .from('event_registrations')
                .select('*')
                .eq('event_id', eventId)
                .order('registered_at', { ascending: false });

            if (error) throw error;
            setRegistrations(data || []);
        } catch (error) {
            console.error('Error fetching registrations:', error);
        }
    };

    const handleSave = async () => {
        if (!event.title.trim()) {
            alert('Please enter an event title');
            return;
        }
        if (!event.start_date) {
            alert('Please select a start date');
            return;
        }

        setSaving(true);
        try {
            const eventData = {
                title: event.title,
                description: event.description,
                event_type: event.event_type,
                location_type: event.location_type,
                location_details: event.location_details,
                start_date: new Date(event.start_date).toISOString(),
                end_date: event.end_date ? new Date(event.end_date).toISOString() : null,
                cover_image_url: event.cover_image_url,
                max_capacity: event.max_capacity,
                ticket_price: event.is_free ? 0 : event.ticket_price,
                is_free: event.is_free,
                status: event.status
            };

            if (eventId) {
                const { error } = await supabase
                    .from('events')
                    .update(eventData)
                    .eq('id', eventId);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('events')
                    .insert([eventData]);
                if (error) throw error;
            }

            onBack();
        } catch (error) {
            console.error('Error saving event:', error);
            alert('Error saving event');
        } finally {
            setSaving(false);
        }
    };

    const handleInputChange = (field: keyof EventData, value: any) => {
        setEvent(prev => ({ ...prev, [field]: value }));
    };

    const cancelRegistration = async (regId: string) => {
        if (!confirm('Cancel this registration?')) return;
        try {
            const { error } = await supabase
                .from('event_registrations')
                .update({ status: 'cancelled' })
                .eq('id', regId);
            if (error) throw error;
            fetchRegistrations();
        } catch (error) {
            console.error('Error cancelling registration:', error);
        }
    };

    // Image upload handlers
    const handleImageUpload = async (file: File) => {
        if (!file.type.startsWith('image/')) {
            alert('Please upload an image file');
            return;
        }

        setUploading(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `event-${Date.now()}.${fileExt}`;
            const filePath = `events/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('media')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('media')
                .getPublicUrl(filePath);

            handleInputChange('cover_image_url', publicUrl);
        } catch (error) {
            console.error('Error uploading image:', error);
            alert('Failed to upload image. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files[0];
        if (file) handleImageUpload(file);
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleImageUpload(file);
    };

    const removeImage = () => {
        handleInputChange('cover_image_url', '');
    };

    if (loading) {
        return (
            <div className="flex justify-center py-20">
                <Loader2 className="animate-spin text-purple-500" size={32} />
            </div>
        );
    }

    return (
        <div className="max-w-4xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onBack}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                        <ArrowLeft size={24} />
                    </button>
                    <h1 className="text-3xl font-cinzel text-purple-300">
                        {eventId ? 'Edit Event' : 'New Event'}
                    </h1>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 rounded-lg transition-colors"
                >
                    {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                    {saving ? 'Saving...' : 'Save Event'}
                </button>
            </div>

            {/* Tabs (only show if editing existing event) */}
            {eventId && (
                <div className="flex gap-2 mb-6">
                    <button
                        onClick={() => setActiveTab('details')}
                        className={`px-4 py-2 rounded-lg text-sm transition-colors ${activeTab === 'details'
                            ? 'bg-purple-600 text-white'
                            : 'bg-white/5 text-gray-400 hover:bg-white/10'
                            }`}
                    >
                        Event Details
                    </button>
                    <button
                        onClick={() => setActiveTab('registrations')}
                        className={`px-4 py-2 rounded-lg text-sm transition-colors ${activeTab === 'registrations'
                            ? 'bg-purple-600 text-white'
                            : 'bg-white/5 text-gray-400 hover:bg-white/10'
                            }`}
                    >
                        Registrations ({registrations.filter(r => r.status === 'confirmed').length})
                    </button>
                </div>
            )}

            {activeTab === 'details' ? (
                <div className="space-y-6">
                    {/* Basic Info */}
                    <div className="bg-white/5 rounded-xl border border-white/10 p-6">
                        <h2 className="text-lg font-medium mb-4 flex items-center gap-2">
                            <Calendar size={20} className="text-purple-400" />
                            Basic Information
                        </h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm text-gray-400 mb-2">Event Title *</label>
                                <input
                                    type="text"
                                    value={event.title}
                                    onChange={(e) => handleInputChange('title', e.target.value)}
                                    placeholder="Enter event title"
                                    className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:border-purple-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm text-gray-400 mb-2">Description</label>
                                <textarea
                                    value={event.description}
                                    onChange={(e) => handleInputChange('description', e.target.value)}
                                    placeholder="Describe your event..."
                                    rows={5}
                                    className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:border-purple-500 resize-none"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-gray-400 mb-2">Event Type</label>
                                    <select
                                        value={event.event_type}
                                        onChange={(e) => handleInputChange('event_type', e.target.value)}
                                        className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:border-purple-500"
                                    >
                                        <option value="workshop">Workshop</option>
                                        <option value="ceremony">Ceremony</option>
                                        <option value="circle">Circle</option>
                                        <option value="retreat">Retreat</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-400 mb-2">Status</label>
                                    <select
                                        value={event.status}
                                        onChange={(e) => handleInputChange('status', e.target.value)}
                                        className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:border-purple-500"
                                    >
                                        <option value="draft">Draft</option>
                                        <option value="published">Published</option>
                                        <option value="cancelled">Cancelled</option>
                                        <option value="completed">Completed</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Date & Time */}
                    <div className="bg-white/5 rounded-xl border border-white/10 p-6">
                        <h2 className="text-lg font-medium mb-4 flex items-center gap-2">
                            <Calendar size={20} className="text-purple-400" />
                            Date & Time
                        </h2>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm text-gray-400 mb-2">Start Date & Time *</label>
                                <input
                                    type="datetime-local"
                                    value={event.start_date}
                                    onChange={(e) => handleInputChange('start_date', e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:border-purple-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400 mb-2">End Date & Time</label>
                                <input
                                    type="datetime-local"
                                    value={event.end_date}
                                    onChange={(e) => handleInputChange('end_date', e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:border-purple-500"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Location */}
                    <div className="bg-white/5 rounded-xl border border-white/10 p-6">
                        <h2 className="text-lg font-medium mb-4 flex items-center gap-2">
                            <MapPin size={20} className="text-purple-400" />
                            Location
                        </h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm text-gray-400 mb-2">Location Type</label>
                                <div className="flex gap-2">
                                    {['virtual', 'in-person', 'hybrid'].map((type) => (
                                        <button
                                            key={type}
                                            type="button"
                                            onClick={() => handleInputChange('location_type', type)}
                                            className={`px-4 py-2 rounded-lg text-sm capitalize transition-colors ${event.location_type === type
                                                ? 'bg-purple-600 text-white'
                                                : 'bg-black/40 text-gray-400 hover:bg-white/10'
                                                }`}
                                        >
                                            {type === 'virtual' ? '🌐 Virtual' : type === 'in-person' ? '📍 In-Person' : '🔄 Hybrid'}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400 mb-2">
                                    {event.location_type === 'virtual' ? 'Zoom/Meeting Link' : 'Address'}
                                </label>
                                <input
                                    type="text"
                                    value={event.location_details}
                                    onChange={(e) => handleInputChange('location_details', e.target.value)}
                                    placeholder={event.location_type === 'virtual' ? 'https://zoom.us/j/...' : 'Enter address'}
                                    className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:border-purple-500"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Capacity & Pricing */}
                    <div className="bg-white/5 rounded-xl border border-white/10 p-6">
                        <h2 className="text-lg font-medium mb-4 flex items-center gap-2">
                            <Users size={20} className="text-purple-400" />
                            Capacity & Pricing
                        </h2>

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-gray-400 mb-2">Max Capacity (leave empty for unlimited)</label>
                                    <input
                                        type="number"
                                        value={event.max_capacity || ''}
                                        onChange={(e) => handleInputChange('max_capacity', e.target.value ? parseInt(e.target.value) : null)}
                                        placeholder="Unlimited"
                                        min="1"
                                        className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:border-purple-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-400 mb-2">Ticket Price</label>
                                    <div className="flex items-center gap-4">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={event.is_free}
                                                onChange={(e) => handleInputChange('is_free', e.target.checked)}
                                                className="accent-purple-500"
                                            />
                                            <span className="text-sm">Free Event</span>
                                        </label>
                                        {!event.is_free && (
                                            <div className="flex items-center gap-2">
                                                <DollarSign size={16} className="text-gray-400" />
                                                <input
                                                    type="number"
                                                    value={event.ticket_price}
                                                    onChange={(e) => handleInputChange('ticket_price', parseFloat(e.target.value) || 0)}
                                                    min="0"
                                                    step="0.01"
                                                    className="w-24 bg-black/40 border border-white/10 rounded-lg px-4 py-2 focus:outline-none focus:border-purple-500"
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Cover Image */}
                    <div className="bg-white/5 rounded-xl border border-white/10 p-6">
                        <h2 className="text-lg font-medium mb-4 flex items-center gap-2">
                            <Image size={20} className="text-purple-400" />
                            Cover Image
                        </h2>

                        {event.cover_image_url ? (
                            <div className="relative">
                                <img
                                    src={event.cover_image_url}
                                    alt="Event cover"
                                    className="w-full h-64 object-cover rounded-lg"
                                />
                                <button
                                    onClick={removeImage}
                                    className="absolute top-3 right-3 p-2 bg-black/70 hover:bg-red-600 rounded-full transition-colors"
                                    title="Remove image"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                        ) : (
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                                onDragLeave={() => setDragOver(false)}
                                onDrop={handleDrop}
                                className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all ${dragOver
                                        ? 'border-purple-500 bg-purple-500/10'
                                        : 'border-white/20 hover:border-purple-500/50 hover:bg-white/5'
                                    }`}
                            >
                                {uploading ? (
                                    <div className="flex flex-col items-center">
                                        <Loader2 className="animate-spin text-purple-400 mb-3" size={40} />
                                        <p className="text-gray-400">Uploading...</p>
                                    </div>
                                ) : (
                                    <>
                                        <Upload className="mx-auto mb-4 text-gray-500" size={40} />
                                        <p className="text-gray-400 mb-2">Drag and drop an image here</p>
                                        <p className="text-gray-600 text-sm">or click to browse</p>
                                    </>
                                )}
                            </div>
                        )}

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleFileSelect}
                            className="hidden"
                        />

                        <div className="mt-4">
                            <label className="block text-sm text-gray-500 mb-2">Or paste an image URL</label>
                            <input
                                type="url"
                                value={event.cover_image_url}
                                onChange={(e) => handleInputChange('cover_image_url', e.target.value)}
                                placeholder="https://..."
                                className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-purple-500"
                            />
                        </div>
                    </div>
                </div>
            ) : (
                // Registrations Tab
                <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
                    {registrations.length === 0 ? (
                        <div className="text-center py-16">
                            <Users className="mx-auto mb-4 text-gray-600" size={48} />
                            <p className="text-gray-500">No registrations yet</p>
                        </div>
                    ) : (
                        <table className="w-full">
                            <thead className="bg-black/40">
                                <tr>
                                    <th className="text-left p-4 text-gray-400 font-normal text-sm">Name</th>
                                    <th className="text-left p-4 text-gray-400 font-normal text-sm">Email</th>
                                    <th className="text-left p-4 text-gray-400 font-normal text-sm">Ticket Code</th>
                                    <th className="text-left p-4 text-gray-400 font-normal text-sm">Status</th>
                                    <th className="text-left p-4 text-gray-400 font-normal text-sm">Registered</th>
                                    <th className="text-right p-4 text-gray-400 font-normal text-sm">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {registrations.map((reg) => (
                                    <tr key={reg.id} className="border-t border-white/5 hover:bg-white/5 transition-colors">
                                        <td className="p-4">
                                            {reg.first_name || reg.last_name
                                                ? `${reg.first_name || ''} ${reg.last_name || ''}`.trim()
                                                : '—'}
                                        </td>
                                        <td className="p-4 text-gray-400">{reg.email}</td>
                                        <td className="p-4">
                                            <code className="bg-black/40 px-2 py-1 rounded text-purple-400 text-sm">
                                                {reg.ticket_code}
                                            </code>
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded text-xs capitalize ${reg.status === 'confirmed'
                                                ? 'bg-green-500/20 text-green-400'
                                                : reg.status === 'attended'
                                                    ? 'bg-purple-500/20 text-purple-400'
                                                    : 'bg-red-500/20 text-red-400'
                                                }`}>
                                                {reg.status}
                                            </span>
                                        </td>
                                        <td className="p-4 text-gray-400 text-sm">
                                            {new Date(reg.registered_at).toLocaleDateString()}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex justify-end">
                                                {reg.status === 'confirmed' && (
                                                    <button
                                                        onClick={() => cancelRegistration(reg.id)}
                                                        className="p-2 hover:bg-white/10 rounded transition-colors"
                                                        title="Cancel Registration"
                                                    >
                                                        <Trash2 size={16} className="text-red-400" />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}
        </div>
    );
};

export default EventEditor;
