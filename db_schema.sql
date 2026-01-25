-- Enable UUID extension if not already enabled
create extension if not exists "uuid-ossp";

-- 1. REVIEWS TABLE
create table reviews (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  product_id text not null, -- Can be a slug or ID from your shop constants
  reviewer_name text not null,
  rating integer check (rating >= 1 and rating <= 5) not null,
  comment text,
  is_approved boolean default false -- Reviews won't show until you approve them
);

-- Enable Row Level Security (RLS)
alter table reviews enable row level security;

-- Policy: Everyone can read approved reviews
create policy "Public reviews are viewable by everyone" 
  on reviews for select 
  using ( is_approved = true );

-- Policy: Anyone can insert a review (authenticated or anon)
create policy "Anyone can insert a review" 
  on reviews for insert 
  with check ( true );

-- 1.5 PRODUCTS TABLE
create table products (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  title text not null,
  type text not null, -- 'Product', 'Event', 'Workshop'
  description text,
  price text, -- e.g. '$20.00' or 'Contact Us'
  image_url text,
  rating numeric default 5.0,
  reviews_count integer default 0
);

-- Enable RLS
alter table products enable row level security;

-- Policy: Everyone can read products
create policy "Public products are viewable by everyone" 
  on products for select 
  using ( true );

-- 2. BLOG POSTS TABLE (Wisdom Vault)
create table blog_posts (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  title text not null,
  slug text unique not null, -- For URLs like /wisdom/my-post-title
  excerpt text,
  content text, -- Markdown or HTML content
  cover_image_url text, -- Link to image in Supabase Storage
  category text default 'Astrology', -- e.g. Astrology, Womb Health, Holistic Healing, Spirituality
  published boolean default false,
  author text default 'Y''Marii Shango BunMi'
);

-- Enable RLS
alter table blog_posts enable row level security;

-- Policy: Everyone can read published posts
create policy "Public posts are viewable by everyone" 
  on blog_posts for select 
  using ( published = true );

-- Policy: Only authenticated users (Admins) can insert/update/delete
-- Note: You'll need to create an admin user in Authentication -> Users to use this effectively
create policy "Admins can manage posts" 
  on blog_posts for all 
  using ( auth.role() = 'authenticated' );

-- 3. STORAGE SETUP (For Images)
-- You will need to create a bucket named 'blog-images' in the Storage tab manually.
