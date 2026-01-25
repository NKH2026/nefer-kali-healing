-- ============================================
-- CHECKOUT & SHIPPING SYSTEM SCHEMA
-- Orders, Subscriptions, and Shipments
-- Nefer Kali Healing (EIN: 99-3021724)
-- ============================================

-- Drop existing tables (CASCADE will remove dependent objects)
DROP TABLE IF EXISTS subscription_items CASCADE;
DROP TABLE IF EXISTS subscriptions CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;

-- ============================================
-- 1. ORDERS TABLE
-- ============================================
create table orders (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- Order Number (human readable)
  order_number text unique not null,
  
  -- Stripe Integration
  stripe_checkout_session_id text unique,
  stripe_payment_intent_id text,
  stripe_customer_id text,
  
  -- Order Status
  status text default 'pending' check (status in ('pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded')),
  payment_status text default 'pending' check (payment_status in ('pending', 'paid', 'failed', 'refunded')),
  
  -- Customer Info
  customer_email text not null,
  customer_name text not null,
  customer_phone text,
  
  -- Shipping Address
  shipping_address_line1 text,
  shipping_address_line2 text,
  shipping_city text,
  shipping_state text,
  shipping_postal_code text,
  shipping_country text default 'US',
  
  -- Pricing
  subtotal numeric(10, 2) not null,
  shipping_cost numeric(10, 2) default 0,
  discount_amount numeric(10, 2) default 0,
  total numeric(10, 2) not null,
  
  -- Coupon
  coupon_code text,
  coupon_id uuid references coupons(id) on delete set null,
  
  -- Subscription Order
  is_subscription_order boolean default false,
  subscription_id uuid,
  
  -- Shippo Integration
  shippo_shipment_id text,
  shippo_transaction_id text,
  tracking_number text,
  tracking_url text,
  shipping_label_url text,
  shipping_carrier text default 'USPS',
  shipping_service text,
  estimated_delivery_date date,
  shipped_at timestamp with time zone,
  delivered_at timestamp with time zone,
  
  -- Non-profit Receipt
  receipt_sent boolean default false,
  receipt_sent_at timestamp with time zone,
  
  -- Notes
  customer_notes text,
  internal_notes text
);

-- Enable RLS
alter table orders enable row level security;

-- Customers can view their own orders
create policy "Customers can view own orders"
  on orders for select
  using (customer_email = auth.jwt()->>'email');

-- Admins can manage all orders
create policy "Admins can manage orders"
  on orders for all
  using (auth.role() = 'authenticated');

-- Indexes
create index orders_email_idx on orders(customer_email);
create index orders_status_idx on orders(status);
create index orders_created_idx on orders(created_at desc);
create index orders_stripe_session_idx on orders(stripe_checkout_session_id);

-- ============================================
-- 2. ORDER ITEMS TABLE
-- ============================================
create table order_items (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  order_id uuid references orders(id) on delete cascade not null,
  
  -- Product Reference
  product_id uuid references products(id) on delete set null,
  variant_id uuid references product_variants(id) on delete set null,
  
  -- Snapshot at time of purchase (prices can change)
  product_title text not null,
  variant_title text,
  sku text,
  image_url text,
  
  -- Quantity & Pricing
  quantity integer not null default 1,
  unit_price numeric(10, 2) not null,
  total_price numeric(10, 2) not null,
  
  -- Subscription info
  is_subscription boolean default false,
  subscription_frequency text
);

-- Enable RLS
alter table order_items enable row level security;

-- Customers can view their own order items
create policy "Customers can view own order items"
  on order_items for select
  using (
    exists (
      select 1 from orders
      where orders.id = order_items.order_id
      and orders.customer_email = auth.jwt()->>'email'
    )
  );

-- Admins can manage all order items
create policy "Admins can manage order items"
  on order_items for all
  using (auth.role() = 'authenticated');

-- Index
create index order_items_order_idx on order_items(order_id);

