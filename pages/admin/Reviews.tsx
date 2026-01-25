import { useState } from 'react';
import ReviewModerationList from '../../components/admin/ReviewModerationList';
import ReviewImporter from '../../components/admin/ReviewImporter';
import ManualReviewEditor from '../../components/admin/ManualReviewEditor';

type View = 'list' | 'import' | 'manual' | 'edit';

const Reviews = () => {
    const [view, setView] = useState<View>('list');
    const [editReviewId, setEditReviewId] = useState<string | null>(null);

    const handleEdit = (reviewId: string) => {
        setEditReviewId(reviewId);
        setView('edit');
    };

    const handleBackToList = () => {
        setEditReviewId(null);
        setView('list');
    };

    return (
        <>
            {view === 'list' && (
                <ReviewModerationList
                    onImport={() => setView('import')}
                    onAddManual={() => setView('manual')}
                    onEdit={handleEdit}
                />
            )}
            {view === 'import' && (
                <ReviewImporter onBack={handleBackToList} />
            )}
            {view === 'manual' && (
                <ManualReviewEditor onBack={handleBackToList} />
            )}
            {view === 'edit' && editReviewId && (
                <ManualReviewEditor onBack={handleBackToList} editReviewId={editReviewId} />
            )}
        </>
    );
};

export default Reviews;
