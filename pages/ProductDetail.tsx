import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Star, ShoppingBag, Check, Minus, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import gsap from 'gsap';
import CouponInput from '../components/CouponInput';
import ReviewDisplay from '../components/reviews/ReviewDisplay';
import { useCart } from '../components/cart';
import SEOHead from '../components/SEOHead';
import { getProductSchema, getBreadcrumbSchema } from '../lib/schema';

interface ProductVariant {
    id: string;
    title: string;
    option1: string;
    option2?: string;
    price: number;
    inventory_quantity: number;
    available: boolean;
}

interface Product {
    id: string;
    title: string;
    description: string;
    short_description: string;
    price: number;
    featured_image_url: string;
    category: string;
    has_variants: boolean;
    ingredients: string;
    usage_instructions: string;
    benefits: string;
    warnings: string;
    return_policy: string;
    shipping_info: string;
    subscription_available: boolean;
    subscription_discount_percent: number;
    subscription_frequency_options: string[];
    is_sold_out?: boolean;
}

const ProductDetail = () => {
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();
    const { addItem } = useCart();
    const [product, setProduct] = useState<Product | null>(null);
    const [variants, setVariants] = useState<ProductVariant[]>([]);
    const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
    const [loading, setLoading] = useState(true);
    const [isSubscription, setIsSubscription] = useState(false);
    const [subscriptionFrequency, setSubscriptionFrequency] = useState('monthly');
    const [couponDiscount, setCouponDiscount] = useState(0);
    const [quantity, setQuantity] = useState(1);
    const [reviewCount, setReviewCount] = useState(0);
    const [prevProduct, setPrevProduct] = useState<{ slug: string; title: string } | null>(null);
    const [nextProduct, setNextProduct] = useState<{ slug: string; title: string } | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // State for dropdown selections
    const [selectedOption1, setSelectedOption1] = useState<string>('');
    const [selectedOption2, setSelectedOption2] = useState<string>('');
    const [option1Values, setOption1Values] = useState<string[]>([]);
    const [option2Values, setOption2Values] = useState<string[]>([]);

    // Handle adding product to cart
    const handleAddToCart = () => {
        if (!product) return;

        const price = selectedVariant?.price || product.price || 0;
        const variantTitle = selectedVariant
            ? [selectedVariant.option1, selectedVariant.option2].filter(Boolean).join(' / ')
            : undefined;

        addItem({
            productId: product.id,
            variantId: selectedVariant?.id,
            title: product.title,
            variantTitle,
            price,
            image: product.featured_image_url || '/assets/blood_bush_tea.png',
            quantity,
            isSubscription,
            subscriptionFrequency: isSubscription ? subscriptionFrequency : undefined,
            subscriptionDiscount: isSubscription ? product.subscription_discount_percent : undefined,
            maxQuantity: selectedVariant?.inventory_quantity || 99
        });
    };

    useEffect(() => {
        let isMounted = true;

        const fetchProductData = async () => {
            try {
                // Fetch product by slug
                const { data: productData, error: productError } = await supabase
                    .from('products')
                    .select('*')
                    .eq('slug', slug)
                    .eq('status', 'active')
                    .eq('published', true)
                    .single();

                if (!isMounted) return;
                if (productError) throw productError;

                setProduct(productData);

                // Fetch all published products to determine prev/next navigation
                const { data: allProducts } = await supabase
                    .from('products')
                    .select('slug, title')
                    .eq('status', 'active')
                    .eq('published', true)
                    .order('sort_order', { ascending: true })
                    .order('created_at', { ascending: true });

                if (!isMounted) return;

                if (allProducts && allProducts.length > 1) {
                    const currentIndex = allProducts.findIndex(p => p.slug === slug);
                    if (currentIndex > 0) {
                        setPrevProduct(allProducts[currentIndex - 1]);
                    } else {
                        setPrevProduct(null);
                    }
                    if (currentIndex < allProducts.length - 1) {
                        setNextProduct(allProducts[currentIndex + 1]);
                    } else {
                        setNextProduct(null);
                    }
                } else {
                    setPrevProduct(null);
                    setNextProduct(null);
                }

                // Fetch review count
                const { count: reviewsCount } = await supabase
                    .from('reviews')
                    .select('*', { count: 'exact', head: true })
                    .eq('product_id', productData.id)
                    .eq('status', 'approved');

                if (!isMounted) return;
                setReviewCount(reviewsCount || 0);

                // Initialize subscription frequency if available
                if (productData.subscription_available && productData.subscription_frequency_options?.length > 0) {
                    setSubscriptionFrequency(productData.subscription_frequency_options[0]);
                }

                // Fetch variants if product has them
                if (productData.has_variants) {
                    const { data: variantData, error: variantError } = await supabase
                        .from('product_variants')
                        .select('*')
                        .eq('product_id', productData.id)
                        .order('sort_order');

                    if (!isMounted) return;

                    if (!variantError && variantData && variantData.length > 0) {
                        setVariants(variantData);

                        // Extract unique option values
                        const uniqueOpt1 = [...new Set(variantData.map(v => v.option1).filter(Boolean))];
                        const uniqueOpt2 = [...new Set(variantData.map(v => v.option2).filter(Boolean))];

                        setOption1Values(uniqueOpt1);
                        setOption2Values(uniqueOpt2);

                        // Set initial selections
                        if (uniqueOpt1.length > 0) {
                            setSelectedOption1(uniqueOpt1[0]);
                        }
                        if (uniqueOpt2.length > 0) {
                            setSelectedOption2(uniqueOpt2[0]);
                        }

                        // Select first variant by default
                        setSelectedVariant(variantData[0]);
                    }
                }
            } catch (error) {
                if (isMounted) {
                    console.error('Error fetching product:', error);
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        fetchProductData();

        return () => {
            isMounted = false;
        };
    }, [slug]);

    // Animation effect
    useEffect(() => {
        if (!loading && product) {
            const ctx = gsap.context(() => {
                gsap.from(".product-image", {
                    opacity: 0,
                    x: -50,
                    duration: 1,
                    ease: "power3.out"
                });

                gsap.from(".product-info", {
                    opacity: 0,
                    x: 50,
                    duration: 1,
                    ease: "power3.out"
                });
            }, containerRef);

            return () => ctx.revert();
        }
    }, [loading, product]);

    const getFrequencyLabel = (freq: string) => {
        const labels: { [key: string]: string } = {
            'every-2-weeks': 'Every 2 weeks',
            'monthly': 'Every month',
            'every-3-months': 'Every 3 months'
        };
        return labels[freq] || freq;
    };

    const getCurrentPrice = () => {
        let basePrice = 0;

        if (selectedVariant && selectedVariant.price) {
            basePrice = selectedVariant.price;
        } else if (product?.price) {
            basePrice = product.price;
        } else {
            return 'Contact for pricing';
        }

        // Apply subscription discount if enabled
        if (isSubscription && product?.subscription_available && product?.subscription_discount_percent) {
            const discountAmount = basePrice * (product.subscription_discount_percent / 100);
            basePrice = basePrice - discountAmount;
        }

        // Apply coupon discount
        if (couponDiscount > 0) {
            basePrice = Math.max(0, basePrice - couponDiscount);
        }

        return `$${basePrice.toFixed(2)}`;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center pt-32">
                <div className="text-white/60 font-urbanist">Loading product...</div>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center pt-32">
                <div className="text-white/60 font-urbanist">Product not found</div>
            </div>
        );
    }

    return (
        <>
            <SEOHead
                title={product.title}
                description={product.short_description || product.description?.substring(0, 160) || `Shop ${product.title} - Natural herbal product from Nefer Kali Healing`}
                keywords={[product.title, product.category || 'herbal product', 'natural remedy', 'holistic healing', 'herbal tincture']}
                url={`/offerings/${slug}`}
                image={product.featured_image_url}
                type="product"
                product={{
                    price: selectedVariant?.price || product.price,
                    currency: 'USD',
                    availability: product.is_sold_out ? 'outofstock' : 'instock'
                }}
                schema={[
                    getProductSchema({
                        name: product.title,
                        slug: slug || '',
                        description: product.short_description || product.description || '',
                        price: selectedVariant?.price || product.price || 0,
                        image: product.featured_image_url,
                        inStock: !product.is_sold_out,
                        rating: 5,
                        reviewCount: reviewCount
                    }),
                    getBreadcrumbSchema([
                        { name: 'Home', url: '/' },
                        { name: 'Natural Wellness Store', url: '/offerings' },
                        { name: product.title, url: `/offerings/${slug}` }
                    ])
                ]}
            />
            <div ref={containerRef} className="min-h-screen bg-[#0a0a0a] pt-32 pb-24">
                <div className="max-w-7xl mx-auto px-8">
                    {/* Product Navigation */}
                    {(prevProduct || nextProduct) && (
                        <div className="flex items-center justify-start gap-1 mb-8 font-urbanist">
                            <button
                                onClick={() => {
                                    if (prevProduct) {
                                        navigate(`/offerings/${prevProduct.slug}`);
                                        window.scrollTo(0, 0);
                                    }
                                }}
                                disabled={!prevProduct}
                                className={`flex items-center gap-1 px-3 py-2 text-sm transition-colors ${prevProduct
                                    ? 'text-white/70 hover:text-[#D4AF37] cursor-pointer'
                                    : 'text-white/20 cursor-not-allowed'
                                    }`}
                            >
                                <ChevronLeft size={16} />
                                <span>Previous</span>
                            </button>
                            <span className="text-white/30">|</span>
                            <button
                                onClick={() => {
                                    if (nextProduct) {
                                        navigate(`/offerings/${nextProduct.slug}`);
                                        window.scrollTo(0, 0);
                                    }
                                }}
                                disabled={!nextProduct}
                                className={`flex items-center gap-1 px-3 py-2 text-sm transition-colors ${nextProduct
                                    ? 'text-white/70 hover:text-[#D4AF37] cursor-pointer'
                                    : 'text-white/20 cursor-not-allowed'
                                    }`}
                            >
                                <span>Next</span>
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
                        {/* Product Image */}
                        <div className="product-image">
                            <div className="aspect-square rounded-2xl overflow-hidden bg-[#121212] shadow-2xl">
                                <img
                                    src={product.featured_image_url || '/assets/blood_bush_tea.png'}
                                    alt={product.title}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        </div>

                        {/* Product Info */}
                        <div className="product-info">
                            {/* Category */}
                            <div className="text-[#D4AF37] text-xs uppercase tracking-[0.3em] mb-4 font-urbanist">
                                {product.category}
                            </div>

                            {/* Title */}
                            <h1 className="text-3xl md:text-5xl font-display text-white mb-6">
                                {product.title}
                            </h1>

                            {/* Rating */}
                            <div className="flex items-center gap-1 mb-6">
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <Star
                                        key={i}
                                        size={16}
                                        fill="#D4AF37"
                                        className="text-[#D4AF37]"
                                    />
                                ))}
                                <span className="text-sm text-white/30 ml-2 font-urbanist">({reviewCount} {reviewCount === 1 ? 'review' : 'reviews'})</span>
                            </div>

                            {/* Price */}
                            <div className="text-4xl font-medium text-[#D4AF37] mb-8">
                                {getCurrentPrice()}
                            </div>

                            {/* Description */}
                            {product.short_description && (
                                <p className="text-white/60 font-light leading-relaxed mb-8 font-urbanist">
                                    {product.short_description}
                                </p>
                            )}

                            {/* Variants - Dropdown Style */}
                            {product.has_variants && variants.length > 0 && (
                                <div className="mb-8 space-y-4">
                                    {/* Option 1 Dropdown (Size/Weight) */}
                                    {option1Values.length > 0 && (
                                        <div>
                                            <label className="block text-sm text-white/60 mb-2 font-urbanist">
                                                Weight: {selectedOption1}
                                            </label>
                                            <select
                                                value={selectedOption1}
                                                onChange={(e) => {
                                                    const newOpt1 = e.target.value;
                                                    setSelectedOption1(newOpt1);
                                                    // Find matching variant
                                                    const match = variants.find(v =>
                                                        v.option1 === newOpt1 &&
                                                        (option2Values.length === 0 || v.option2 === selectedOption2)
                                                    );
                                                    if (match) setSelectedVariant(match);
                                                }}
                                                className="w-full bg-[#121212] border-2 border-white/20 rounded-lg px-4 py-3 text-white focus:border-[#D4AF37] focus:outline-none font-urbanist transition-all appearance-none cursor-pointer"
                                                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='rgba(255,255,255,0.5)' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' }}
                                            >
                                                {option1Values.map((opt) => (
                                                    <option key={opt} value={opt}>{opt}</option>
                                                ))}
                                            </select>
                                        </div>
                                    )}

                                    {/* Option 2 Dropdown (Base) - Only show if there are option2 values */}
                                    {option2Values.length > 0 && (
                                        <div>
                                            <label className="block text-sm text-white/60 mb-2 font-urbanist">
                                                Base: {selectedOption2}
                                            </label>
                                            <select
                                                value={selectedOption2}
                                                onChange={(e) => {
                                                    const newOpt2 = e.target.value;
                                                    setSelectedOption2(newOpt2);
                                                    // Find matching variant
                                                    const match = variants.find(v =>
                                                        v.option1 === selectedOption1 && v.option2 === newOpt2
                                                    );
                                                    if (match) setSelectedVariant(match);
                                                }}
                                                className="w-full bg-[#121212] border-2 border-white/20 rounded-lg px-4 py-3 text-white focus:border-[#D4AF37] focus:outline-none font-urbanist transition-all appearance-none cursor-pointer"
                                                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='rgba(255,255,255,0.5)' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' }}
                                            >
                                                {option2Values.map((opt) => (
                                                    <option key={opt} value={opt}>{opt}</option>
                                                ))}
                                            </select>
                                        </div>
                                    )}

                                    {/* Inventory Status */}
                                    {selectedVariant && (
                                        <p className="text-sm text-white/40 font-urbanist">
                                            {selectedVariant.inventory_quantity > 0
                                                ? `${selectedVariant.inventory_quantity} in stock`
                                                : 'Out of stock'}
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* Subscription Options */}
                            {product.subscription_available && (
                                <div className="mb-8">
                                    <label className="flex items-center gap-3 text-sm text-white/80 mb-4 font-urbanist cursor-pointer group">
                                        <input
                                            type="checkbox"
                                            checked={isSubscription}
                                            onChange={(e) => {
                                                setIsSubscription(e.target.checked);
                                                // Reset to first available frequency if enabling subscription
                                                if (e.target.checked && product.subscription_frequency_options?.length > 0) {
                                                    setSubscriptionFrequency(product.subscription_frequency_options[0]);
                                                }
                                            }}
                                            className="rounded border-white/20 bg-white/5 text-[#D4AF37] focus:ring-[#D4AF37] focus:ring-offset-0 w-5 h-5 transition-all"
                                        />
                                        <span className="group-hover:text-[#D4AF37] transition-colors">
                                            Subscribe for Monthly Support
                                            {product.subscription_discount_percent > 0 && (
                                                <span className="ml-2 text-[#D4AF37] font-medium">
                                                    (Save {product.subscription_discount_percent}%)
                                                </span>
                                            )}
                                        </span>
                                    </label>

                                    {isSubscription && product.subscription_frequency_options && product.subscription_frequency_options.length > 0 && (
                                        <div className="ml-8 mt-4">
                                            <label className="block text-xs text-white/60 uppercase tracking-wider mb-3 font-urbanist">
                                                Delivery Frequency
                                            </label>
                                            <select
                                                value={subscriptionFrequency}
                                                onChange={(e) => setSubscriptionFrequency(e.target.value)}
                                                className="w-full bg-white/5 border-2 border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:border-[#D4AF37] focus:outline-none font-urbanist transition-all"
                                            >
                                                {product.subscription_frequency_options.map((freq) => (
                                                    <option key={freq} value={freq}>
                                                        {getFrequencyLabel(freq)}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Coupon Input */}
                            <div className="mb-8">
                                <CouponInput
                                    orderTotal={product.price || 0}
                                    productIds={[product.id]}
                                    onCouponApplied={(discountAmount) => setCouponDiscount(discountAmount)}
                                    onCouponRemoved={() => setCouponDiscount(0)}
                                />
                            </div>

                            {/* Quantity Selector */}
                            <div className="mb-8">
                                <label className="block text-sm text-white/60 mb-3 font-urbanist">Quantity</label>
                                <div className="flex items-center gap-4">
                                    <button
                                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                        className="w-12 h-12 rounded-full border-2 border-white/20 flex items-center justify-center text-white hover:border-[#D4AF37] hover:text-[#D4AF37] transition-colors"
                                    >
                                        <Minus size={18} />
                                    </button>
                                    <span className="text-2xl font-medium text-white w-12 text-center font-urbanist">{quantity}</span>
                                    <button
                                        onClick={() => setQuantity(quantity + 1)}
                                        className="w-12 h-12 rounded-full border-2 border-white/20 flex items-center justify-center text-white hover:border-[#D4AF37] hover:text-[#D4AF37] transition-colors"
                                    >
                                        <Plus size={18} />
                                    </button>
                                </div>
                            </div>

                            {/* Add to Cart Button */}
                            {product?.is_sold_out || (selectedVariant && selectedVariant.inventory_quantity === 0) ? (
                                <div className="w-full py-4 bg-gray-700 text-white font-bold text-sm uppercase tracking-[0.2em] rounded-full text-center font-urbanist">
                                    Sold Out
                                </div>
                            ) : (
                                <button
                                    onClick={handleAddToCart}
                                    className="w-full py-4 bg-gradient-to-r from-[#D4AF37] to-[#8B7322] text-black font-bold text-sm uppercase tracking-[0.2em] rounded-full hover:shadow-2xl hover:shadow-[#D4AF37]/20 transition-all duration-300 flex items-center justify-center gap-3 font-urbanist"
                                >
                                    <ShoppingBag size={20} />
                                    {isSubscription ? 'Subscribe & Support' : 'Add to Cart'}
                                </button>
                            )}

                            {/* Additional Info Tabs */}
                            <div className="mt-12 space-y-4">
                                {product.ingredients && (
                                    <details className="group">
                                        <summary className="cursor-pointer py-4 border-b border-white/10 text-white font-medium font-urbanist hover:text-[#D4AF37] transition-colors">
                                            Ingredients
                                        </summary>
                                        <div
                                            className="py-4 text-white/60 text-sm leading-relaxed font-urbanist prose prose-invert max-w-none"
                                            dangerouslySetInnerHTML={{ __html: product.ingredients }}
                                        />
                                    </details>
                                )}

                                {product.usage_instructions && (
                                    <details className="group">
                                        <summary className="cursor-pointer py-4 border-b border-white/10 text-white font-medium font-urbanist hover:text-[#D4AF37] transition-colors">
                                            How to Use
                                        </summary>
                                        <div
                                            className="py-4 text-white/60 text-sm leading-relaxed font-urbanist prose prose-invert max-w-none"
                                            dangerouslySetInnerHTML={{ __html: product.usage_instructions }}
                                        />
                                    </details>
                                )}

                                {product.benefits && (
                                    <details className="group">
                                        <summary className="cursor-pointer py-4 border-b border-white/10 text-white font-medium font-urbanist hover:text-[#D4AF37] transition-colors">
                                            Benefits
                                        </summary>
                                        <div
                                            className="py-4 text-white/60 text-sm leading-relaxed font-urbanist prose prose-invert max-w-none"
                                            dangerouslySetInnerHTML={{ __html: product.benefits }}
                                        />
                                    </details>
                                )}

                                {product.warnings && (
                                    <details className="group">
                                        <summary className="cursor-pointer py-4 border-b border-white/10 text-white font-medium font-urbanist hover:text-[#D4AF37] transition-colors">
                                            Warnings & Precautions
                                        </summary>
                                        <div
                                            className="py-4 text-white/60 text-sm leading-relaxed font-urbanist prose prose-invert max-w-none"
                                            dangerouslySetInnerHTML={{ __html: product.warnings }}
                                        />
                                    </details>
                                )}

                                {product.return_policy && (
                                    <details className="group">
                                        <summary className="cursor-pointer py-4 border-b border-white/10 text-white font-medium font-urbanist hover:text-[#D4AF37] transition-colors">
                                            Return Policy
                                        </summary>
                                        <div
                                            className="py-4 text-white/60 text-sm leading-relaxed font-urbanist prose prose-invert max-w-none"
                                            dangerouslySetInnerHTML={{ __html: product.return_policy }}
                                        />
                                    </details>
                                )}

                                {product.shipping_info && (
                                    <details className="group">
                                        <summary className="cursor-pointer py-4 border-b border-white/10 text-white font-medium font-urbanist hover:text-[#D4AF37] transition-colors">
                                            Shipping Information
                                        </summary>
                                        <div
                                            className="py-4 text-white/60 text-sm leading-relaxed font-urbanist prose prose-invert max-w-none"
                                            dangerouslySetInnerHTML={{ __html: product.shipping_info }}
                                        />
                                    </details>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Reviews Section - Full Width */}
                    {product && (
                        <div className="mt-24">
                            <ReviewDisplay productId={product.id} mode="product" textColor="cream" />
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default ProductDetail;
