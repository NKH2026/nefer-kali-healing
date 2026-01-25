import React, { useState } from 'react';
import EventList from '../../components/admin/EventList';
import EventEditor from '../../components/admin/EventEditor';

const Events: React.FC = () => {
    const [view, setView] = useState<'list' | 'edit'>('list');
    const [editingEventId, setEditingEventId] = useState<string | null>(null);

    const handleEdit = (eventId: string) => {
        setEditingEventId(eventId);
        setView('edit');
    };

    const handleNew = () => {
        setEditingEventId(null);
        setView('edit');
    };

    const handleBack = () => {
        setEditingEventId(null);
        setView('list');
    };

    return (
        <div>
            {view === 'list' ? (
                <EventList onEdit={handleEdit} onNew={handleNew} />
            ) : (
                <EventEditor eventId={editingEventId} onBack={handleBack} />
            )}
        </div>
    );
};

export default Events;
