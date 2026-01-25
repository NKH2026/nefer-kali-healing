import { useState } from 'react';
import CouponList from '../../components/admin/CouponList';
import CouponEditor from '../../components/admin/CouponEditor';

type View = 'list' | 'edit' | 'new';

const Coupons = () => {
    const [view, setView] = useState<View>('list');
    const [selectedCouponId, setSelectedCouponId] = useState<string | undefined>();

    const handleEdit = (id: string) => {
        setSelectedCouponId(id);
        setView('edit');
    };

    const handleNew = () => {
        setSelectedCouponId(undefined);
        setView('new');
    };

    const handleBack = () => {
        setSelectedCouponId(undefined);
        setView('list');
    };

    return (
        <>
            {view === 'list' && (
                <CouponList onEdit={handleEdit} onNew={handleNew} />
            )}
            {(view === 'edit' || view === 'new') && (
                <CouponEditor couponId={selectedCouponId} onBack={handleBack} />
            )}
        </>
    );
};

export default Coupons;
