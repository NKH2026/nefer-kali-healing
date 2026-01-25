import React, { useEffect, useRef, useState, useLayoutEffect } from 'react';
import { Star, Quote } from 'lucide-react';
import gsap from 'gsap';
import { supabase } from '../lib/supabase';

interface TestimonialItem {
    id: string;
    name: string;
    location: string;
    rating: number;
    text: string;
    productName: string;
    date: string;
    verified: boolean;
}

const Testimonials: React.FC = () => {
    const scrollerRef = useRef<HTMLDivElement>(null);
    const [reviews, setReviews] = useState<TestimonialItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const abortController = new AbortController();

        const fetchReviews = async () => {
            try {
                // Fetch approved reviews from supabase directly
                const { data, error } = await supabase
                    .from('reviews')
                    .select('*, products(title)')
                    .eq('status', 'approved')
                    .order('reviewed_at', { ascending: false })
                    .limit(20);

                if (abortController.signal.aborted) return;

                if (error) throw error;

                if (data && data.length > 0) {
                    const formattedReviews = data.map(r => ({
                        id: r.id,
                        name: r.customer_name,
                        location: 'Community Member',
                        rating: r.rating,
                        text: r.review_text,
                        productName: r.products?.title || 'General Testimonial',
                        date: new Date(r.reviewed_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        }),
                        verified: r.is_verified_buyer
                    }));
                    setReviews(formattedReviews);
                }
            } catch (error) {
                if (!abortController.signal.aborted) {
                    console.error("Failed to load reviews:", error);
                }
            } finally {
                if (!abortController.signal.aborted) {
                    setLoading(false);
                }
            }
        };

        fetchReviews();

        return () => {
            abortController.abort();
        };
    }, []);

    useLayoutEffect(() => {
        const ctx = gsap.context(() => {
            if (scrollerRef.current && reviews.length > 0) {
                const contentWidth = scrollerRef.current.scrollWidth / 2; // Since we double the content
                gsap.to(scrollerRef.current, {
                    x: -contentWidth,
                    duration: 60, // Slower for better readability
                    ease: "none",
                    repeat: -1
                });
            }
        }, scrollerRef);
        return () => ctx.revert();
    }, [reviews]); // Re-run animation when reviews change

    // Don't show the section if loading or no reviews
    if (loading || reviews.length === 0) {
        return null;
    }

    // Use static layout for few reviews, marquee for many
    const useMarquee = reviews.length > 4;
    const displayItems = useMarquee ? [...reviews, ...reviews] : reviews;

    return (
        <div className="py-24 overflow-hidden relative border-t border-white/10">
            {/* Background Elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-[#D4AF37]/5 blur-[120px] rounded-full" />
            </div>

            <div className="max-w-7xl mx-auto px-8 mb-16 relative z-10">
                <div className="flex flex-col items-center text-center">
                    <h2 className="text-4xl md:text-5xl font-display mb-6">Voices of the Community</h2>
                    <div className="w-24 h-[1px] bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent mb-6" />
                    <p className="text-white/40 max-w-2xl text-sm tracking-widest uppercase font-light leading-relaxed">
                        Sacred experiences shared by our tribe. Real stories of healing, connection, and transformation.
                    </p>
                </div>
            </div>

            {/* Reviews Container - Static Grid or Marquee */}
            {useMarquee ? (
                // Marquee for many reviews
                <div className="relative w-full overflow-hidden">
                    <div ref={scrollerRef} className="flex gap-8 w-max px-4">
                        {displayItems.map((testimonial, idx) => (
                            <TestimonialCard key={`${testimonial.id}-${idx}`} testimonial={testimonial} />
                        ))}
                    </div>
                </div>
            ) : (
                // Static centered grid for few reviews
                <div className="max-w-7xl mx-auto px-8">
                    <div className="flex flex-wrap justify-center gap-8">
                        {displayItems.map((testimonial, idx) => (
                            <TestimonialCard key={`${testimonial.id}-${idx}`} testimonial={testimonial} />
                        ))}
                    </div>
                </div>
            )}

            {/* Fade Edges - only for marquee */}
            {useMarquee && (
                <>
                    <div className="absolute top-0 left-0 w-32 h-full bg-gradient-to-r from-[#0a0a0a] to-transparent z-20 pointer-events-none" />
                    <div className="absolute top-0 right-0 w-32 h-full bg-gradient-to-l from-[#0a0a0a] to-transparent z-20 pointer-events-none" />
                </>
            )}
        </div>
    );
};

// Extracted testimonial card component
const TestimonialCard = ({ testimonial }: { testimonial: TestimonialItem }) => (
    <div
        className="w-[290px] sm:w-[350px] md:w-[400px] p-6 sm:p-8 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm hover:border-[#D4AF37]/50 transition-all duration-300 group hover:-translate-y-2 hover:shadow-[0_0_30px_-5px_rgba(212,175,55,0.1)]"
    >
        <div className="flex justify-between items-start mb-6">
            <div className="flex gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                        key={i}
                        size={12}
                        fill={i < testimonial.rating ? "#D4AF37" : "transparent"}
                        className={i < testimonial.rating ? "text-[#D4AF37]" : "text-white/20"}
                    />
                ))}
            </div>
            <Quote size={20} className="text-[#D4AF37]/20 group-hover:text-[#D4AF37] transition-colors" />
        </div>

        <p className="text-lg font-light text-white/90 mb-6 italic leading-relaxed min-h-[80px]">
            "{testimonial.text}"
        </p>

        <div className="flex items-center gap-4 pt-6 border-t border-white/5">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#8B7322] flex items-center justify-center text-black font-bold text-lg">
                {testimonial.name.charAt(0)}
            </div>
            <div>
                <div className="flex items-center gap-2">
                    <h4 className="font-display text-[#D4AF37] text-sm tracking-wide">
                        {testimonial.name}
                    </h4>
                    {testimonial.verified && (
                        <span className="text-[9px] bg-white/10 px-2 py-0.5 rounded-full text-white/60">Verified</span>
                    )}
                </div>
                <p className="text-[10px] text-white/40 uppercase tracking-widest mt-1">
                    {testimonial.productName}
                </p>
            </div>
        </div>
    </div>
);

export default Testimonials;

