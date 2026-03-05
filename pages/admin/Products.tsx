import { useState } from 'react';
import ProductEditor from '../../components/admin/ProductEditor';
import ProductList from '../../components/admin/ProductList';

const Products = () => {
    const [view, setView] = useState<'list' | 'editor'>('list');
    const [selectedProductId, setSelectedProductId] = useState<string | undefined>(undefined);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const handleBack = () => {
        setView('list');
        setSelectedProductId(undefined);
        // Trigger a refresh of the product list
        setRefreshTrigger(prev => prev + 1);
    };

    const handleEdit = (productId: string) => {
        setSelectedProductId(productId);
        setView('editor');
    };

    if (view === 'editor') {
        return <ProductEditor productId={selectedProductId} onBack={handleBack} />;
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-black via-purple-900/10 to-black p-4 md:p-8">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 md:mb-8">
                    <div>
                        <h1 className="text-2xl md:text-4xl font-cinzel text-white mb-1 md:mb-2">Product Offerings</h1>
                        <p className="text-gray-400 font-urbanist text-sm md:text-base">Manage your sacred products and offerings</p>
                    </div>
                    <button
                        onClick={() => {
                            setSelectedProductId(undefined);
                            setView('editor');
                        }}
                        className="px-5 py-2.5 md:px-6 md:py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-urbanist font-bold rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg text-sm md:text-base w-full sm:w-auto text-center"
                    >
                        + New Product
                    </button>
                </div>

                <ProductList onEdit={handleEdit} refreshTrigger={refreshTrigger} />
            </div>
        </div>
    );
};

export default Products;
