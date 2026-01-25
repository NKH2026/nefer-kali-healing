-- ============================================
-- PRODUCT MANAGEMENT SCHEMA
-- Enhanced e-commerce system with subscriptions, 
-- pre-orders, variants, and back-in-stock requests
-- ============================================

-- Drop existing tables (CASCADE will remove dependent objects)
DROP TABLE IF EXISTS back_in_stock_requests CASCADE;
DROP TABLE IF EXISTS product_variants CASCADE;
DROP TABLE IF EXISTS product_images CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS product_categories CASCADE;

-- 1. PRODUCT CATEGORIES TABLE
create table product_categories (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  name text unique not null,
  slug text unique not null,
  description text,
  image_url text,
  sort_order integer default 0,
  is_active boolean default true
);

-- Enable RLS
alter table product_categories enable row level security;

create policy "Public categories are viewable" 
  on product_categories for select 
  using (is_active = true);

create policy "Admins can manage categories" 
  on product_categories for all 
  using (auth.role() = 'authenticated');

-- Insert your categories
insert into product_categories (name, slug, sort_order) values
  ('Capsulated Botanics & Herbs', 'capsulated-botanics-herbs', 1),
  ('Extracts', 'extracts', 2),
  ('Sea Moss', 'sea-moss', 3),
  ('Spiritual Wellness', 'spiritual-wellness', 4),
  ('Women''s Wellness', 'womens-wellness', 5);

-- 2. PRODUCTS TABLE (Enhanced)
create table products (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- Basic Info
  title text not null,
  slug text unique not null,
  description text,
  short_description text,
  
  -- Classification
  category text not null,
  tags text[],
  
  -- Pricing
  price numeric(10, 2),
  compare_at_price numeric(10, 2),
  on_sale boolean default false,
  cost_per_item numeric(10, 2),
  
  -- Inventory
  sku text unique,
  barcode text,
  track_inventory boolean default true,
  inventory_quantity integer default 0,
  allow_backorders boolean default false,
  low_stock_threshold integer default 5,
  
  -- Pre-order
  is_preorder boolean default false,
  preorder_message text,
  preorder_release_date timestamp with time zone,
  
  -- Subscription
  subscription_available boolean default false,
  subscription_discount_percent numeric(5, 2),
  subscription_frequency_options text[],
  
  -- Additional Info Sections
  ingredients text,
  usage_instructions text,
  warnings text,
  benefits text,
  
  -- Media
  featured_image_url text,
  
  -- Status
  status text default 'draft' check (status in ('draft', 'active', 'archived')),
  published boolean default false,
  
  -- SEO
  meta_title text,
  meta_description text,
  
  -- Options
  has_variants boolean default false,
  
  -- Sorting
  sort_order integer default 0
);

-- Enable RLS
alter table products enable row level security;

-- Public can view active products
create policy "Public products are viewable by everyone" 
  on products for select 
  using (status = 'active' and published = true);

-- Admins can manage all products
create policy "Admins can manage products" 
  on products for all 
  using (auth.role() = 'authenticated');

-- Indexes for performance
create index products_category_idx on products(category);
create index products_status_idx on products(status);
create index products_slug_idx on products(slug);
create index products_published_idx on products(published);

-- 3. PRODUCT IMAGES TABLE
create table product_images (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  product_id uuid references products(id) on delete cascade not null,
  image_url text not null,
  alt_text text,
  sort_order integer default 0,
  is_featured boolean default false
);

-- Enable RLS
alter table product_images enable row level security;

-- Public can view images for published products
create policy "Public images are viewable" 
  on product_images for select 
  using (
    exists (
      select 1 from products 
      where products.id = product_images.product_id 
      and products.published = true
    )
  );

-- Admins can manage images
create policy "Admins can manage images" 
  on product_images for all 
  using (auth.role() = 'authenticated');

-- Index
create index product_images_product_id_idx on product_images(product_id);

-- 4. PRODUCT VARIANTS TABLE
create table product_variants (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  product_id uuid references products(id) on delete cascade not null,
  
  -- Variant Details
  title text not null,
  option1 text,
  option2 text,
  option3 text,
  
  -- Pricing (can override product price)
  price numeric(10, 2),
  compare_at_price numeric(10, 2),
  cost_per_item numeric(10, 2),
  
  -- Inventory
  sku text unique,
  barcode text,
  inventory_quantity integer default 0,
  
  -- Media
  image_url text,
  
  -- Status
  available boolean default true,
  
  -- Sorting
  sort_order integer default 0
);

-- Enable RLS
alter table product_variants enable row level security;

create policy "Public variants are viewable" 
  on product_variants for select 
  using (
    exists (
      select 1 from products 
      where products.id = product_variants.product_id 
      and products.published = true
    )
  );

create policy "Admins can manage variants" 
  on product_variants for all 
  using (auth.role() = 'authenticated');

-- Index
create index product_variants_product_id_idx on product_variants(product_id);

-- 5. BACK IN STOCK REQUESTS TABLE
create table back_in_stock_requests (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  product_id uuid references products(id) on delete cascade,
  variant_id uuid references product_variants(id) on delete cascade,
  customer_email text not null,
  customer_name text,
  notified boolean default false,
  notified_at timestamp with time zone
);

-- Enable RLS
alter table back_in_stock_requests enable row level security;

-- Anyone can submit a back in stock request
create policy "Anyone can submit back in stock requests" 
  on back_in_stock_requests for insert 
  with check (true);

-- Admins can view and manage requests
create policy "Admins can view back in stock requests" 
  on back_in_stock_requests for select 
  using (auth.role() = 'authenticated');

create policy "Admins can update requests" 
  on back_in_stock_requests for update 
  using (auth.role() = 'authenticated');

-- Indexes
create index back_in_stock_product_idx on back_in_stock_requests(product_id);
create index back_in_stock_email_idx on back_in_stock_requests(customer_email);

-- ============================================
-- STORAGE BUCKET SETUP
-- ============================================

-- Note: Create the bucket in Supabase Dashboard or use:
-- insert into storage.buckets (id, name, public) 
-- values ('product-images', 'product-images', true);

-- Storage policies (apply after bucket is created)
-- create policy "Public product images are accessible"
--   on storage.objects for select
--   using (bucket_id = 'product-images');

-- create policy "Authenticated users can upload product images"
--   on storage.objects for insert
--   with check (
--     bucket_id = 'product-images' 
--     and auth.role() = 'authenticated'
--   );

-- create policy "Authenticated users can update product images"
--   on storage.objects for update
--   using (
--     bucket_id = 'product-images' 
--     and auth.role() = 'authenticated'
--   );

-- create policy "Authenticated users can delete product images"
--   on storage.objects for delete
--   using (
--     bucket_id = 'product-images' 
--     and auth.role() = 'authenticated'
--   );
