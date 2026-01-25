-- Add text_color column to blog_posts table
ALTER TABLE blog_posts 
ADD COLUMN IF NOT EXISTS text_color TEXT DEFAULT 'cream';

-- Update existing posts to use cream color by default
UPDATE blog_posts 
SET text_color = 'cream' 
WHERE text_color IS NULL;
