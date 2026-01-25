import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { ArrowLeft, Save, Calendar, ImagePlus, X, Loader2, Trash2 } from 'lucide-react';

interface ManualReviewEditorProps {
    onBack: () => void;
    editReviewId?: string;
}

interface PhotoPreview {
    file: File;
    preview: string;
}

interface ExistingPhoto {
    id: string;
    media_url: string;
}

export const ManualReviewEditor = ({ onBack, editReviewId }: ManualReviewEditorProps) => {
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadingReview, setLoadingReview] = useState(!!editReviewId);
    const [uploadingPhotos, setUploadingPhotos] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Form fields
    const [productId, setProductId] = useState<string>('');
    const [customerName, setCustomerName] = useState('');
    const [customerEmail, setCustomerEmail] = useState('');
    const [rating, setRating] = useState(5);
    const [title, setTitle] = useState('');
    const [reviewText, setReviewText] = useState('');
    const [isVerifiedBuyer, setIsVerifiedBuyer] = useState(false);
    const [reviewDate, setReviewDate] = useState(new Date().toISOString().split('T')[0]);
    const [isGeneral, setIsGeneral] = useState(false);
    const [photos, setPhotos] = useState<PhotoPreview[]>([]);
    const [existingPhotos, setExistingPhotos] = useState<ExistingPhoto[]>([]);
    const [photosToDelete, setPhotosToDelete] = useState<string[]>([]);
    const [reviewStatus, setReviewStatus] = useState<'pending' | 'approved' | 'rejected'>('approved');

    useEffect(() => {
        fetchProducts();
        if (editReviewId) {
            fetchReviewData(editReviewId);
        }
    }, [editReviewId]);

    // Cleanup photo previews on unmount
    useEffect(() => {
        return () => {
            photos.forEach(photo => URL.revokeObjectURL(photo.preview));
        };
    }, []);

    const fetchReviewData = async (reviewId: string) => {
        try {
            setLoadingReview(true);

            // Fetch review data
            const { data: review, error } = await supabase
                .from('reviews')
                .select('*')
                .eq('id', reviewId)
                .single();

            if (error) throw error;

            if (review) {
                setProductId(review.product_id || '');
                setCustomerName(review.customer_name);
                setCustomerEmail(review.customer_email === 'manual@entry.com' ? '' : review.customer_email);
                setRating(review.rating);
                setTitle(review.title || '');
                setReviewText(review.review_text);
                setIsVerifiedBuyer(review.is_verified_buyer);
                setReviewDate(new Date(review.reviewed_at).toISOString().split('T')[0]);
                setIsGeneral(review.product_id === null);
                setReviewStatus(review.status);
            }

            // Fetch existing photos
            const { data: media, error: mediaError } = await supabase
                .from('review_media')
                .select('id, media_url')
                .eq('review_id', reviewId)
                .order('sort_order');

            if (mediaError) throw mediaError;
            setExistingPhotos(media || []);

        } catch (error) {
            console.error('Error fetching review:', error);
            alert('Failed to load review data');
            onBack();
        } finally {
            setLoadingReview(false);
        }
    };

    const removeExistingPhoto = (photoId: string) => {
        setPhotosToDelete(prev => [...prev, photoId]);
        setExistingPhotos(prev => prev.filter(p => p.id !== photoId));
    };

    const totalPhotos = existingPhotos.length + photos.length;

    const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;

        const maxNewPhotos = 5 - totalPhotos;
        const newPhotos: PhotoPreview[] = [];
        for (let i = 0; i < files.length && newPhotos.length < maxNewPhotos; i++) {
            const file = files[i];
            if (file.type.startsWith('image/')) {
                newPhotos.push({
                    file,
                    preview: URL.createObjectURL(file)
                });
            }
        }

        setPhotos(prev => [...prev, ...newPhotos]);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const removePhoto = (index: number) => {
        setPhotos(prev => {
            URL.revokeObjectURL(prev[index].preview);
            return prev.filter((_, i) => i !== index);
        });
    };

    const uploadPhotos = async (reviewId: string) => {
        const uploadedMedia: { media_url: string; sort_order: number }[] = [];
        const errors: string[] = [];

        for (let i = 0; i < photos.length; i++) {
            const photo = photos[i];
            const fileExt = photo.file.name.split('.').pop();
            const fileName = `${reviewId}/${Date.now()}-${i}.${fileExt}`;

            console.log('Uploading photo:', fileName);

            const { data, error } = await supabase.storage
                .from('review-media')
                .upload(fileName, photo.file, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (error) {
                console.error('Error uploading photo to storage:', error);
                errors.push(`Storage upload failed: ${error.message}`);
                continue;
            }

            console.log('Photo uploaded, getting public URL');

            const { data: urlData } = supabase.storage
                .from('review-media')
                .getPublicUrl(data.path);

            uploadedMedia.push({
                media_url: urlData.publicUrl,
                sort_order: i
            });
        }

        // Insert media records
        if (uploadedMedia.length > 0) {
            const mediaRecords = uploadedMedia.map(m => ({
                review_id: reviewId,
                media_type: 'photo',
                media_url: m.media_url,
                sort_order: m.sort_order
            }));

            console.log('Inserting media records:', mediaRecords);

            const { error } = await supabase
                .from('review_media')
                .insert(mediaRecords);

            if (error) {
                console.error('Error inserting media records:', error);
                throw new Error(`Failed to save photo records: ${error.message}`);
            }

            console.log('Media records saved successfully');
        }

        if (errors.length > 0) {
            throw new Error(errors.join('\n'));
        }

        return uploadedMedia.length;
    };

    const fetchProducts = async () => {
        try {
            const { data, error } = await supabase
                .from('products')
                .select('id, title, slug')
                .eq('status', 'active')
                .order('title');

            if (error) throw error;
            setProducts(data || []);
        } catch (error) {
            console.error('Error fetching products:', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!customerName || !reviewText) {
            alert('Please fill in all required fields');
            return;
        }

        setLoading(true);
        try {
            const reviewData = {
                product_id: isGeneral ? null : (productId || null),
                customer_name: customerName.trim(),
                customer_email: customerEmail.trim() || 'manual@entry.com',
                rating,
                title: title.trim() || null,
                review_text: reviewText.trim(),
                is_verified_buyer: isVerifiedBuyer,
                status: editReviewId ? reviewStatus : 'approved', // Preserve status on edit, auto-approve on create
                reviewed_at: new Date(reviewDate).toISOString()
            };

            let reviewId = editReviewId;

            if (editReviewId) {
                // UPDATE existing review
                const { error } = await supabase
                    .from('reviews')
                    .update(reviewData)
                    .eq('id', editReviewId);

                if (error) throw error;

                // Delete marked photos
                if (photosToDelete.length > 0) {
                    const { error: deleteError } = await supabase
                        .from('review_media')
                        .delete()
                        .in('id', photosToDelete);

                    if (deleteError) {
                        console.error('Error deleting photos:', deleteError);
                    }
                }
            } else {
                // INSERT new review
                const { data: insertedReview, error } = await supabase
                    .from('reviews')
                    .insert([reviewData])
                    .select('id')
                    .single();

                if (error) throw error;
                reviewId = insertedReview?.id;
            }

            // Upload new photos if any
            if (photos.length > 0 && reviewId) {
                setUploadingPhotos(true);
                await uploadPhotos(reviewId);
                setUploadingPhotos(false);
            }

            alert(editReviewId ? 'Review updated successfully!' : 'Review added successfully!');
            onBack();
        } catch (error: any) {
            console.error('Error saving review:', error);
            alert(`Failed to save review: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    if (loadingReview) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-black via-purple-900/10 to-black flex items-center justify-center">
                <div className="flex items-center gap-3 text-white/60 font-urbanist">
                    <Loader2 className="animate-spin" size={24} />
                    Loading review...
                </div>
            </div>
        );
    }

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
                        Back to Reviews
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="bg-white/5 border border-white/10 rounded-lg p-8">
                    <h2 className="text-2xl font-cinzel text-white mb-6">
                        {editReviewId ? 'Edit Review' : 'Add Review Manually'}
                    </h2>

                    {/* Review Type */}
                    <div className="mb-6">
                        <label className="flex items-center gap-3 text-sm text-white/80 font-urbanist cursor-pointer">
                            <input
                                type="checkbox"
                                checked={isGeneral}
                                onChange={(e) => setIsGeneral(e.target.checked)}
                                className="rounded"
                            />
                            This is a general testimonial (not for a specific product)
                        </label>
                    </div>

                    {/* Product Selection */}
                    {!isGeneral && (
                        <div className="mb-6">
                            <label className="block text-xs text-gray-500 uppercase tracking-wider mb-2 font-urbanist">
                                Product *
                            </label>
                            <select
                                value={productId}
                                onChange={(e) => setProductId(e.target.value)}
                                required={!isGeneral}
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-300 focus:border-purple-500/50 focus:outline-none font-urbanist"
                            >
                                <option value="">Select a product</option>
                                {products.map((product) => (
                                    <option key={product.id} value={product.id}>
                                        {product.title}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Customer Info */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div>
                            <label className="block text-xs text-gray-500 uppercase tracking-wider mb-2 font-urbanist">
                                Customer Name *
                            </label>
                            <input
                                type="text"
                                value={customerName}
                                onChange={(e) => setCustomerName(e.target.value)}
                                required
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-300 focus:border-purple-500/50 focus:outline-none font-urbanist"
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-gray-500 uppercase tracking-wider mb-2 font-urbanist">
                                Customer Email
                            </label>
                            <input
                                type="email"
                                value={customerEmail}
                                onChange={(e) => setCustomerEmail(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-300 focus:border-purple-500/50 focus:outline-none font-urbanist"
                            />
                        </div>
                    </div>

                    {/* Rating */}
                    <div className="mb-6">
                        <label className="block text-xs text-gray-500 uppercase tracking-wider mb-2 font-urbanist">
                            Rating *
                        </label>
                        <div className="flex gap-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    onClick={() => setRating(star)}
                                    className={`text-2xl transition-colors ${star <= rating ? 'text-[#D4AF37]' : 'text-gray-600'
                                        }`}
                                >
                                    ★
                                </button>
                            ))}
                            <span className="ml-3 text-gray-400 font-urbanist">{rating} stars</span>
                        </div>
                    </div>

                    {/* Title */}
                    <div className="mb-6">
                        <label className="block text-xs text-gray-500 uppercase tracking-wider mb-2 font-urbanist">
                            Review Title
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g., Amazing product!"
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-300 focus:border-purple-500/50 focus:outline-none placeholder-gray-600 font-urbanist"
                        />
                    </div>

                    {/* Review Text */}
                    <div className="mb-6">
                        <label className="block text-xs text-gray-500 uppercase tracking-wider mb-2 font-urbanist">
                            Review Text *
                        </label>
                        <textarea
                            value={reviewText}
                            onChange={(e) => setReviewText(e.target.value)}
                            required
                            rows={5}
                            placeholder="Write the review here..."
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-300 focus:border-purple-500/50 focus:outline-none placeholder-gray-600 resize-none font-urbanist"
                        />
                    </div>

                    {/* Photo Upload */}
                    <div className="mb-6">
                        <label className="block text-xs text-gray-500 uppercase tracking-wider mb-2 font-urbanist flex items-center gap-2">
                            <ImagePlus size={14} />
                            Review Photos (up to 5)
                        </label>

                        {/* Photo Previews - Existing and New */}
                        {(existingPhotos.length > 0 || photos.length > 0) && (
                            <div className="flex flex-wrap gap-3 mb-3">
                                {/* Existing Photos */}
                                {existingPhotos.map((photo) => (
                                    <div key={photo.id} className="relative group">
                                        <img
                                            src={photo.media_url}
                                            alt="Review photo"
                                            className="w-20 h-20 object-cover rounded-lg border border-white/10"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => removeExistingPhoto(photo.id)}
                                            className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <Trash2 size={12} className="text-white" />
                                        </button>
                                    </div>
                                ))}
                                {/* New Photos */}
                                {photos.map((photo, index) => (
                                    <div key={`new-${index}`} className="relative group">
                                        <img
                                            src={photo.preview}
                                            alt={`Preview ${index + 1}`}
                                            className="w-20 h-20 object-cover rounded-lg border border-purple-500/50"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => removePhoto(index)}
                                            className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <X size={12} className="text-white" />
                                        </button>
                                        <span className="absolute bottom-0 left-0 right-0 bg-purple-600/80 text-white text-xs text-center py-0.5 rounded-b-lg">
                                            New
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Upload Button */}
                        {totalPhotos < 5 && (
                            <div>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    onChange={handlePhotoSelect}
                                    className="hidden"
                                    id="photo-upload"
                                />
                                <label
                                    htmlFor="photo-upload"
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 border-dashed rounded-lg text-gray-400 hover:text-white hover:border-purple-500/50 transition-all cursor-pointer font-urbanist text-sm"
                                >
                                    <ImagePlus size={16} />
                                    Add Photos
                                </label>
                                <p className="text-xs text-gray-600 mt-2 font-urbanist">
                                    Click to upload photos. {5 - totalPhotos} remaining.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Review Date */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div>
                            <label className="block text-xs text-gray-500 uppercase tracking-wider mb-2 font-urbanist flex items-center gap-2">
                                <Calendar size={14} />
                                Review Date
                            </label>
                            <input
                                type="date"
                                value={reviewDate}
                                onChange={(e) => setReviewDate(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-300 focus:border-purple-500/50 focus:outline-none font-urbanist"
                            />
                        </div>
                        <div className="flex items-end">
                            <label className="flex items-center gap-3 text-sm text-white/80 font-urbanist cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={isVerifiedBuyer}
                                    onChange={(e) => setIsVerifiedBuyer(e.target.checked)}
                                    className="rounded"
                                />
                                Mark as Verified Buyer
                            </label>
                        </div>
                    </div>

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={loading || uploadingPhotos}
                        className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-urbanist font-bold rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {loading || uploadingPhotos ? (
                            <>
                                <Loader2 size={18} className="animate-spin" />
                                {uploadingPhotos ? 'Uploading Photos...' : 'Saving...'}
                            </>
                        ) : (
                            <>
                                <Save size={18} />
                                {editReviewId ? 'Save Changes' : 'Add Review'}
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ManualReviewEditor;
