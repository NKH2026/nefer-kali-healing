# Product Dashboard Setup Instructions

## 1. Create Database Tables in Supabase

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Click **+ New Query**
4. Copy and paste the contents of `product_schema.sql` into the editor
5. Click **Run** to execute the schema

This will create all necessary tables:
- `product_categories` (5 categories pre-populated)
- `products` (main products table with all features)
- `product_images` (multiple images per product)
- `product_variants` (for size/option variations)
- `back_in_stock_requests` (customer email capture)

## 2. Create Storage Bucket

1. In Supabase dashboard, go to **Storage**
2. Click **Create Bucket**
3. Name: `product-images`
4. Make it **Public**
5. Click **Create**

### Storage Policies

After creating the bucket, go to **Policies** and add these:

**SELECT (Public Access):**
```sql
create policy "Public product images are accessible"
  on storage.objects for select
  using (bucket_id = 'product-images');
```

**INSERT (Authenticated Only):**
```sql
create policy "Authenticated users can upload product images"
  on storage.objects for insert
  with check (
    bucket_id = 'product-images' 
    and auth.role() = 'authenticated'
  );
```

**UPDATE (Authenticated Only):**
```sql
create policy "Authenticated users can update product images"
  on storage.objects for update
  using (
    bucket_id = 'product-images' 
    and auth.role() = 'authenticated'
  );
```

**DELETE (Authenticated Only):**
```sql
create policy "Authenticated users can delete product images"
  on storage.objects for delete
  using (
    bucket_id = 'product-images' 
    and auth.role() = 'authenticated'
  );
```

## 3. Access the Product Dashboard

After setup is complete:

1. Log into your admin panel: `http://localhost:3000/admin/login`
2. Navigate to **Products** from the sidebar
3. Click **+ New Product** to create your first product

## Features Available

✅ **Product Management**
- Create, edit, and delete products
- Multiple image uploads
- Rich text descriptions
- Category assignment

✅ **Pricing & Sales**
- Regular pricing
- "On Sale" toggle with original price display
- Cost tracking for profit calculation

✅ **Inventory**
- SKU management
- Stock tracking
- Low stock alerts
- Backorder options

✅ **Pre-Orders**
- Pre-order toggle
- Custom release dates
- Pre-order messaging

✅ **Subscriptions**
- Per-product subscription options
- Configurable discounts
- Multiple frequency options (bi-weekly, monthly, quarterly)

✅ **Product Variants**
- Size options (2oz, 4oz, 8oz, etc.)
- Per-variant pricing and inventory
- (Variant UI coming in next update)

✅ **Additional Info**
- Ingredients
- Usage instructions
- Benefits
- Warnings & precautions

✅ **Customer Features**
- Back-in-stock email requests
- (Customer-facing product pages coming next)

## Need Help?

All product data is stored in your Supabase database with full Row Level Security (RLS) policies ensuring only authenticated admins can manage products while allowing public viewing of active products.
