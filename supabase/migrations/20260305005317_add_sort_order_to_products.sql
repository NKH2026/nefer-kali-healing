-- Add sort_order to products table
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS sort_order integer DEFAULT 0;

-- Down migration will drop the column if rollback occurs
-- ALTER TABLE public.products DROP COLUMN IF EXISTS sort_order;
