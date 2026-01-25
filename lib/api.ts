import { supabase } from './supabase';

export interface ReviewInsert {
    reviewer_name: string;
    product_id: string; // Storing the product name for now
    rating: number;
    comment: string;
    // email: string; // We'll add this later if we update the schema
}

export const api = {
    reviews: {
        async submit(review: ReviewInsert) {
            const { data, error } = await supabase
                .from('reviews')
                .insert([
                    {
                        reviewer_name: review.reviewer_name,
                        product_id: review.product_id,
                        rating: review.rating,
                        comment: review.comment
                    }
                ])
                .select();

            if (error) throw error;
            return data;
        },

        async getApproved() {
            const { data, error } = await supabase
                .from('reviews')
                .select('*')
                .eq('is_approved', true)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data;
        }
    }
};
