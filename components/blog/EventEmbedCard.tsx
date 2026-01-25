import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, MapPin } from 'lucide-react';
import { NodeViewProps, NodeViewWrapper } from '@tiptap/react';

const EventEmbedCard: React.FC<NodeViewProps> = ({ node }) => {
    const navigate = useNavigate();
    const { eventId, eventTitle, eventImage, eventDate, eventLocation } = node.attrs;

    const handleClick = () => {
        navigate(`/events/${eventId}`);
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <NodeViewWrapper className="event-embed my-8 not-prose">
            <div className="flex flex-col sm:flex-row gap-4 p-6 bg-gradient-to-br from-purple-900/20 to-black/40 border border-[#D4AF37]/30 rounded-2xl hover:border-[#D4AF37]/60 transition-all duration-300 backdrop-blur-sm">
                {/* Event Image */}
                <div className="flex-shrink-0">
                    <img
                        src={eventImage}
                        alt={eventTitle}
                        className="w-full sm:w-32 h-32 object-cover rounded-xl border border-white/10"
                    />
                </div>

                {/* Event Info */}
                <div className="flex-1 flex flex-col justify-between">
                    <div>
                        <h3 className="text-xl font-display text-white mb-2">
                            {eventTitle}
                        </h3>
                        <div className="flex flex-col gap-2 text-sm text-gray-300">
                            <div className="flex items-center gap-2">
                                <Calendar size={16} className="text-[#D4AF37]" />
                                <span>{formatDate(eventDate)}</span>
                            </div>
                            {eventLocation && (
                                <div className="flex items-center gap-2">
                                    <MapPin size={16} className="text-[#D4AF37]" />
                                    <span>{eventLocation}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <button
                        onClick={handleClick}
                        className="mt-4 px-6 py-3 bg-gradient-to-r from-[#D4AF37] to-[#F4E4C1] text-black font-semibold rounded-lg hover:shadow-lg hover:shadow-[#D4AF37]/50 transition-all duration-300 transform hover:scale-105 w-full sm:w-auto"
                    >
                        Register
                    </button>
                </div>
            </div>
        </NodeViewWrapper>
    );
};

export default EventEmbedCard;