-- ============================================
-- 3. SUBSCRIPTIONS TABLE
-- ============================================
create table subscriptions (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- Stripe Subscription
  stripe_subscription_id text unique not null,
  stripe_customer_id text not null,
  
  -- Customer Info
  customer_email text not null,
  customer_name text not null,
  
  -- Shipping Address
  shipping_address_line1 text,
  shipping_address_line2 text,
  shipping_city text,
  shipping_state text,
  shipping_postal_code text,
  shipping_country text default 'US',
  
  -- Status
  status text default 'active' check (status in ('active', 'paused', 'cancelled', 'past_due')),
  paused_at timestamp with time zone,
  resumed_at timestamp with time zone,
  
  -- Billing
  billing_interval text not null, -- 'every-2-weeks', 'monthly', 'every-3-months'
  next_billing_date timestamp with time zone,
  
  -- Pricing
  recurring_amount numeric(10, 2) not null,
  discount_percent numeric(5, 2) default 0,
  
  -- Cancellation
  cancelled_at timestamp with time zone,
  cancellation_reason text
);

-- Enable RLS
alter table subscriptions enable row level security;

-- Customers can view their own subscriptions
create policy "Customers can view own subscriptions"
  on subscriptions for select
  using (customer_email = auth.jwt()->>'email');

-- Admins can manage all subscriptions
create policy "Admins can manage subscriptions"
  on subscriptions for all
  using (auth.role() = 'authenticated');

-- Add foreign key constraint after table created
alter table orders add constraint orders_subscription_fk 
  foreign key (subscription_id) references subscriptions(id) on delete set null;

-- Indexes
create index subscriptions_email_idx on subscriptions(customer_email);
create index subscriptions_status_idx on subscriptions(status);
create index subscriptions_stripe_idx on subscriptions(stripe_subscription_id);

-- ============================================
-- 4. SUBSCRIPTION ITEMS TABLE
-- ============================================
create table subscription_items (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  subscription_id uuid references subscriptions(id) on delete cascade not null,
  
  -- Product Reference
  product_id uuid references products(id) on delete set null not null,
  variant_id uuid references product_variants(id) on delete set null,
  
  -- Details
  quantity integer default 1,
  unit_price numeric(10, 2) not null
);

-- Enable RLS
alter table subscription_items enable row level security;

-- Customers can view their own subscription items
create policy "Customers can view own subscription items"
  on subscription_items for select
  using (
    exists (
      select 1 from subscriptions
      where subscriptions.id = subscription_items.subscription_id
      and subscriptions.customer_email = auth.jwt()->>'email'
    )
  );

-- Admins can manage subscription items
create policy "Admins can manage subscription items"
  on subscription_items for all
  using (auth.role() = 'authenticated');

-- Index
create index subscription_items_sub_idx on subscription_items(subscription_id);

-- ============================================
-- HELPER FUNCTION: Generate Order Number
-- ============================================
create or replace function generate_order_number()
returns text as $$
declare
  new_number text;
  year_prefix text;
begin
  year_prefix := to_char(current_date, 'YY');
  -- Generate format: NKH-YY-XXXXX (e.g., NKH-26-00001)
  select 'NKH-' || year_prefix || '-' || lpad(
    (coalesce(
      (select max(substring(order_number from 8)::integer) 
       from orders 
       where order_number like 'NKH-' || year_prefix || '-%'),
      0
    ) + 1)::text, 
    5, '0'
  ) into new_number;
  return new_number;
end;
$$ language plpgsql;

-- ============================================
-- TRIGGER: Auto-generate order number
-- ============================================
create or replace function set_order_number()
returns trigger as $$
begin
  if new.order_number is null then
    new.order_number := generate_order_number();
  end if;
  return new;
end;
$$ language plpgsql;

create trigger order_number_trigger
  before insert on orders
  for each row
  execute function set_order_number();

-- ============================================
-- TRIGGER: Auto-update updated_at
-- ============================================
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

create trigger orders_updated_at
  before update on orders
  for each row
  execute function update_updated_at();

create trigger subscriptions_updated_at
  before update on subscriptions
  for each row
  execute function update_updated_at();
