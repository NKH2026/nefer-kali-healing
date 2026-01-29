import { supabase } from './supabase';

export interface ReviewInsert {
    customer_name: string;
    customer_email: string;
    product_id: string; // UUID
    rating: number;
    review_text: string;
}

export const api = {
    products: {
        async list() {
            const { data, error } = await supabase
                .from('products')
                .select('id, title');
            if (error) throw error;
            return { data };
        }
    },
    reviews: {
        async submit(review: ReviewInsert) {
            const { data, error } = await supabase
                .from('reviews')
                .insert([
                    {
                        customer_name: review.customer_name,
                        customer_email: review.customer_email,
                        product_id: review.product_id,
                        rating: review.rating,
                        review_text: review.review_text,
                        status: 'pending'
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
                .eq('status', 'approved')
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data;
        }
    }
};
