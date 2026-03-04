-- Run this in the Supabase SQL Editor to add support for digital products
ALTER TABLE public.products 
ADD COLUMN is_digital BOOLEAN DEFAULT false;

ALTER TABLE public.products 
ADD COLUMN digital_asset_url TEXT;
