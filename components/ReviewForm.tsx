import React, { useState, useRef, useLayoutEffect } from 'react';
import { Star, Send, ChevronDown } from 'lucide-react';
import { PRODUCTS } from '../constants';
import gsap from 'gsap';
import { api } from '../lib/api';

const ReviewForm: React.FC = () => {
    const formRef = useRef<HTMLDivElement>(null);
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        product: '',
        review: ''
    });

    useLayoutEffect(() => {
        const ctx = gsap.context(() => {
            gsap.from(formRef.current, {
                y: 50,
                opacity: 0,
                duration: 1,
                scrollTrigger: {
                    trigger: formRef.current,
                    start: "top bottom-=100",
                    toggleActions: "play none none reverse"
                }
            });
        });
        return () => ctx.revert();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            await api.reviews.submit({
                reviewer_name: formData.name,
                product_id: formData.product,
                rating: rating,
                comment: formData.review
            });

            setIsSubmitting(false);
            setIsSuccess(true);

            // Reset after showing success message
            setTimeout(() => {
                setIsSuccess(false);
                setFormData({ name: '', email: '', product: '', review: '' });
                setRating(0);
            }, 3000);
        } catch (error) {
            console.error('Error submitting review:', error);
            setIsSubmitting(false);
            alert('Something went wrong. Please try again.');
        }
    };

    return (
        <section className="py-24 px-8 relative overflow-hidden">
            {/* Background Decorations */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0a0a0a] to-[#0a0a0a] pointer-events-none" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#D4AF37]/5 blur-[120px] rounded-full pointer-events-none" />

            <div ref={formRef} className="max-w-3xl mx-auto relative z-10">
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 md:p-12 overflow-hidden shadow-2xl">
                    {!isSuccess ? (
                        <>
                            <div className="text-center mb-10">
                                <h3 className="text-3xl font-display mb-4">Share Your Experience</h3>
                                <p className="text-white/40 text-sm tracking-widest uppercase font-light">
                                    Your words help our community grow and heal.
                                </p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-8">
                                {/* Rating Selection */}
                                <div className="flex flex-col items-center gap-4">
                                    <label className="text-xs uppercase tracking-[0.2em] text-[#D4AF37]">Rate your experience</label>
                                    <div className="flex gap-2">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <button
                                                key={star}
                                                type="button"
                                                onClick={() => setRating(star)}
                                                onMouseEnter={() => setHoverRating(star)}
                                                onMouseLeave={() => setHoverRating(0)}
                                                className="transition-transform hover:scale-110 focus:outline-none"
                                            >
                                                <Star
                                                    size={32}
                                                    weight="fill"
                                                    className={`${star <= (hoverRating || rating)
                                                        ? "fill-[#D4AF37] text-[#D4AF37]"
                                                        : "fill-transparent text-white/20"
                                                        } transition-colors duration-200`}
                                                />
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Name Input */}
                                    <div className="space-y-2">
                                        <label className="text-xs uppercase tracking-widest text-white/40 ml-4">Name</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full bg-white/5 border border-white/10 rounded-full px-6 py-4 text-white placeholder:text-white/20 focus:outline-none focus:border-[#D4AF37] transition-colors"
                                            placeholder="Your Name"
                                        />
                                    </div>

                                    {/* Email Input */}
                                    <div className="space-y-2">
                                        <label className="text-xs uppercase tracking-widest text-white/40 ml-4">Email</label>
                                        <input
                                            type="email"
                                            required
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            className="w-full bg-white/5 border border-white/10 rounded-full px-6 py-4 text-white placeholder:text-white/20 focus:outline-none focus:border-[#D4AF37] transition-colors"
                                            placeholder="your@email.com"
                                        />
                                    </div>
                                </div>

                                {/* Product Selection */}
                                <div className="space-y-2 relative">
                                    <label className="text-xs uppercase tracking-widest text-white/40 ml-4">Select Product</label>
                                    <div className="relative">
                                        <select
                                            value={formData.product}
                                            onChange={(e) => setFormData({ ...formData, product: e.target.value })}
                                            className="w-full bg-white/5 border border-white/10 rounded-full px-6 py-4 text-white appearance-none focus:outline-none focus:border-[#D4AF37] transition-colors cursor-pointer"
                                        >
                                            <option value="" className="bg-[#1a1a1a]">Select a product...</option>
                                            {PRODUCTS.filter(p => p.type === 'Product').map(p => (
                                                <option key={p.id} value={p.title} className="bg-[#1a1a1a]">
                                                    {p.title}
                                                </option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none" size={16} />
                                    </div>
                                </div>

                                {/* Review Text */}
                                <div className="space-y-2">
                                    <label className="text-xs uppercase tracking-widest text-white/40 ml-4">Your Review</label>
                                    <textarea
                                        required
                                        value={formData.review}
                                        onChange={(e) => setFormData({ ...formData, review: e.target.value })}
                                        rows={4}
                                        className="w-full bg-white/5 border border-white/10 rounded-3xl px-6 py-4 text-white placeholder:text-white/20 focus:outline-none focus:border-[#D4AF37] transition-colors resize-none"
                                        placeholder="Tell us about your healing journey..."
                                    />
                                </div>

                                {/* Submit Button */}
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full bg-[#D4AF37] text-black font-display text-lg uppercase tracking-widest py-4 rounded-full hover:bg-[#F4CF57] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
                                >
                                    {isSubmitting ? (
                                        <span className="animate-pulse">Submitting...</span>
                                    ) : (
                                        <>
                                            Submit Review
                                            <Send size={18} className="group-hover:translate-x-1 transition-transform" />
                                        </>
                                    )}
                                </button>
                            </form>
                        </>
                    ) : (
                        <div className="py-20 text-center space-y-6 animate-fade-in">
                            <div className="w-20 h-20 bg-[#D4AF37]/20 rounded-full flex items-center justify-center mx-auto text-[#D4AF37]">
                                <Star size={40} fill="#D4AF37" />
                            </div>
                            <div>
                                <h3 className="text-3xl font-display mb-2">Thank You!</h3>
                                <p className="text-white/60 max-w-md mx-auto">
                                    Your review has been submitted successfully. We appreciate you sharing your journey with our community.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
};

export default ReviewForm;
