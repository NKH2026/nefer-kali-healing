-- ============================================
-- PRODUCT REVIEW SYSTEM SCHEMA
-- Support for product-specific reviews AND general testimonials
-- ============================================

-- Drop existing tables if any
DROP TABLE IF EXISTS review_media CASCADE;
DROP TABLE IF EXISTS reviews CASCADE;

-- 1. REVIEWS TABLE
CREATE TABLE reviews (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  -- Product Association (NULL = general testimonial, NOT NULL = product review)
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  
  -- Customer Information
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  
  -- Review Content
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  review_text TEXT NOT NULL,
  
  -- Review Type Helper (auto-computed)
  is_general_testimonial BOOLEAN GENERATED ALWAYS AS (product_id IS NULL) STORED,
  
  -- Verification
  is_verified_buyer BOOLEAN DEFAULT false,
  
  -- Moderation Workflow
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_notes TEXT,  -- Internal notes for admin
  moderated_by TEXT,  -- Admin who approved/rejected
  moderated_at TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  reviewed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL  -- Actual review date (for imports)
);

-- Enable RLS
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Public can view approved reviews only
CREATE POLICY "Public can view approved reviews" 
  ON reviews FOR SELECT 
  USING (status = 'approved');

-- Anyone can submit a review (creates as pending)
CREATE POLICY "Anyone can submit reviews" 
  ON reviews FOR INSERT 
  WITH CHECK (status = 'pending');

-- Admins can manage all reviews
CREATE POLICY "Admins can manage reviews" 
  ON reviews FOR ALL 
  USING (auth.role() = 'authenticated');

-- Indexes for performance
CREATE INDEX reviews_product_id_idx ON reviews(product_id) WHERE product_id IS NOT NULL;
CREATE INDEX reviews_general_idx ON reviews(is_general_testimonial) WHERE is_general_testimonial = true AND status = 'approved';
CREATE INDEX reviews_status_idx ON reviews(status);
CREATE INDEX reviews_rating_idx ON reviews(rating);
CREATE INDEX reviews_created_idx ON reviews(created_at DESC);

-- 2. REVIEW MEDIA TABLE (photos and videos)
CREATE TABLE review_media (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  review_id UUID REFERENCES reviews(id) ON DELETE CASCADE NOT NULL,
  
  -- Media Type
  media_type TEXT NOT NULL CHECK (media_type IN ('photo', 'video', 'video_link')),
  media_url TEXT NOT NULL,  -- Storage URL for photos/videos, or external link for video_link
  
  -- Display Order
  sort_order INTEGER DEFAULT 0,
  
  -- Optional metadata
  caption TEXT,
  width INTEGER,
  height INTEGER
);

-- Enable RLS
ALTER TABLE review_media ENABLE ROW LEVEL SECURITY;

-- Public can view media for approved reviews
CREATE POLICY "Public can view approved review media" 
  ON review_media FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM reviews 
      WHERE reviews.id = review_media.review_id 
      AND reviews.status = 'approved'
    )
  );

-- Anyone can insert media when creating a review
CREATE POLICY "Anyone can insert review media" 
  ON review_media FOR INSERT 
  WITH CHECK (true);

-- Admins can manage all media
CREATE POLICY "Admins can manage review media" 
  ON review_media FOR ALL 
  USING (auth.role() = 'authenticated');

-- Index
CREATE INDEX review_media_review_id_idx ON review_media(review_id);

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to get average rating for a product
CREATE OR REPLACE FUNCTION get_product_average_rating(p_product_id UUID)
RETURNS NUMERIC AS $$
BEGIN
  RETURN (
    SELECT ROUND(AVG(rating)::numeric, 1)
    FROM reviews
    WHERE product_id = p_product_id 
    AND status = 'approved'
  );
END;
$$ LANGUAGE plpgsql;

-- Function to get review count for a product
CREATE OR REPLACE FUNCTION get_product_review_count(p_product_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::integer
    FROM reviews
    WHERE product_id = p_product_id 
    AND status = 'approved'
  );
END;
$$ LANGUAGE plpgsql;

-- Function to update moderation timestamp
CREATE OR REPLACE FUNCTION update_review_moderation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status != OLD.status AND NEW.status IN ('approved', 'rejected') THEN
    NEW.moderated_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for moderation timestamp
CREATE TRIGGER set_moderation_timestamp
  BEFORE UPDATE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_review_moderation_timestamp();

-- ============================================
-- STORAGE BUCKET SETUP
-- ============================================

-- Note: Create the bucket in Supabase Dashboard or use:
-- insert into storage.buckets (id, name, public) 
-- values ('review-media', 'review-media', true);

-- Storage policies (apply after bucket is created)
-- create policy "Public review media is accessible"
--   on storage.objects for select
--   using (bucket_id = 'review-media');

-- create policy "Authenticated users can upload review media"
--   on storage.objects for insert
--   with check (
--     bucket_id = 'review-media' 
--     and auth.role() = 'authenticated'
--   );

-- create policy "Authenticated users can delete review media"
--   on storage.objects for delete
--   using (
--     bucket_id = 'review-media' 
--     and auth.role() = 'authenticated'
--   );
