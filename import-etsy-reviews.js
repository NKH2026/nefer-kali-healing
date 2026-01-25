// Quick script to import Etsy reviews from JSON to Supabase
// Run this with: node import-etsy-reviews.js

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

// Your Supabase credentials
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function importReviews() {
    // Read the JSON file (update path if needed)
    const reviewsData = JSON.parse(fs.readFileSync('C:/Users/nefer/OneDrive/Desktop/reviews.json', 'utf-8'));

    console.log(`Found ${reviewsData.length} reviews to import...`);

    let successCount = 0;
    let errorCount = 0;

    for (const review of reviewsData) {
        try {
            // Parse the date
            let reviewedAt = new Date();
            if (review.date_reviewed) {
                reviewedAt = new Date(review.date_reviewed);
            }

            // Insert into Supabase
            const { error } = await supabase.from('reviews').insert({
                product_id: null, // All Etsy reviews are general testimonials
                customer_name: review.reviewer,
                customer_email: 'etsy@imported.com',
                rating: review.star_rating,
                title: null,
                review_text: review.message || '',
                is_verified_buyer: true, // Etsy reviews are from real buyers
                status: 'approved', // Auto-approve
                reviewed_at: reviewedAt.toISOString()
            });

            if (error) throw error;

            successCount++;
            if (successCount % 10 === 0) {
                console.log(`Imported ${successCount} reviews...`);
            }
        } catch (err) {
            console.error(`Error importing review from ${review.reviewer}:`, err.message);
            errorCount++;
        }
    }

    console.log('\n✅ Import complete!');
    console.log(`Successfully imported: ${successCount}`);
    console.log(`Errors: ${errorCount}`);
}

importReviews().catch(console.error);
