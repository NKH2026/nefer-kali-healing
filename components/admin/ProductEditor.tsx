import { useEffect, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { ArrowLeft, Save, Trash2, Upload, X, ImageIcon, Plus } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface ProductEditorProps {
    productId?: string;
    onBack: () => void;
}

const CATEGORIES = [
    "Capsulated Botanics & Herbs",
    "Extracts",
    "Sea Moss",
    "Spiritual Wellness",
    "Women's Wellness"
];

const SUBSCRIPTION_FREQUENCIES = [
    { value: 'every-2-weeks', label: 'Every 2 weeks' },
    { value: 'monthly', label: 'Every month' },
    { value: 'every-3-months', label: 'Every 3 months' }
];

export const ProductEditor = ({ productId, onBack }: ProductEditorProps) => {
    // Basic Info
    const [title, setTitle] = useState('');
    const [slug, setSlug] = useState('');
    const [shortDescription, setShortDescription] = useState('');
    const [category, setCategory] = useState(CATEGORIES[0]);
    const [status, setStatus] = useState<'draft' | 'active' | 'archived'>('draft');

    // Pricing
    const [price, setPrice] = useState('');
    const [onSale, setOnSale] = useState(false);
    const [compareAtPrice, setCompareAtPrice] = useState('');
    const [costPerItem, setCostPerItem] = useState('');

    // Inventory
    const [sku, setSku] = useState('');
    const [trackInventory, setTrackInventory] = useState(true);
    const [inventoryQuantity, setInventoryQuantity] = useState('0');
    const [lowStockThreshold, setLowStockThreshold] = useState('5');
    const [allowBackorders, setAllowBackorders] = useState(false);
    const [isSoldOut, setIsSoldOut] = useState(false);

    // Pre-order
    const [isPreorder, setIsPreorder] = useState(false);
    const [preorderMessage, setPreorderMessage] = useState('');
    const [preorderReleaseDate, setPreorderReleaseDate] = useState('');

    // Subscription
    const [subscriptionAvailable, setSubscriptionAvailable] = useState(false);
    const [subscriptionDiscount, setSubscriptionDiscount] = useState('10');
    const [subscriptionFrequencies, setSubscriptionFrequencies] = useState<string[]>(['monthly']);

    // Variants
    const [hasVariants, setHasVariants] = useState(false);
    const [variantOption1, setVariantOption1] = useState('Size');
    const [variantOption2, setVariantOption2] = useState('Base');
    const [hasSecondOption, setHasSecondOption] = useState(false);
    const [variantValues, setVariantValues] = useState<string[]>([]);
    const [variantValues2, setVariantValues2] = useState<string[]>([]);
    const [variants, setVariants] = useState<Array<{
        id?: string,
        title: string,
        option1: string,
        option2?: string,
        price: string,
        sku: string,
        inventory: string
    }>>([]);

    // State
    const [isSaving, setIsSaving] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [images, setImages] = useState<{ url: string, alt: string, id?: string }[]>([]);
    const [newVariantValue, setNewVariantValue] = useState('');
    const [newVariantValue2, setNewVariantValue2] = useState('');

    // Rich text editors
    const descriptionEditor = useEditor({
        extensions: [StarterKit],
        content: '<p>Enter product description...</p>',
    });

    const ingredientsEditor = useEditor({
        extensions: [StarterKit],
        content: '<p>Enter ingredients...</p>',
    });

    const usageEditor = useEditor({
        extensions: [StarterKit],
        content: '<p>Enter usage instructions...</p>',
    });

    const benefitsEditor = useEditor({
        extensions: [StarterKit],
        content: '<p>Enter benefits...</p>',
    });

    const warningsEditor = useEditor({
        extensions: [StarterKit],
        content: '<p>Enter warnings & precautions...</p>',
    });

    const returnPolicyEditor = useEditor({
        extensions: [StarterKit],
        content: '<p>Enter return policy...</p>',
    });

    const shippingInfoEditor = useEditor({
        extensions: [StarterKit],
        content: '<p>Enter shipping information...</p>',
    });

    useEffect(() => {
        if (productId) {
            fetchProduct();
        }
    }, [productId]);

    const fetchProduct = async () => {
        if (!productId) return;

        try {
            const { data, error } = await supabase
                .from('products')
                .select('*')
                .eq('id', productId)
                .single();

            if (error) throw error;

            if (data) {
                setTitle(data.title);
                setSlug(data.slug);
                setShortDescription(data.short_description || '');
                setCategory(data.category);
                setStatus(data.status);
                setPrice(data.price?.toString() || '');
                setOnSale(data.on_sale || false);
                setCompareAtPrice(data.compare_at_price?.toString() || '');
                setCostPerItem(data.cost_per_item?.toString() || '');
                setSku(data.sku || '');
                setTrackInventory(data.track_inventory);
                setInventoryQuantity(data.inventory_quantity?.toString() || '0');
                setLowStockThreshold(data.low_stock_threshold?.toString() || '5');
                setAllowBackorders(data.allow_backorders || false);
                setIsSoldOut(data.is_sold_out || false);
                setIsPreorder(data.is_preorder || false);
                setPreorderMessage(data.preorder_message || '');
                setPreorderReleaseDate(data.preorder_release_date || '');
                setSubscriptionAvailable(data.subscription_available || false);
                setSubscriptionDiscount(data.subscription_discount_percent?.toString() || '10');
                setSubscriptionFrequencies(data.subscription_frequency_options || ['monthly']);
                setHasVariants(data.has_variants || false);

                // Fetch variants if product has them
                if (data.has_variants) {
                    const { data: variantData } = await supabase
                        .from('product_variants')
                        .select('*')
                        .eq('product_id', productId)
                        .order('sort_order');

                    if (variantData && variantData.length > 0) {
                        setVariants(variantData.map(v => ({
                            id: v.id,
                            title: v.title,
                            option1: v.option1,
                            price: v.price?.toString() || '',
                            sku: v.sku || '',
                            inventory: v.inventory_quantity?.toString() || '0'
                        })));
                        // Set option name from first variant
                        if (variantData[0].option1) {
                            // Extract option name (before the colon if formatted as "Size: 2oz")
                            const firstValue = variantData[0].option1;
                            setVariantValues(variantData.map(v => v.option1));
                        }
                    }
                }

                descriptionEditor?.commands.setContent(data.description || '');
                ingredientsEditor?.commands.setContent(data.ingredients || '');
                usageEditor?.commands.setContent(data.usage_instructions || '');
                benefitsEditor?.commands.setContent(data.benefits || '');
                warningsEditor?.commands.setContent(data.warnings || '');
                returnPolicyEditor?.commands.setContent(data.return_policy || '');
                shippingInfoEditor?.commands.setContent(data.shipping_info || '');

                // Fetch images
                const { data: imageData } = await supabase
                    .from('product_images')
                    .select('*')
                    .eq('product_id', productId)
                    .order('sort_order');

                if (imageData) {
                    setImages(imageData.map(img => ({ url: img.image_url, alt: img.alt_text || '', id: img.id })));
                }
            }
        } catch (error) {
            console.error('Error fetching product:', error);
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setUploadingImage(true);
        try {
            const uploadedImages: { url: string, alt: string }[] = [];

            for (const file of Array.from(files)) {
                const fileExt = file.name.split('.').pop();
                const fileName = `${Math.random()}.${fileExt}`;
                const filePath = `products/${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('product-images')
                    .upload(filePath, file);

                if (uploadError) throw uploadError;

                const { data } = supabase.storage
                    .from('product-images')
                    .getPublicUrl(filePath);

                uploadedImages.push({ url: data.publicUrl, alt: '' });
            }

            setImages([...images, ...uploadedImages]);
        } catch (error: any) {
            console.error('Error uploading images:', error);
            alert(`Failed to upload images: ${error.message}`);
        } finally {
            setUploadingImage(false);
        }
    };

    const removeImage = (index: number) => {
        setImages(images.filter((_, i) => i !== index));
    };

    const handleSave = async () => {
        if (!title) {
            alert('Please enter a product title.');
            return;
        }

        setIsSaving(true);
        try {
            const productData = {
                title,
                slug: slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
                description: descriptionEditor?.getHTML() || '',
                short_description: shortDescription,
                category,
                status,
                price: price ? parseFloat(price) : null,
                on_sale: onSale,
                compare_at_price: compareAtPrice ? parseFloat(compareAtPrice) : null,
                cost_per_item: costPerItem ? parseFloat(costPerItem) : null,
                // Only include SKU if it's not empty to avoid unique constraint violations
                ...(sku && sku.trim() ? { sku: sku.trim() } : {}),
                track_inventory: trackInventory,
                inventory_quantity: parseInt(inventoryQuantity) || 0,
                low_stock_threshold: parseInt(lowStockThreshold) || 5,
                allow_backorders: allowBackorders,
                is_sold_out: isSoldOut,
                is_preorder: isPreorder,
                preorder_message: preorderMessage,
                preorder_release_date: preorderReleaseDate || null,
                subscription_available: subscriptionAvailable,
                subscription_discount_percent: subscriptionDiscount ? parseFloat(subscriptionDiscount) : null,
                subscription_frequency_options: subscriptionFrequencies,
                ingredients: ingredientsEditor?.getHTML() || '',
                usage_instructions: usageEditor?.getHTML() || '',
                benefits: benefitsEditor?.getHTML() || '',
                warnings: warningsEditor?.getHTML() || '',
                return_policy: returnPolicyEditor?.getHTML() || '',
                shipping_info: shippingInfoEditor?.getHTML() || '',
                has_variants: hasVariants,
                featured_image_url: images[0]?.url || null,
                published: status === 'active',
                updated_at: new Date().toISOString(),
            };

            let savedProductId = productId;

            if (productId) {
                const { error } = await supabase
                    .from('products')
                    .update(productData)
                    .eq('id', productId);

                if (error) throw error;
            } else {
                const { data, error } = await supabase
                    .from('products')
                    .insert([productData])
                    .select()
                    .single();

                if (error) throw error;
                savedProductId = data?.id;
            }

            // Save images
            if (savedProductId && images.length > 0) {
                // Delete existing images
                await supabase
                    .from('product_images')
                    .delete()
                    .eq('product_id', savedProductId);

                // Insert new images
                const imageData = images.map((img, idx) => ({
                    product_id: savedProductId,
                    image_url: img.url,
                    alt_text: img.alt,
                    sort_order: idx,
                    is_featured: idx === 0
                }));

                await supabase.from('product_images').insert(imageData);
            }

            // Save variants
            if (savedProductId && hasVariants && variants.length > 0) {
                // Delete existing variants first and wait for completion
                const { error: deleteError } = await supabase
                    .from('product_variants')
                    .delete()
                    .eq('product_id', savedProductId);

                if (deleteError) {
                    console.error('Error deleting variants:', deleteError);
                    throw new Error(`Failed to delete existing variants: ${deleteError.message}`);
                }

                // Small delay to ensure delete is committed before insert
                await new Promise(resolve => setTimeout(resolve, 300));

                // Insert new variants with unique SKUs
                const timestamp = Date.now();
                const variantData = variants.map((variant, idx) => {
                    // Generate a unique SKU using timestamp and index to prevent duplicates
                    let baseSku = variant.sku && variant.sku.trim()
                        ? variant.sku.trim().replace(/-\d+$/, '') // Remove any existing timestamp
                        : `${sku || 'PROD'}-V${idx}`;
                    let variantSku = `${baseSku}-${timestamp}-${idx}`;

                    return {
                        product_id: savedProductId,
                        title: variant.title,
                        option1: variant.option1,
                        option2: variant.option2 || null,
                        price: variant.price ? parseFloat(variant.price) : null,
                        sku: variantSku,
                        inventory_quantity: parseInt(variant.inventory) || 0,
                        available: true,
                        sort_order: idx
                    };
                });

                console.log('Saving variants:', variantData);

                const { error: variantError } = await supabase.from('product_variants').insert(variantData);

                if (variantError) {
                    console.error('Error saving variants:', variantError);
                    throw new Error(`Failed to save variants: ${variantError.message}`);
                }
            }

            alert('Product saved successfully!');
            onBack();
        } catch (error: any) {
            console.error('Error saving product:', error);
            alert(`Failed to save product: ${error.message}`);
        } finally {
            setIsSaving(false);
        }
    };

    const toggleSubscriptionFrequency = (freq: string) => {
        if (subscriptionFrequencies.includes(freq)) {
            setSubscriptionFrequencies(subscriptionFrequencies.filter(f => f !== freq));
        } else {
            setSubscriptionFrequencies([...subscriptionFrequencies, freq]);
        }
    };

    const addVariantValue = () => {
        if (newVariantValue && newVariantValue.trim()) {
            const trimmedValue = newVariantValue.trim();
            if (!variantValues.includes(trimmedValue)) {
                const newVariantValues = [...variantValues, trimmedValue];
                setVariantValues(newVariantValues);
                setNewVariantValue('');

                // If has second option, regenerate all combinations
                if (hasSecondOption && variantValues2.length > 0) {
                    // Regenerate will be called after state updates
                    setTimeout(() => {
                        regenerateVariantsFromValues(newVariantValues, variantValues2);
                    }, 0);
                } else {
                    // Add simple variant without option2
                    const newVariant = {
                        title: trimmedValue,
                        option1: trimmedValue,
                        price: price || '',
                        sku: `${sku || 'PROD'}-${trimmedValue.toUpperCase().replace(/[^A-Z0-9]/g, '')}`,
                        inventory: '0'
                    };
                    setVariants([...variants, newVariant]);
                }
            }
        }
    };

    const removeVariantValue = (value: string) => {
        setVariantValues(variantValues.filter(v => v !== value));
        setVariants(variants.filter(v => v.option1 !== value));
    };

    const updateVariant = (option1: string, field: string, value: string) => {
        setVariants(variants.map(v =>
            v.option1 === option1 ? { ...v, [field]: value } : v
        ));
    };

    const updateVariantByIndex = (index: number, field: string, value: string) => {
        setVariants(variants.map((v, i) =>
            i === index ? { ...v, [field]: value } : v
        ));
    };

    // Regenerate all variant combinations when option2 values change
    const regenerateVariants = (option2Values: string[]) => {
        regenerateVariantsFromValues(variantValues, option2Values);
    };

    // Regenerate variants with explicit option arrays
    const regenerateVariantsFromValues = (option1Values: string[], option2Values: string[]) => {
        if (option1Values.length === 0) return;

        const newVariants: typeof variants = [];

        if (option2Values.length === 0) {
            // No second option, just keep option1 variants
            option1Values.forEach(opt1 => {
                const existing = variants.find(v => v.option1 === opt1 && !v.option2);
                newVariants.push({
                    title: opt1,
                    option1: opt1,
                    price: existing?.price || price || '',
                    sku: existing?.sku || `${sku || 'PROD'}-${opt1.toUpperCase().replace(/[^A-Z0-9]/g, '')}`,
                    inventory: existing?.inventory || '0'
                });
            });
        } else {
            // Generate all combinations of option1 x option2
            option1Values.forEach(opt1 => {
                option2Values.forEach(opt2 => {
                    const existing = variants.find(v => v.option1 === opt1 && v.option2 === opt2);
                    newVariants.push({
                        title: `${opt1} / ${opt2}`,
                        option1: opt1,
                        option2: opt2,
                        price: existing?.price || price || '',
                        sku: existing?.sku || `${sku || 'PROD'}-${opt1.toUpperCase().replace(/[^A-Z0-9]/g, '')}-${opt2.toUpperCase().replace(/[^A-Z0-9]/g, '')}`,
                        inventory: existing?.inventory || '0'
                    });
                });
            });
        }

        setVariants(newVariants);
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-black via-purple-900/10 to-black p-8">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <button
                        onClick={onBack}
                        className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors font-urbanist"
                    >
                        <ArrowLeft size={20} />
                        Back to Products
                    </button>
                    <div className="flex items-center gap-4">
                        <select
                            value={status}
                            onChange={(e) => setStatus(e.target.value as any)}
                            className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-gray-300 font-urbanist focus:outline-none focus:border-purple-500/50"
                        >
                            <option value="draft">Draft</option>
                            <option value="active">Active</option>
                            <option value="archived">Archived</option>
                        </select>
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-urbanist font-bold rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50"
                        >
                            <Save size={18} />
                            {isSaving ? 'Saving...' : 'Save Product'}
                        </button>
                    </div>
                </div>

                {/* Product Title */}
                <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Product Name"
                    className="w-full bg-transparent border-b-2 border-white/20 text-4xl font-cinzel text-white mb-8 pb-4 focus:outline-none focus:border-purple-500/50 placeholder-gray-600"
                />

                <div className="space-y-6">
                    {/* Images Section */}
                    <Section title="Product Images">
                        <div className="grid grid-cols-4 gap-4">
                            {images.map((img, idx) => (
                                <div key={idx} className="relative group aspect-square">
                                    <img
                                        src={img.url}
                                        alt={img.alt}
                                        className="w-full h-full object-cover rounded-lg border border-white/10"
                                    />
                                    <button
                                        onClick={() => removeImage(idx)}
                                        className="absolute top-2 right-2 p-1 bg-red-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <X size={14} className="text-white" />
                                    </button>
                                    {idx === 0 && (
                                        <span className="absolute bottom-2 left-2 px-2 py-1 bg-purple-600 text-white text-xs rounded font-urbanist">
                                            Featured
                                        </span>
                                    )}
                                </div>
                            ))}
                            <label className="aspect-square border-2 border-dashed border-white/20 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-purple-500/50 transition-colors">
                                <ImageIcon className="w-8 h-8 text-gray-600 mb-2" />
                                <span className="text-xs text-gray-500 font-urbanist">Add Images</span>
                                <input
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    onChange={handleImageUpload}
                                    className="hidden"
                                    disabled={uploadingImage}
                                />
                            </label>
                        </div>
                    </Section>

                    {/* Basic Info */}
                    <Section title="Basic Information">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs text-gray-500 uppercase tracking-wider mb-2 font-urbanist">Category</label>
                                <select
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-300 focus:border-purple-500/50 focus:outline-none font-urbanist"
                                >
                                    {CATEGORIES.map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 uppercase tracking-wider mb-2 font-urbanist">URL Slug</label>
                                <input
                                    type="text"
                                    value={slug}
                                    onChange={(e) => setSlug(e.target.value)}
                                    placeholder="product-slug"
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-300 focus:border-purple-500/50 focus:outline-none placeholder-gray-600 font-urbanist"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs text-gray-500 uppercase tracking-wider mb-2 font-urbanist">Short Description</label>
                            <textarea
                                value={shortDescription}
                                onChange={(e) => setShortDescription(e.target.value)}
                                rows={2}
                                placeholder="Brief description for product cards..."
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-300 focus:border-purple-500/50 focus:outline-none placeholder-gray-600 resize-none font-urbanist"
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-gray-500 uppercase tracking-wider mb-2 font-urbanist">Full Description</label>
                            <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                                <EditorContent editor={descriptionEditor} className="prose prose-invert max-w-none" />
                            </div>
                        </div>
                    </Section>

                    {/* Pricing */}
                    <Section title="Pricing">
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs text-gray-500 uppercase tracking-wider mb-2 font-urbanist">Price ($)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={price}
                                    onChange={(e) => setPrice(e.target.value)}
                                    placeholder="0.00"
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-300 focus:border-purple-500/50 focus:outline-none font-urbanist"
                                />
                            </div>
                            <div>
                                <label className="flex items-center gap-2 text-sm text-gray-400 mb-2 font-urbanist">
                                    <input
                                        type="checkbox"
                                        checked={onSale}
                                        onChange={(e) => setOnSale(e.target.checked)}
                                        className="rounded"
                                    />
                                    On Sale
                                </label>
                                {onSale && (
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={compareAtPrice}
                                        onChange={(e) => setCompareAtPrice(e.target.value)}
                                        placeholder="Original price"
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-300 focus:border-purple-500/50 focus:outline-none font-urbanist"
                                    />
                                )}
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 uppercase tracking-wider mb-2 font-urbanist">Cost ($)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={costPerItem}
                                    onChange={(e) => setCostPerItem(e.target.value)}
                                    placeholder="0.00"
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-300 focus:border-purple-500/50 focus:outline-none font-urbanist"
                                />
                            </div>
                        </div>
                    </Section>

                    {/* Variants Section */}
                    <Section title="Product Options & Variants">
                        <label className="flex items-center gap-2 text-sm text-gray-400 mb-4 font-urbanist">
                            <input
                                type="checkbox"
                                checked={hasVariants}
                                onChange={(e) => {
                                    const checked = e.target.checked;
                                    setHasVariants(checked);
                                    if (!checked) {
                                        setVariants([]);
                                        setVariantValues([]);
                                        setVariantValues2([]);
                                        setHasSecondOption(false);
                                    }
                                }}
                                className="rounded"
                            />
                            This product has multiple options (sizes, bases, etc.)
                        </label>
                        {hasVariants && (
                            <div className="space-y-4">
                                {/* Option 1 (e.g., Size) */}
                                <div className="bg-purple-900/10 border border-purple-500/20 rounded-lg p-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <div>
                                            <label className="block text-xs text-gray-500 uppercase tracking-wider mb-2 font-urbanist">Option 1 Name</label>
                                            <input
                                                type="text"
                                                value={variantOption1}
                                                onChange={(e) => setVariantOption1(e.target.value)}
                                                placeholder="Size, Weight, etc."
                                                className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-300 focus:border-purple-500/50 focus:outline-none font-urbanist"
                                            />
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="text"
                                                value={newVariantValue}
                                                onChange={(e) => setNewVariantValue(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        e.preventDefault();
                                                        addVariantValue();
                                                    }
                                                }}
                                                placeholder={`e.g., 2oz, 4oz`}
                                                className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-300 focus:border-purple-500/50 focus:outline-none font-urbanist w-32"
                                            />
                                            <button
                                                type="button"
                                                onClick={addVariantValue}
                                                className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-urbanist rounded-lg transition-colors"
                                            >
                                                <Plus size={16} />
                                                Add {variantOption1}
                                            </button>
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {variantValues.map((value) => (
                                            <div key={value} className="flex items-center gap-1 bg-white/10 px-3 py-1 rounded-full text-sm text-gray-300 font-urbanist">
                                                {value}
                                                <button
                                                    onClick={() => removeVariantValue(value)}
                                                    className="ml-1 text-red-400 hover:text-red-300"
                                                >
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Option 2 Toggle and Controls */}
                                <label className="flex items-center gap-2 text-sm text-gray-400 font-urbanist">
                                    <input
                                        type="checkbox"
                                        checked={hasSecondOption}
                                        onChange={(e) => {
                                            setHasSecondOption(e.target.checked);
                                            if (!e.target.checked) {
                                                setVariantValues2([]);
                                                // Remove option2 from variants
                                                setVariants(variants.map(v => ({ ...v, option2: undefined })));
                                            }
                                        }}
                                        className="rounded"
                                    />
                                    Add a second option (e.g., Base type)
                                </label>

                                {hasSecondOption && (
                                    <div className="bg-green-900/10 border border-green-500/20 rounded-lg p-4">
                                        <div className="flex items-center justify-between mb-3">
                                            <div>
                                                <label className="block text-xs text-gray-500 uppercase tracking-wider mb-2 font-urbanist">Option 2 Name</label>
                                                <input
                                                    type="text"
                                                    value={variantOption2}
                                                    onChange={(e) => setVariantOption2(e.target.value)}
                                                    placeholder="Base, Type, etc."
                                                    className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-300 focus:border-green-500/50 focus:outline-none font-urbanist"
                                                />
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const newValue = prompt(`Enter new ${variantOption2} option (e.g., "Glycerin", "Spirits"):`);
                                                    if (newValue && newValue.trim()) {
                                                        const trimmedValue = newValue.trim();
                                                        if (!variantValues2.includes(trimmedValue)) {
                                                            setVariantValues2([...variantValues2, trimmedValue]);
                                                            // Regenerate variants with all combinations
                                                            regenerateVariants([...variantValues2, trimmedValue]);
                                                        }
                                                    }
                                                }}
                                                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-urbanist rounded-lg transition-colors"
                                            >
                                                <Plus size={16} />
                                                Add {variantOption2}
                                            </button>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {variantValues2.map((value) => (
                                                <div key={value} className="flex items-center gap-1 bg-green-500/20 px-3 py-1 rounded-full text-sm text-gray-300 font-urbanist">
                                                    {value}
                                                    <button
                                                        onClick={() => {
                                                            const newValues = variantValues2.filter(v => v !== value);
                                                            setVariantValues2(newValues);
                                                            regenerateVariants(newValues);
                                                        }}
                                                        className="ml-1 text-red-400 hover:text-red-300"
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {variants.length > 0 && (
                                    <div className="bg-white/5 border border-white/10 rounded-lg overflow-hidden">
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm">
                                                <thead className="bg-white/5 border-b border-white/10">
                                                    <tr>
                                                        <th className="text-left px-4 py-3 text-xs text-gray-500 uppercase tracking-wider font-urbanist">{variantOption1}</th>
                                                        {hasSecondOption && (
                                                            <th className="text-left px-4 py-3 text-xs text-gray-500 uppercase tracking-wider font-urbanist">{variantOption2}</th>
                                                        )}
                                                        <th className="text-left px-4 py-3 text-xs text-gray-500 uppercase tracking-wider font-urbanist">Price ($)</th>
                                                        <th className="text-left px-4 py-3 text-xs text-gray-500 uppercase tracking-wider font-urbanist">SKU</th>
                                                        <th className="text-left px-4 py-3 text-xs text-gray-500 uppercase tracking-wider font-urbanist">Inventory</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-white/10">
                                                    {variants.map((variant, idx) => (
                                                        <tr key={`${variant.option1}-${variant.option2 || ''}-${idx}`} className="hover:bg-white/5">
                                                            <td className="px-4 py-3 text-gray-300 font-urbanist font-medium">{variant.option1}</td>
                                                            {hasSecondOption && (
                                                                <td className="px-4 py-3 text-green-400 font-urbanist">{variant.option2 || '-'}</td>
                                                            )}
                                                            <td className="px-4 py-3">
                                                                <input
                                                                    type="number"
                                                                    step="0.01"
                                                                    value={variant.price}
                                                                    onChange={(e) => updateVariantByIndex(idx, 'price', e.target.value)}
                                                                    placeholder="0.00"
                                                                    className="w-24 bg-white/5 border border-white/10 rounded px-2 py-1 text-sm text-gray-300 focus:border-purple-500/50 focus:outline-none font-urbanist"
                                                                />
                                                            </td>
                                                            <td className="px-4 py-3">
                                                                <input
                                                                    type="text"
                                                                    value={variant.sku}
                                                                    onChange={(e) => updateVariantByIndex(idx, 'sku', e.target.value)}
                                                                    placeholder="SKU"
                                                                    className="w-32 bg-white/5 border border-white/10 rounded px-2 py-1 text-sm text-gray-300 focus:border-purple-500/50 focus:outline-none font-urbanist"
                                                                />
                                                            </td>
                                                            <td className="px-4 py-3">
                                                                <input
                                                                    type="number"
                                                                    value={variant.inventory}
                                                                    onChange={(e) => updateVariantByIndex(idx, 'inventory', e.target.value)}
                                                                    placeholder="0"
                                                                    className="w-20 bg-white/5 border border-white/10 rounded px-2 py-1 text-sm text-gray-300 focus:border-purple-500/50 focus:outline-none font-urbanist"
                                                                />
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </Section>

                    {/* Inventory */}
                    <Section title="Inventory">
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-xs text-gray-500 uppercase tracking-wider mb-2 font-urbanist">SKU</label>
                                <input
                                    type="text"
                                    value={sku}
                                    onChange={(e) => setSku(e.target.value)}
                                    placeholder="PRODUCT-SKU"
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-300 focus:border-purple-500/50 focus:outline-none font-urbanist"
                                />
                            </div>
                        </div>
                        <label className="flex items-center gap-2 text-sm text-gray-400 mb-4 font-urbanist">
                            <input
                                type="checkbox"
                                checked={trackInventory}
                                onChange={(e) => setTrackInventory(e.target.checked)}
                                className="rounded"
                            />
                            Track Inventory
                        </label>
                        {trackInventory && (
                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="block text-xs text-gray-500 uppercase tracking-wider mb-2 font-urbanist">
                                        Quantity {hasVariants && variants.length > 0 && <span className="text-purple-400 normal-case">(auto-calculated from variants)</span>}
                                    </label>
                                    <input
                                        type="number"
                                        value={hasVariants && variants.length > 0
                                            ? variants.reduce((sum, v) => sum + (parseInt(v.inventory) || 0), 0)
                                            : inventoryQuantity}
                                        onChange={(e) => setInventoryQuantity(e.target.value)}
                                        readOnly={hasVariants && variants.length > 0}
                                        className={`w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-300 focus:border-purple-500/50 focus:outline-none font-urbanist ${hasVariants && variants.length > 0 ? 'cursor-not-allowed opacity-70' : ''}`}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-500 uppercase tracking-wider mb-2 font-urbanist">Low Stock Alert</label>
                                    <input
                                        type="number"
                                        value={lowStockThreshold}
                                        onChange={(e) => setLowStockThreshold(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-300 focus:border-purple-500/50 focus:outline-none font-urbanist"
                                    />
                                </div>
                            </div>
                        )}
                        <label className="flex items-center gap-2 text-sm text-gray-400 mb-4 font-urbanist">
                            <input
                                type="checkbox"
                                checked={allowBackorders}
                                onChange={(e) => setAllowBackorders(e.target.checked)}
                                className="rounded"
                            />
                            Allow Backorders
                        </label>

                        {/* Sold Out Toggle */}
                        <div className="border-t border-white/10 pt-4 mt-4">
                            <button
                                type="button"
                                onClick={() => setIsSoldOut(!isSoldOut)}
                                className={`w-full py-4 rounded-lg font-urbanist font-bold text-sm uppercase tracking-wider transition-all ${isSoldOut
                                    ? 'bg-red-600 hover:bg-red-700 text-white'
                                    : 'bg-white/10 hover:bg-white/20 text-gray-300'
                                    }`}
                            >
                                {isSoldOut ? '🚫 MARKED AS SOLD OUT' : '✓ Mark as Sold Out'}
                            </button>
                            <p className="text-xs text-gray-500 mt-2 font-urbanist">
                                {isSoldOut
                                    ? 'This product shows "Sold Out" on the frontend. Click to make it available again.'
                                    : 'Click to mark this product as sold out (overrides inventory count).'
                                }
                            </p>
                        </div>

                        <div className="border-t border-white/10 pt-4 mt-4">
                            <label className="flex items-center gap-2 text-sm text-gray-400 mb-4 font-urbanist">
                                <input
                                    type="checkbox"
                                    checked={isPreorder}
                                    onChange={(e) => setIsPreorder(e.target.checked)}
                                    className="rounded"
                                />
                                This is a Pre-order Item
                            </label>
                            {isPreorder && (
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-xs text-gray-500 uppercase tracking-wider mb-2 font-urbanist">Release Date</label>
                                        <input
                                            type="date"
                                            value={preorderReleaseDate}
                                            onChange={(e) => setPreorderReleaseDate(e.target.value)}
                                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-300 focus:border-purple-500/50 focus:outline-none font-urbanist"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-500 uppercase tracking-wider mb-2 font-urbanist">Pre-order Message</label>
                                        <input
                                            type="text"
                                            value={preorderMessage}
                                            onChange={(e) => setPreorderMessage(e.target.value)}
                                            placeholder="Ships February 2026"
                                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-300 focus:border-purple-500/50 focus:outline-none font-urbanist"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </Section>

                    {/* Subscription Options */}
                    <Section title="Subscription Options">
                        <label className="flex items-center gap-2 text-sm text-gray-400 mb-4 font-urbanist">
                            <input
                                type="checkbox"
                                checked={subscriptionAvailable}
                                onChange={(e) => setSubscriptionAvailable(e.target.checked)}
                                className="rounded"
                            />
                            Allow Subscriptions for this Product
                        </label>
                        {subscriptionAvailable && (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs text-gray-500 uppercase tracking-wider mb-2 font-urbanist">Subscription Discount (%)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={subscriptionDiscount}
                                        onChange={(e) => setSubscriptionDiscount(e.target.value)}
                                        placeholder="10"
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-300 focus:border-purple-500/50 focus:outline-none font-urbanist"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-500 uppercase tracking-wider mb-2 font-urbanist">Available Frequencies</label>
                                    <div className="space-y-2">
                                        {SUBSCRIPTION_FREQUENCIES.map(freq => (
                                            <label key={freq.value} className="flex items-center gap-2 text-sm text-gray-400 font-urbanist">
                                                <input
                                                    type="checkbox"
                                                    checked={subscriptionFrequencies.includes(freq.value)}
                                                    onChange={() => toggleSubscriptionFrequency(freq.value)}
                                                    className="rounded"
                                                />
                                                {freq.label}
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </Section>

                    {/* Additional Information */}
                    <Collapsible title="Ingredients">
                        <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                            <EditorContent editor={ingredientsEditor} className="prose prose-invert max-w-none" />
                        </div>
                    </Collapsible>

                    <Collapsible title="Usage Instructions">
                        <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                            <EditorContent editor={usageEditor} className="prose prose-invert max-w-none" />
                        </div>
                    </Collapsible>

                    <Collapsible title="Benefits">
                        <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                            <EditorContent editor={benefitsEditor} className="prose prose-invert max-w-none" />
                        </div>
                    </Collapsible>

                    <Collapsible title="Warnings & Precautions">
                        <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                            <EditorContent editor={warningsEditor} className="prose prose-invert max-w-none" />
                        </div>
                    </Collapsible>

                    <Collapsible title="Return Policy">
                        <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                            <EditorContent editor={returnPolicyEditor} className="prose prose-invert max-w-none" />
                        </div>
                    </Collapsible>

                    <Collapsible title="Shipping Information">
                        <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                            <EditorContent editor={shippingInfoEditor} className="prose prose-invert max-w-none" />
                        </div>
                    </Collapsible>
                </div>
            </div>
        </div>
    );
};

const Section = ({ title, children }: { title: string, children: React.ReactNode }) => (
    <div className="bg-white/5 border border-white/10 rounded-xl p-6">
        <h3 className="text-lg font-cinzel text-white mb-4">{title}</h3>
        {children}
    </div>
);

const Collapsible = ({ title, children }: { title: string, children: React.ReactNode }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-6 hover:bg-white/5 transition-colors"
            >
                <h3 className="text-lg font-cinzel text-white">{title}</h3>
                <span className="text-gray-400">{isOpen ? '▼' : '▶'}</span>
            </button>
            {isOpen && (
                <div className="px-6 pb-6">
                    {children}
                </div>
            )}
        </div>
    );
};

export default ProductEditor;
