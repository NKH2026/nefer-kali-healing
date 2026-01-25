import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Edit, Trash2, Eye, EyeOff, Package } from 'lucide-react';
import ConfirmDialog from './ConfirmDialog';

interface Product {
    id: string;
    title: string;
    category: string;
    price: number | null;
    status: 'draft' | 'active' | 'archived';
    inventory_quantity: number;
    featured_image_url: string | null;
    created_at: string;
    has_variants: boolean;
}

interface ProductListProps {
    onEdit: (productId: string) => void;
    refreshTrigger?: number;
}

export const ProductList = ({ onEdit, refreshTrigger }: ProductListProps) => {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; productId: string; productTitle: string }>({
        isOpen: false,
        productId: '',
        productTitle: ''
    });

    useEffect(() => {
        fetchProducts();
    }, [refreshTrigger]);

    const fetchProducts = async () => {
        try {
            setLoading(true);
            setError(null);

            const { data, error: fetchError } = await supabase
                .from('products')
                .select('*')
                .order('created_at', { ascending: false });

            if (fetchError) throw fetchError;

            setProducts(data || []);
        } catch (err: any) {
            console.error('Error fetching products:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteClick = (productId: string, productTitle: string) => {
        console.log('Delete button clicked for:', productTitle, productId);
        setDeleteConfirm({ isOpen: true, productId, productTitle });
    };

    const handleDeleteConfirm = async () => {
        const { productId, productTitle } = deleteConfirm;
        console.log('User confirmed deletion, proceeding...');

        // Close the dialog
        setDeleteConfirm({ isOpen: false, productId: '', productTitle: '' });

        try {
            // Check authentication first
            const { data: { session } } = await supabase.auth.getSession();
            console.log('Current session:', session);

            if (!session) {
                alert('You must be logged in to delete products');
                return;
            }

            console.log('Attempting to delete product ID:', productId);
            const { error: deleteError } = await supabase
                .from('products')
                .delete()
                .eq('id', productId);

            if (deleteError) {
                console.error('Delete error from Supabase:', deleteError);
                throw deleteError;
            }

            console.log('Product deleted successfully!');
            // Refresh the list
            fetchProducts();
            alert('Product deleted successfully!');
        } catch (err: any) {
            console.error('Error deleting product:', err);
            alert(`Failed to delete product: ${err.message}`);
        }
    };

    const handleDeleteCancel = () => {
        console.log('User cancelled deletion');
        setDeleteConfirm({ isOpen: false, productId: '', productTitle: '' });
    };

    const getStatusBadge = (status: string) => {
        const styles = {
            draft: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
            active: 'bg-green-500/20 text-green-300 border-green-500/30',
            archived: 'bg-orange-500/20 text-orange-300 border-orange-500/30'
        };

        return (
            <span className={`px-2 py-1 text-xs rounded-full border font-urbanist ${styles[status as keyof typeof styles]}`}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
        );
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="text-gray-400 font-urbanist">Loading products...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="text-red-400 font-urbanist">Error loading products: {error}</div>
            </div>
        );
    }

    if (products.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <Package className="w-16 h-16 text-gray-600 mb-4" />
                <div className="text-gray-400 font-urbanist text-lg mb-2">No products yet</div>
                <div className="text-gray-500 font-urbanist text-sm">Click "+ New Product" to create your first offering</div>
            </div>
        );
    }

    return (
        <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-white/5 border-b border-white/10">
                        <tr>
                            <th className="text-left px-6 py-4 text-xs text-gray-500 uppercase tracking-wider font-urbanist">Product</th>
                            <th className="text-left px-6 py-4 text-xs text-gray-500 uppercase tracking-wider font-urbanist">Category</th>
                            <th className="text-left px-6 py-4 text-xs text-gray-500 uppercase tracking-wider font-urbanist">Price</th>
                            <th className="text-left px-6 py-4 text-xs text-gray-500 uppercase tracking-wider font-urbanist">Inventory</th>
                            <th className="text-left px-6 py-4 text-xs text-gray-500 uppercase tracking-wider font-urbanist">Status</th>
                            <th className="text-right px-6 py-4 text-xs text-gray-500 uppercase tracking-wider font-urbanist">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                        {products.map((product) => (
                            <tr key={product.id} className="hover:bg-white/5 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        {product.featured_image_url ? (
                                            <img
                                                src={product.featured_image_url}
                                                alt={product.title}
                                                className="w-12 h-12 object-cover rounded-lg border border-white/10"
                                            />
                                        ) : (
                                            <div className="w-12 h-12 bg-white/5 rounded-lg border border-white/10 flex items-center justify-center">
                                                <Package className="w-6 h-6 text-gray-600" />
                                            </div>
                                        )}
                                        <div>
                                            <div className="text-white font-urbanist font-medium">{product.title}</div>
                                            {product.has_variants && (
                                                <div className="text-xs text-gray-500 font-urbanist">Has variants</div>
                                            )}
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-gray-300 font-urbanist">{product.category}</td>
                                <td className="px-6 py-4 text-gray-300 font-urbanist">
                                    {product.price ? `$${product.price.toFixed(2)}` : '-'}
                                </td>
                                <td className="px-6 py-4 text-gray-300 font-urbanist">
                                    {product.inventory_quantity}
                                </td>
                                <td className="px-6 py-4">
                                    {getStatusBadge(product.status)}
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center justify-end gap-2">
                                        <button
                                            onClick={() => onEdit(product.id)}
                                            className="p-2 text-gray-400 hover:text-purple-400 transition-colors"
                                            title="Edit"
                                        >
                                            <Edit size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteClick(product.id, product.title)}
                                            className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                                            title="Delete"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <ConfirmDialog
                isOpen={deleteConfirm.isOpen}
                title="Delete Product"
                message={`Are you sure you want to delete "${deleteConfirm.productTitle}"? This action cannot be undone.`}
                onConfirm={handleDeleteConfirm}
                onCancel={handleDeleteCancel}
                confirmText="Delete"
                cancelText="Cancel"
                isDangerous={true}
            />
        </div>
    );
};

export default ProductList;
