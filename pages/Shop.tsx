
import React, { useLayoutEffect, useEffect, useRef, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { PRODUCTS } from '../constants';
import { Star, Filter, ChevronDown, ShoppingBag, Plus } from 'lucide-react';
import Testimonials from '../components/Testimonials';
import ReviewForm from '../components/ReviewForm';
import { useCart } from '../components/cart';
import VacationBanner from '../components/VacationBanner';


const Shop: React.FC = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const filterRef = useRef<HTMLDivElement>(null);
    const [filterOpen, setFilterOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState('');
    const [priceSort, setPriceSort] = useState<'none' | 'low-high' | 'high-low'>('none');

    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const { addItem } = useCart();

    // Close filter dropdown when clicking outside
    useLayoutEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
                setFilterOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        const abortController = new AbortController();

        const fetchProducts = async () => {
            try {
                // Fetch active, published products from Supabase
                const { supabase } = await import('../lib/supabase');
                const { data, error } = await supabase
                    .from('products')
                    .select('*')
                    .eq('status', 'active')
                    .eq('published', true);

                if (abortController.signal.aborted) return;

                if (error) {
                    console.error('Error fetching products:', error);
                    // Fallback to static data if DB fails
                    setProducts(PRODUCTS.filter(p => p.type === 'Product'));
                } else if (data && data.length > 0) {
                    // Fetch review counts for all products
                    const productIds = data.map(p => p.id);
                    const { data: reviewsData } = await supabase
                        .from('reviews')
                        .select('product_id')
                        .in('product_id', productIds)
                        .eq('status', 'approved');

                    if (abortController.signal.aborted) return;

                    // Count reviews per product
                    const reviewCounts: { [key: string]: number } = {};
                    reviewsData?.forEach(r => {
                        reviewCounts[r.product_id] = (reviewCounts[r.product_id] || 0) + 1;
                    });

                    const mappedProducts = data.map(p => ({
                        id: p.id,
                        title: p.title,
                        slug: p.slug,
                        type: 'Product',
                        category: p.category || '',
                        description: p.short_description || p.description || '',
                        price: p.price ? `$${p.price.toFixed(2)}` : 'Contact for pricing',
                        numericPrice: p.price || 0,
                        image: p.featured_image_url || '/assets/blood_bush_tea.png',
                        rating: 5, // Default rating until we have reviews system
                        reviews: reviewCounts[p.id] || 0,
                        inventory: p.inventory_quantity ?? 999,
                        soldOut: p.is_sold_out === true || p.inventory_quantity === 0
                    }));
                    setProducts(mappedProducts);
                } else {
                    // No products in DB, show empty state or fallback
                    console.log('No active products found in database');
                    setProducts([]);
                }
            } catch (err) {
                if (!abortController.signal.aborted) {
                    console.error('Exception fetching products:', err);
                    setProducts(PRODUCTS.filter(p => p.type === 'Product'));
                }
            } finally {
                if (!abortController.signal.aborted) {
                    setLoading(false);
                }
            }
        };

        fetchProducts();

        return () => {
            abortController.abort();
        };
    }, []);

    // Filter and sort products
    const filteredProducts = useMemo(() => {
        let result = [...products];

        // Filter by category
        if (selectedCategory) {
            result = result.filter(p => p.category === selectedCategory);
        }

        // Sort by price
        if (priceSort === 'low-high') {
            result.sort((a, b) => a.numericPrice - b.numericPrice);
        } else if (priceSort === 'high-low') {
            result.sort((a, b) => b.numericPrice - a.numericPrice);
        }

        return result;
    }, [products, selectedCategory, priceSort]);

    useLayoutEffect(() => {
        if (loading) return;

        const ctx = gsap.context(() => {
            gsap.from(".product-card", {
                y: 40,
                opacity: 0,
                stagger: 0.1,
                duration: 0.8,
                ease: "power2.out",
                delay: 0.2
            });

            gsap.from(".shop-header", {
                y: -20,
                opacity: 0,
                duration: 1,
                ease: "power3.out"
            });
        }, containerRef);
        return () => ctx.revert();
    }, [loading]);

    const handlePriceSort = (sort: 'none' | 'low-high' | 'high-low') => {
        setPriceSort(sort);
        setFilterOpen(false);
    };

    const handleQuickAdd = (e: React.MouseEvent, product: any) => {
        e.preventDefault(); // Prevent navigation to product page
        e.stopPropagation();

        if (product.soldOut) return;

        addItem({
            productId: product.id,
            title: product.title,
            price: product.numericPrice,
            quantity: 1,
            image: product.image,
            maxQuantity: product.inventory || 99,
            isSubscription: false,
        });
    };

    return (
        <>
            <VacationBanner />
            <div ref={containerRef} className="min-h-screen bg-[#0a0a0a] pt-32">
                {/* Shop Header */}
                <div className="max-w-7xl mx-auto mb-16 shop-header px-8 relative z-50">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-white/10 pb-12">
                        <div>
                            <h1 className="text-4xl md:text-6xl font-display mb-4">Divine Offerings</h1>
                            <p className="text-white/40 max-w-2xl text-sm tracking-widest uppercase font-light leading-relaxed">
                                Sacred botanical remedies. Your contributions directly support
                                our non-profit mission to preserve indigenous healing wisdom and serve our community.
                                Sourced with reverence, offered with love.
                            </p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 relative z-[100] w-full sm:w-auto">
                            {/* Filter Dropdown */}
                            <div className="relative z-[100]" ref={filterRef}>
                                <button
                                    onClick={() => setFilterOpen(!filterOpen)}
                                    className={`flex items-center gap-2 px-6 py-3 border rounded-full text-[10px] uppercase tracking-widest transition-colors ${priceSort !== 'none'
                                        ? 'border-[#D4AF37] text-[#D4AF37]'
                                        : 'border-white/10 hover:border-[#D4AF37]'
                                        }`}
                                >
                                    <Filter size={12} />
                                    {priceSort === 'low-high' ? 'Price: Low → High' : priceSort === 'high-low' ? 'Price: High → Low' : 'Filter'}
                                    <ChevronDown size={12} className={`transition-transform ${filterOpen ? 'rotate-180' : ''}`} />
                                </button>

                                {/* Filter Dropdown Menu */}
                                {filterOpen && (
                                    <div className="absolute top-full left-0 mt-2 w-48 bg-[#1a1a1a] border border-white/10 rounded-xl overflow-hidden shadow-2xl z-[100]">
                                        <div className="p-2">
                                            <p className="text-[9px] uppercase tracking-widest text-white/40 px-3 py-2">Sort by Price</p>
                                            <button
                                                onClick={() => handlePriceSort('none')}
                                                className={`w-full text-left px-3 py-2 text-xs rounded-lg transition-colors ${priceSort === 'none' ? 'bg-[#D4AF37]/20 text-[#D4AF37]' : 'text-white/70 hover:bg-white/5'
                                                    }`}
                                            >
                                                Default
                                            </button>
                                            <button
                                                onClick={() => handlePriceSort('low-high')}
                                                className={`w-full text-left px-3 py-2 text-xs rounded-lg transition-colors ${priceSort === 'low-high' ? 'bg-[#D4AF37]/20 text-[#D4AF37]' : 'text-white/70 hover:bg-white/5'
                                                    }`}
                                            >
                                                Price: Low to High
                                            </button>
                                            <button
                                                onClick={() => handlePriceSort('high-low')}
                                                className={`w-full text-left px-3 py-2 text-xs rounded-lg transition-colors ${priceSort === 'high-low' ? 'bg-[#D4AF37]/20 text-[#D4AF37]' : 'text-white/70 hover:bg-white/5'
                                                    }`}
                                            >
                                                Price: High to Low
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Categories Dropdown */}
                            <select
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                                className="bg-[#1a1a1a] text-white border border-white/10 rounded-full px-6 py-3 text-[10px] uppercase tracking-widest hover:border-[#D4AF37] transition-colors cursor-pointer"
                                style={{
                                    colorScheme: 'dark'
                                }}
                            >
                                <option value="">All Categories</option>
                                <option value="Capsulated Botanics & Herbs">Capsulated Botanics & Herbs</option>
                                <option value="Extracts">Extracts</option>
                                <option value="Sea Moss">Sea Moss</option>
                                <option value="Spiritual Wellness">Spiritual Wellness</option>
                                <option value="Women's Wellness">Women's Wellness</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Product Grid */}
                <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-16 px-8 pb-24">
                    {filteredProducts.length === 0 && !loading && (
                        <div className="col-span-full text-center py-16">
                            <p className="text-white/40 text-lg">No products found in this category.</p>
                        </div>
                    )}
                    {filteredProducts.map((product) => (
                        <Link
                            key={product.id}
                            to={`/offerings/${product.slug}`}
                            className="product-card group flex flex-col h-full cursor-pointer"
                        >
                            {/* Image Container */}
                            <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-[#121212] mb-6 shadow-2xl">
                                <img
                                    src={product.image}
                                    alt={product.title}
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                />
                                {/* Badge */}
                                {product.soldOut ? (
                                    <div className="absolute top-4 left-4 bg-red-600 text-white text-[8px] uppercase tracking-[0.2em] px-3 py-1 rounded-full font-bold">
                                        Sold Out
                                    </div>
                                ) : (
                                    <div className="absolute top-4 left-4 bg-[#8B7322] text-white text-[8px] uppercase tracking-[0.2em] px-3 py-1 rounded-full font-bold">
                                        Handcrafted
                                    </div>
                                )}

                                {/* Overlay CTA */}
                                {!product.soldOut && (
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                                        <button
                                            onClick={(e) => handleQuickAdd(e, product)}
                                            className="px-8 py-3 bg-[#D4AF37] text-black font-bold text-[10px] uppercase tracking-[0.2em] rounded-full transform translate-y-4 group-hover:translate-y-0 transition-all duration-500 flex items-center gap-2"
                                        >
                                            <Plus size={14} />
                                            Quick Add
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Product Info */}
                            <div className="flex flex-col flex-grow">
                                <div className="flex items-center gap-1 mb-2">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                        <Star
                                            key={i}
                                            size={10}
                                            fill={i < Math.floor(product.rating || 5) ? "#D4AF37" : "transparent"}
                                            className={i < Math.floor(product.rating || 5) ? "text-[#D4AF37]" : "text-white/20"}
                                        />
                                    ))}
                                    <span className="text-[9px] text-white/30 ml-1">({product.reviews})</span>
                                </div>
                                <h3 className="text-xl font-display mb-2 group-hover:text-[#D4AF37] transition-colors">
                                    {product.title}
                                </h3>
                                <p className="text-sm text-white/40 font-light mb-4 line-clamp-2">
                                    {product.description}
                                </p>
                                <div className="mt-auto flex items-center justify-between">
                                    <span className="text-lg font-medium text-[#D4AF37]">{product.price}</span>
                                    <button className="flex items-center gap-2 text-[9px] uppercase tracking-widest text-white/60 hover:text-white transition-colors">
                                        <ShoppingBag size={14} /> Get this product
                                    </button>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>

                <Testimonials />
                <ReviewForm />
            </div>
        </>
    );
};

export default Shop;
