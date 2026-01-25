import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { ArrowLeft, Save, Trash2, Calendar, Tag, Percent, DollarSign, Package, TrendingUp } from 'lucide-react';

interface CouponEditorProps {
    couponId?: string;
    onBack: () => void;
}

const DISCOUNT_TYPES = [
    { value: 'percentage', label: 'Percentage Off', icon: Percent },
    { value: 'fixed_amount', label: 'Fixed Amount Off', icon: DollarSign },
    { value: 'free_shipping', label: 'Free Shipping', icon: Package },
];

const APPLIES_TO_OPTIONS = [
    { value: 'all', label: 'All Products' },
    { value: 'specific_products', label: 'Specific Products' },
    { value: 'specific_categories', label: 'Specific Categories' },
];

const CATEGORIES = [
    "Capsulated Botanics & Herbs",
    "Extracts",
    "Sea Moss",
    "Spiritual Wellness",
    "Women's Wellness"
];

export const CouponEditor = ({ couponId, onBack }: CouponEditorProps) => {
    // Basic Info
    const [code, setCode] = useState('');
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');

    // Discount Configuration
    const [discountType, setDiscountType] = useState<'percentage' | 'fixed_amount' | 'free_shipping'>('percentage');
    const [discountValue, setDiscountValue] = useState('');

    // Applicability
    const [appliesTo, setAppliesTo] = useState<'all' | 'specific_products' | 'specific_categories'>('all');
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [minimumPurchase, setMinimumPurchase] = useState('');

    // Validity Period
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    // Usage Limits
    const [usageLimit, setUsageLimit] = useState('');
    const [usageLimitPerCustomer, setUsageLimitPerCustomer] = useState('1');

    // Status
    const [isActive, setIsActive] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (couponId) {
            fetchCoupon();
        }
    }, [couponId]);

    const fetchCoupon = async () => {
        if (!couponId) return;

        try {
            const { data, error } = await supabase
                .from('coupons')
                .select('*')
                .eq('id', couponId)
                .single();

            if (error) throw error;

            if (data) {
                setCode(data.code);
                setName(data.name);
                setDescription(data.description || '');
                setDiscountType(data.discount_type);
                setDiscountValue(data.discount_value?.toString() || '');
                setAppliesTo(data.applies_to);
                setSelectedCategories(data.category_names || []);
                setMinimumPurchase(data.minimum_purchase?.toString() || '');
                setStartDate(data.start_date ? new Date(data.start_date).toISOString().split('T')[0] : '');
                setEndDate(data.end_date ? new Date(data.end_date).toISOString().split('T')[0] : '');
                setUsageLimit(data.usage_limit?.toString() || '');
                setUsageLimitPerCustomer(data.usage_limit_per_customer?.toString() || '1');
                setIsActive(data.is_active);
            }
        } catch (error) {
            console.error('Error fetching coupon:', error);
            alert('Failed to load coupon');
        }
    };

    const handleCodeChange = (value: string) => {
        // Auto-uppercase and remove spaces
        setCode(value.toUpperCase().replace(/\s/g, ''));
    };

    const toggleCategory = (category: string) => {
        if (selectedCategories.includes(category)) {
            setSelectedCategories(selectedCategories.filter(c => c !== category));
        } else {
            setSelectedCategories([...selectedCategories, category]);
        }
    };

    const handleSave = async () => {
        if (!code || !name) {
            alert('Please enter a coupon code and name.');
            return;
        }

        if (!discountValue && discountType !== 'free_shipping') {
            alert('Please enter a discount value.');
            return;
        }

        setIsSaving(true);
        try {
            const couponData = {
                code: code.trim(),
                name: name.trim(),
                description: description.trim() || null,
                discount_type: discountType,
                discount_value: discountType !== 'free_shipping' ? parseFloat(discountValue) : null,
                applies_to: appliesTo,
                category_names: appliesTo === 'specific_categories' ? selectedCategories : null,
                product_ids: null, // Can be enhanced later for specific products
                minimum_purchase: minimumPurchase ? parseFloat(minimumPurchase) : null,
                start_date: startDate || null,
                end_date: endDate || null,
                usage_limit: usageLimit ? parseInt(usageLimit) : null,
                usage_limit_per_customer: usageLimitPerCustomer ? parseInt(usageLimitPerCustomer) : 1,
                is_active: isActive,
                updated_at: new Date().toISOString(),
            };

            if (couponId) {
                const { error } = await supabase
                    .from('coupons')
                    .update(couponData)
                    .eq('id', couponId);

                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('coupons')
                    .insert([couponData]);

                if (error) throw error;
            }

            alert('Coupon saved successfully!');
            onBack();
        } catch (error: any) {
            console.error('Error saving coupon:', error);
            if (error.code === '23505') {
                alert('A coupon with this code already exists. Please use a different code.');
            } else {
                alert(`Failed to save coupon: ${error.message}`);
            }
        } finally {
            setIsSaving(false);
        }
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
                        Back to Coupons
                    </button>
                    <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 text-sm text-gray-400 font-urbanist">
                            <input
                                type="checkbox"
                                checked={isActive}
                                onChange={(e) => setIsActive(e.target.checked)}
                                className="rounded"
                            />
                            Active
                        </label>
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-urbanist font-bold rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50"
                        >
                            <Save size={18} />
                            {isSaving ? 'Saving...' : 'Save Coupon'}
                        </button>
                    </div>
                </div>

                {/* Coupon Code */}
                <input
                    type="text"
                    value={code}
                    onChange={(e) => handleCodeChange(e.target.value)}
                    placeholder="COUPON CODE"
                    className="w-full bg-transparent border-b-2 border-white/20 text-4xl font-cinzel text-white mb-8 pb-4 focus:outline-none focus:border-purple-500/50 placeholder-gray-600 uppercase tracking-wider"
                    maxLength={20}
                />

                <div className="space-y-6">
                    {/* Basic Info */}
                    <Section title="Basic Information">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs text-gray-500 uppercase tracking-wider mb-2 font-urbanist">Internal Name</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="e.g., New Year Sale 2026"
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-300 focus:border-purple-500/50 focus:outline-none placeholder-gray-600 font-urbanist"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 uppercase tracking-wider mb-2 font-urbanist">Description (Optional)</label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    rows={2}
                                    placeholder="Internal notes about this coupon..."
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-300 focus:border-purple-500/50 focus:outline-none placeholder-gray-600 resize-none font-urbanist"
                                />
                            </div>
                        </div>
                    </Section>

                    {/* Discount Type */}
                    <Section title="Discount Type">
                        <div className="grid grid-cols-3 gap-3">
                            {DISCOUNT_TYPES.map((type) => {
                                const Icon = type.icon;
                                return (
                                    <button
                                        key={type.value}
                                        onClick={() => setDiscountType(type.value as any)}
                                        className={`p-4 rounded-lg border-2 transition-all ${discountType === type.value
                                                ? 'border-purple-500 bg-purple-500/10'
                                                : 'border-white/10 hover:border-white/30'
                                            }`}
                                    >
                                        <Icon className={`w-6 h-6 mx-auto mb-2 ${discountType === type.value ? 'text-purple-400' : 'text-gray-500'
                                            }`} />
                                        <div className={`text-sm font-urbanist ${discountType === type.value ? 'text-purple-300' : 'text-gray-400'
                                            }`}>
                                            {type.label}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                        {discountType !== 'free_shipping' && (
                            <div className="mt-4">
                                <label className="block text-xs text-gray-500 uppercase tracking-wider mb-2 font-urbanist">
                                    {discountType === 'percentage' ? 'Percentage (%)' : 'Amount ($)'}
                                </label>
                                <input
                                    type="number"
                                    step={discountType === 'percentage' ? '1' : '0.01'}
                                    value={discountValue}
                                    onChange={(e) => setDiscountValue(e.target.value)}
                                    placeholder={discountType === 'percentage' ? '10' : '5.00'}
                                    max={discountType === 'percentage' ? '100' : undefined}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-300 focus:border-purple-500/50 focus:outline-none font-urbanist"
                                />
                            </div>
                        )}
                    </Section>

                    {/* Applies To */}
                    <Section title="Applies To">
                        <div className="space-y-3">
                            {APPLIES_TO_OPTIONS.map((option) => (
                                <label key={option.value} className="flex items-center gap-3 text-sm text-gray-400 font-urbanist cursor-pointer">
                                    <input
                                        type="radio"
                                        name="applies_to"
                                        value={option.value}
                                        checked={appliesTo === option.value}
                                        onChange={(e) => setAppliesTo(e.target.value as any)}
                                        className="rounded-full"
                                    />
                                    {option.label}
                                </label>
                            ))}
                        </div>
                        {appliesTo === 'specific_categories' && (
                            <div className="mt-4 space-y-2">
                                <label className="block text-xs text-gray-500 uppercase tracking-wider mb-2 font-urbanist">Select Categories</label>
                                {CATEGORIES.map((category) => (
                                    <label key={category} className="flex items-center gap-3 text-sm text-gray-400 font-urbanist cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={selectedCategories.includes(category)}
                                            onChange={() => toggleCategory(category)}
                                            className="rounded"
                                        />
                                        {category}
                                    </label>
                                ))}
                            </div>
                        )}
                    </Section>

                    {/* Minimum Purchase */}
                    <Section title="Minimum Purchase (Optional)">
                        <div>
                            <label className="block text-xs text-gray-500 uppercase tracking-wider mb-2 font-urbanist">Minimum Order Value ($)</label>
                            <input
                                type="number"
                                step="0.01"
                                value={minimumPurchase}
                                onChange={(e) => setMinimumPurchase(e.target.value)}
                                placeholder="No minimum"
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-300 focus:border-purple-500/50 focus:outline-none placeholder-gray-600 font-urbanist"
                            />
                        </div>
                    </Section>

                    {/* Validity Period */}
                    <Section title="Validity Period">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs text-gray-500 uppercase tracking-wider mb-2 font-urbanist">Start Date (Optional)</label>
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-300 focus:border-purple-500/50 focus:outline-none font-urbanist"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 uppercase tracking-wider mb-2 font-urbanist">End Date (Optional)</label>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-300 focus:border-purple-500/50 focus:outline-none font-urbanist"
                                />
                            </div>
                        </div>
                    </Section>

                    {/* Usage Limits */}
                    <Section title="Usage Limits">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs text-gray-500 uppercase tracking-wider mb-2 font-urbanist">Total Uses</label>
                                <input
                                    type="number"
                                    value={usageLimit}
                                    onChange={(e) => setUsageLimit(e.target.value)}
                                    placeholder="Unlimited"
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-300 focus:border-purple-500/50 focus:outline-none placeholder-gray-600 font-urbanist"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 uppercase tracking-wider mb-2 font-urbanist">Uses Per Customer</label>
                                <input
                                    type="number"
                                    value={usageLimitPerCustomer}
                                    onChange={(e) => setUsageLimitPerCustomer(e.target.value)}
                                    placeholder="1"
                                    min="1"
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-300 focus:border-purple-500/50 focus:outline-none placeholder-gray-600 font-urbanist"
                                />
                            </div>
                        </div>
                    </Section>
                </div>
            </div>
        </div>
    );
};

const Section = ({ title, children }: { title: string, children: React.ReactNode }) => (
    <div className="bg-white/5 border border-white/10 rounded-lg p-6">
        <h3 className="text-sm uppercase tracking-wider text-purple-400 mb-4 font-urbanist font-bold">{title}</h3>
        {children}
    </div>
);

export default CouponEditor;
