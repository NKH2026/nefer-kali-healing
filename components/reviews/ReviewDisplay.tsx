import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Star, Image as ImageIcon, X, Upload, ChevronDown } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface ReviewMedia {
    id: string;
    media_url: string;
}

interface Review {
    id: string;
    customer_name: string;
    rating: number;
    title: string | null;
    review_text: string;
    is_verified_buyer: boolean;
    reviewed_at: string;
    photos: ReviewMedia[];
}

interface ReviewDisplayProps {
    productId?: string;
    mode: 'product' | 'general';
    textColor?: 'cream' | 'white' | 'light-gray';
}

type SortOption = 'newest' | 'oldest' | 'highest_rating' | 'lowest_rating';

export const ReviewDisplay = ({ productId, mode, textColor = 'cream' }: ReviewDisplayProps) => {
    // Text color mapping
    const textColorClasses = {
        'cream': 'text-[#F5F5DC]',
        'white': 'text-white',
        'light-gray': 'text-gray-200'
    };
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [averageRating, setAverageRating] = useState(0);
    const [filterRating, setFilterRating] = useState<number | null>(null);
    const [expandedImage, setExpandedImage] = useState<string | null>(null);
    const [sortBy, setSortBy] = useState<SortOption>('newest');
    const [showSortMenu, setShowSortMenu] = useState(false);

    // Write Review State
    const [showWriteReview, setShowWriteReview] = useState(false);
    const [rating, setRating] = useState(5);
    const [hoverRating, setHoverRating] = useState(0);
    const [reviewForm, setReviewForm] = useState({
        name: '',
        email: '',
        title: '',
        text: ''
    });
    const [reviewImages, setReviewImages] = useState<File[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState(false);

    useEffect(() => {
        fetchReviews();
    }, [productId, mode, sortBy]);

    const fetchReviews = async () => {
        try {
            let query = supabase
                .from('reviews')
                .select('*, review_media(id, media_url)')
                .eq('status', 'approved');

            // Apply Sort
            switch (sortBy) {
                case 'newest':
                    query = query.order('reviewed_at', { ascending: false });
                    break;
                case 'oldest':
                    query = query.order('reviewed_at', { ascending: true });
                    break;
                case 'highest_rating':
                    query = query.order('rating', { ascending: false });
                    break;
                case 'lowest_rating':
                    query = query.order('rating', { ascending: true });
                    break;
            }

            if (mode === 'product' && productId) {
                query = query.eq('product_id', productId);
            } else if (mode === 'general') {
                query = query.is('product_id', null);
            }

            const { data, error } = await query;
            if (error) throw error;

            const reviewsWithPhotos = (data || []).map(review => ({
                ...review,
                photos: review.review_media || []
            }));

            setReviews(reviewsWithPhotos);

            if (data && data.length > 0) {
                const avg = data.reduce((sum, r) => sum + r.rating, 0) / data.length;
                setAverageRating(Math.round(avg * 10) / 10);
            }
        } catch (error) {
            console.error('Error fetching reviews:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files);
            setReviewImages(prev => [...prev, ...newFiles].slice(0, 3)); // Max 3 images
        }
    };

    const removeImage = (index: number) => {
        setReviewImages(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmitReview = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            // Generate ID locally so we don't need to select() back (avoids RLS read issues for pending items)
            const reviewId = uuidv4();

            // 1. Upload images if any
            const uploadedPhotoUrls: string[] = [];
            for (const file of reviewImages) {
                const fileExt = file.name.split('.').pop();
                const fileName = `${uuidv4()}.${fileExt}`;
                const { error: uploadError } = await supabase.storage
                    .from('reviews')
                    .upload(fileName, file);

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from('reviews')
                    .getPublicUrl(fileName);

                uploadedPhotoUrls.push(publicUrl);
            }

            // 2. Insert Review
            const { error: reviewError } = await supabase
                .from('reviews')
                .insert({
                    id: reviewId,
                    product_id: mode === 'product' ? productId : null,
                    customer_name: reviewForm.name,
                    customer_email: reviewForm.email,
                    rating: rating,
                    title: reviewForm.title,
                    review_text: reviewForm.text,
                    status: 'pending', // Pending approval
                    is_verified_buyer: false
                });

            if (reviewError) throw reviewError;

            // 3. Insert Review Media
            if (uploadedPhotoUrls.length > 0) {
                const mediaInserts = uploadedPhotoUrls.map(url => ({
                    review_id: reviewId,
                    media_url: url,
                    media_type: 'image'
                }));

                const { error: mediaError } = await supabase
                    .from('review_media')
                    .insert(mediaInserts);

                if (mediaError) throw mediaError;
            }

            setSubmitSuccess(true);
            setTimeout(() => {
                setShowWriteReview(false);
                setSubmitSuccess(false);
                setReviewForm({ name: '', email: '', title: '', text: '' });
                setRating(5);
                setReviewImages([]);
            }, 3000);

        } catch (error) {
            console.error('Error submitting review:', error);
            alert('Failed to submit review. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const filteredReviews = filterRating
        ? reviews.filter(r => r.rating === filterRating)
        : reviews;

    const ratingCounts = [5, 4, 3, 2, 1].map(rating => ({
        rating,
        count: reviews.filter(r => r.rating === rating).length
    }));

    const getRelativeTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays < 7) return `${diffDays} days ago`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
        if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
        return `${Math.floor(diffDays / 365)} years ago`;
    };

    if (loading) {
        return (
            <div className="py-8 text-center text-gray-400 font-urbanist">
                Loading reviews...
            </div>
        );
    }

    // PRODUCT PAGE LAYOUT - Premium Hybrid Layout
    if (mode === 'product') {
        return (
            <div className="py-12 w-full">
                {/* Streamlined Header Bar */}
                <div className="flex flex-wrap items-center justify-between mb-8 pb-4 border-b border-[#D4AF37]/30">
                    <div className="flex items-center gap-6">
                        <h2 className="text-3xl font-cinzel text-white">Reviews</h2>
                        <div className="flex items-center gap-2 text-[#D4AF37]">
                            <span className="text-2xl font-bold">{averageRating}</span>
                            <div className="flex">
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <Star
                                        key={i}
                                        size={20}
                                        fill={i < Math.round(averageRating) ? '#D4AF37' : 'none'}
                                        className={i < Math.round(averageRating) ? 'text-[#D4AF37]' : 'text-gray-600'}
                                    />
                                ))}
                            </div>
                        </div>
                        <span className="text-gray-400 font-urbanist text-sm">({reviews.length} {reviews.length === 1 ? 'Review' : 'Reviews'})</span>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Sort Dropdown */}
                        <div className="relative">
                            <button
                                onClick={() => setShowSortMenu(!showSortMenu)}
                                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:text-white font-urbanist border border-white/10 rounded-lg hover:border-[#D4AF37]/30 transition-colors"
                            >
                                Sort by: <span className="text-[#D4AF37] capitalize">{sortBy.replace('_', ' ')}</span>
                                <ChevronDown size={14} />
                            </button>
                            {showSortMenu && (
                                <div className="absolute right-0 top-full mt-2 w-48 bg-[#1a1a1a] border border-white/10 rounded-lg shadow-xl z-10 py-1">
                                    {(['newest', 'oldest', 'highest_rating', 'lowest_rating'] as SortOption[]).map((option) => (
                                        <button
                                            key={option}
                                            onClick={() => {
                                                setSortBy(option);
                                                setShowSortMenu(false);
                                            }}
                                            className={`w-full text-left px-4 py-2 text-sm font-urbanist hover:bg-white/5 ${sortBy === option ? 'text-[#D4AF37]' : 'text-gray-300'}`}
                                        >
                                            {option.replace('_', ' ').charAt(0).toUpperCase() + option.replace('_', ' ').slice(1)}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Write Review Button */}
                        <button
                            onClick={() => setShowWriteReview(true)}
                            className="px-6 py-2.5 bg-[#D4AF37] hover:bg-[#b39025] text-black font-urbanist font-bold text-sm rounded-lg transition-all hover:shadow-lg hover:shadow-[#D4AF37]/20"
                        >
                            Write Review
                        </button>
                    </div>
                </div>

                {/* Write Review Form */}
                {showWriteReview && (
                    <div className="mb-12 bg-white/5 border border-white/10 rounded-xl p-6 md:p-8 animate-in fade-in slide-in-from-top-4">
                        {submitSuccess ? (
                            <div className="text-center py-8">
                                <div className="w-16 h-16 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Star size={32} fill="currentColor" />
                                </div>
                                <h3 className="text-2xl font-cinzel text-white mb-2">Thank You!</h3>
                                <p className="text-gray-400 font-urbanist">Your review has been submitted and is pending approval.</p>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmitReview}>
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-xl font-cinzel text-white">Write a Review</h3>
                                    <button onClick={() => setShowWriteReview(false)} type="button" className="text-gray-500 hover:text-white">
                                        <X size={24} />
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                    <div>
                                        <label className="block text-sm text-gray-400 font-urbanist mb-2">Name</label>
                                        <input
                                            required
                                            type="text"
                                            value={reviewForm.name}
                                            onChange={e => setReviewForm({ ...reviewForm, name: e.target.value })}
                                            className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-[#D4AF37] focus:outline-none font-urbanist"
                                            placeholder="Your name"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-gray-400 font-urbanist mb-2">Email</label>
                                        <input
                                            required
                                            type="email"
                                            value={reviewForm.email}
                                            onChange={e => setReviewForm({ ...reviewForm, email: e.target.value })}
                                            className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-[#D4AF37] focus:outline-none font-urbanist"
                                            placeholder="Your email (kept private)"
                                        />
                                    </div>
                                </div>

                                <div className="mb-6">
                                    <label className="block text-sm text-gray-400 font-urbanist mb-2">Rating</label>
                                    <div className="flex gap-2">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <button
                                                key={star}
                                                type="button"
                                                onMouseEnter={() => setHoverRating(star)}
                                                onMouseLeave={() => setHoverRating(0)}
                                                onClick={() => setRating(star)}
                                                className="focus:outline-none transition-transform hover:scale-110"
                                            >
                                                <Star
                                                    size={32}
                                                    fill={star <= (hoverRating || rating) ? '#D4AF37' : 'none'}
                                                    className={star <= (hoverRating || rating) ? 'text-[#D4AF37]' : 'text-gray-600'}
                                                />
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="mb-6">
                                    <label className="block text-sm text-gray-400 font-urbanist mb-2">Review Title</label>
                                    <input
                                        required
                                        type="text"
                                        value={reviewForm.title}
                                        onChange={e => setReviewForm({ ...reviewForm, title: e.target.value })}
                                        className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-[#D4AF37] focus:outline-none font-urbanist"
                                        placeholder="Summarize your experience"
                                    />
                                </div>

                                <div className="mb-6">
                                    <label className="block text-sm text-gray-400 font-urbanist mb-2">Review</label>
                                    <textarea
                                        required
                                        rows={4}
                                        value={reviewForm.text}
                                        onChange={e => setReviewForm({ ...reviewForm, text: e.target.value })}
                                        className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-[#D4AF37] focus:outline-none font-urbanist"
                                        placeholder="Tell us what you liked about the product..."
                                    />
                                </div>

                                {/* Image Upload */}
                                <div className="mb-8">
                                    <label className="block text-sm text-gray-400 font-urbanist mb-2">Add Photos (Max 3)</label>
                                    <div className="flex gap-4">
                                        {reviewImages.map((file, idx) => (
                                            <div key={idx} className="relative w-24 h-24 rounded-lg overflow-hidden border border-white/20">
                                                <img src={URL.createObjectURL(file)} alt="Preview" className="w-full h-full object-cover" />
                                                <button
                                                    type="button"
                                                    onClick={() => removeImage(idx)}
                                                    className="absolute top-1 right-1 bg-black/70 rounded-full p-1 text-white hover:bg-red-500 transition-colors"
                                                >
                                                    <X size={12} />
                                                </button>
                                            </div>
                                        ))}
                                        {reviewImages.length < 3 && (
                                            <label className="w-24 h-24 flex flex-col items-center justify-center border-2 border-dashed border-white/20 rounded-lg cursor-pointer hover:border-[#D4AF37] hover:bg-white/5 transition-all text-gray-400 hover:text-[#D4AF37]">
                                                <Upload size={24} />
                                                <span className="text-xs mt-2 font-urbanist">Upload</span>
                                                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                                            </label>
                                        )}
                                    </div>
                                </div>

                                <div className="flex justify-end gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowWriteReview(false)}
                                        className="px-6 py-2 border border-white/20 hover:bg-white/5 text-white font-urbanist rounded-lg transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="px-8 py-2 bg-[#D4AF37] hover:bg-[#b39025] text-black font-urbanist font-bold rounded-lg transition-colors disabled:opacity-50"
                                    >
                                        {submitting ? 'Submitting...' : 'Submit Review'}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                )}

                {/* Reviews List - Premium Horizontal Cards */}
                <div className="space-y-0">
                    {filteredReviews.map((review, index) => (
                        <div
                            key={review.id}
                            className={`py-6 ${index !== filteredReviews.length - 1 ? 'border-b border-[#D4AF37]/20' : ''}`}
                        >
                            <div className="flex items-start gap-6">
                                {/* Left - Ornate Avatar */}
                                <div className="flex-shrink-0">
                                    <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-[#D4AF37]/30 to-[#D4AF37]/10 p-1 shadow-lg shadow-[#D4AF37]/10">
                                        <div className="w-full h-full rounded-full bg-[#1a1a1a] border-2 border-[#D4AF37]/50 flex items-center justify-center">
                                            <span className="text-[#D4AF37] font-cinzel font-bold text-2xl">
                                                {review.customer_name.charAt(0).toUpperCase()}
                                            </span>
                                        </div>
                                        {/* Decorative corner elements */}
                                        <div className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-[#D4AF37]/70"></div>
                                        <div className="absolute -top-1 -right-1 w-3 h-3 border-t-2 border-r-2 border-[#D4AF37]/70"></div>
                                        <div className="absolute -bottom-1 -left-1 w-3 h-3 border-b-2 border-l-2 border-[#D4AF37]/70"></div>
                                        <div className="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 border-[#D4AF37]/70"></div>
                                    </div>
                                </div>

                                {/* Center - Review Content */}
                                <div className="flex-1 min-w-0">
                                    {/* Name and Verified Badge */}
                                    <div className="flex items-center gap-3 mb-2">
                                        <h3 className="text-white font-urbanist font-semibold text-lg">
                                            {review.customer_name}
                                        </h3>
                                        {review.is_verified_buyer && (
                                            <span className="px-2 py-0.5 bg-teal-500/20 text-teal-400 rounded text-xs font-urbanist uppercase tracking-wide">
                                                Verified Buyer
                                            </span>
                                        )}
                                    </div>

                                    {/* Stars and Title */}
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="flex">
                                            {Array.from({ length: 5 }).map((_, i) => (
                                                <Star
                                                    key={i}
                                                    size={16}
                                                    fill={i < review.rating ? '#D4AF37' : 'none'}
                                                    className={i < review.rating ? 'text-[#D4AF37]' : 'text-gray-600'}
                                                />
                                            ))}
                                        </div>
                                        {review.title && (
                                            <span className="text-white font-urbanist font-semibold">
                                                {review.title}
                                            </span>
                                        )}
                                    </div>

                                    {/* Review Text */}
                                    <p className={`${textColorClasses[textColor]} font-urbanist text-base leading-relaxed`}>
                                        {review.review_text}
                                    </p>
                                </div>

                                {/* Right - Photos and Date */}
                                <div className="flex-shrink-0 flex flex-col items-end gap-3">
                                    {/* Date */}
                                    <span className="text-sm text-gray-500 font-urbanist whitespace-nowrap">
                                        {getRelativeTime(review.reviewed_at)}
                                    </span>

                                    {/* Photos */}
                                    {review.photos && review.photos.length > 0 && (
                                        <div className="flex gap-2">
                                            {review.photos.slice(0, 3).map((photo) => (
                                                <button
                                                    key={photo.id}
                                                    onClick={() => setExpandedImage(photo.media_url)}
                                                    className="group relative overflow-hidden rounded-lg border border-[#D4AF37]/30 hover:border-[#D4AF37] transition-all"
                                                >
                                                    <img
                                                        src={photo.media_url}
                                                        alt="Review"
                                                        className="w-16 h-16 object-cover group-hover:scale-110 transition-transform duration-300"
                                                    />
                                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors"></div>
                                                </button>
                                            ))}
                                            {review.photos.length > 3 && (
                                                <div className="w-16 h-16 rounded-lg border border-[#D4AF37]/30 bg-black/40 flex items-center justify-center">
                                                    <span className="text-[#D4AF37] text-xs font-urbanist font-bold">
                                                        +{review.photos.length - 3}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Image Lightbox */}
                {expandedImage && (
                    <div
                        className="fixed inset-0 bg-black/95 z-[60] flex items-center justify-center p-4"
                        onClick={() => setExpandedImage(null)}
                    >
                        <img
                            src={expandedImage}
                            alt="Review enlarged"
                            className="max-w-full max-h-[90vh] object-contain rounded-lg"
                        />
                        <button
                            className="absolute top-6 right-6 text-white hover:text-[#D4AF37] transition-colors"
                            onClick={() => setExpandedImage(null)}
                        >
                            <X size={32} />
                        </button>
                    </div>
                )}
            </div>
        );
    }

    // OFFERINGS/GENERAL PAGE LAYOUT - Keep the grid you love
    return (
        <div className="py-12">
            {/* Header */}
            <div className="mb-8">
                <h2 className="text-3xl font-cinzel text-white mb-4">
                    Customer Testimonials
                </h2>

                {/* Rating Summary */}
                <div className="flex items-center gap-6 mb-6">
                    <div className="flex flex-col items-center">
                        <div className="text-5xl font-bold text-white font-urbanist">{averageRating}</div>
                        <div className="flex mt-2">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <Star
                                    key={i}
                                    size={20}
                                    fill={i < Math.round(averageRating) ? '#D4AF37' : 'none'}
                                    className={i < Math.round(averageRating) ? 'text-[#D4AF37]' : 'text-gray-600'}
                                />
                            ))}
                        </div>
                        <div className="text-sm text-gray-400 font-urbanist mt-1">
                            {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}
                        </div>
                    </div>

                    {/* Rating Distribution */}
                    <div className="flex-1 space-y-2">
                        {ratingCounts.map(({ rating, count }) => (
                            <button
                                key={rating}
                                onClick={() => setFilterRating(filterRating === rating ? null : rating)}
                                className={`w-full flex items-center gap-3 text-sm font-urbanist transition-colors ${filterRating === rating ? 'text-[#D4AF37]' : 'text-gray-400 hover:text-gray-300'
                                    }`}
                            >
                                <span className="w-12">{rating} stars</span>
                                <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-[#D4AF37] rounded-full transition-all"
                                        style={{ width: `${reviews.length ? (count / reviews.length) * 100 : 0}%` }}
                                    />
                                </div>
                                <span className="w-8 text-right">{count}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Filter Badge */}
                {filterRating && (
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#D4AF37]/20 text-[#D4AF37] rounded-full text-sm font-urbanist">
                        Showing {filterRating}-star reviews
                        <button
                            onClick={() => setFilterRating(null)}
                            className="hover:text-white transition-colors"
                        >
                            ×
                        </button>
                    </div>
                )}
            </div>

            {/* Reviews Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredReviews.map((review) => (
                    <div
                        key={review.id}
                        className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:bg-white/10 hover:border-[#D4AF37]/30 transition-all duration-300"
                    >
                        {/* Review Photo */}
                        {review.photos && review.photos.length > 0 && (
                            <button
                                onClick={() => setExpandedImage(review.photos[0].media_url)}
                                className="relative group w-full aspect-square"
                            >
                                <img
                                    src={review.photos[0].media_url}
                                    alt="Review photo"
                                    className="w-full h-full object-cover"
                                />
                                {review.photos.length > 1 && (
                                    <div className="absolute bottom-3 right-3 bg-black/70 text-white text-xs px-2 py-1 rounded-full font-urbanist">
                                        +{review.photos.length - 1} more
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                    <ImageIcon size={28} className="text-white" />
                                </div>
                            </button>
                        )}

                        {/* Content */}
                        <div className="p-5">
                            {/* Rating Row */}
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                        <Star
                                            key={i}
                                            size={18}
                                            fill={i < review.rating ? '#D4AF37' : 'none'}
                                            className={i < review.rating ? 'text-[#D4AF37]' : 'text-gray-600'}
                                        />
                                    ))}
                                </div>
                                {review.is_verified_buyer && (
                                    <span className="px-2 py-1 bg-teal-500/20 text-teal-400 rounded text-[10px] font-urbanist uppercase tracking-wide">
                                        Verified Buyer
                                    </span>
                                )}
                            </div>

                            {/* Review Text */}
                            <p className="text-gray-300 font-urbanist text-sm leading-relaxed mb-4">
                                {review.review_text}
                            </p>

                            {/* Author & Date */}
                            <div className="flex items-center gap-3 pt-4 border-t border-white/10">
                                <div className="w-10 h-10 rounded-full bg-[#D4AF37]/20 flex items-center justify-center text-[#D4AF37] font-bold">
                                    {review.customer_name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <span className="text-gray-200 font-urbanist block">{review.customer_name}</span>
                                    <span className="text-gray-500 text-xs font-urbanist">
                                        {new Date(review.reviewed_at).toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        })}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Image Lightbox */}
            {expandedImage && (
                <div
                    className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
                    onClick={() => setExpandedImage(null)}
                >
                    <img
                        src={expandedImage}
                        alt="Review photo enlarged"
                        className="max-w-full max-h-full object-contain rounded-lg"
                    />
                    <button
                        className="absolute top-4 right-4 text-white/80 hover:text-white text-xl"
                        onClick={() => setExpandedImage(null)}
                    >
                        ✕
                    </button>
                </div>
            )}
        </div>
    );
};

export default ReviewDisplay;
