-- ============================================
-- COUPON SYSTEM SCHEMA
-- Comprehensive discount code management
-- ============================================

-- Drop existing tables if any
DROP TABLE IF EXISTS coupon_redemptions CASCADE;
DROP TABLE IF EXISTS coupons CASCADE;

-- 1. COUPONS TABLE
CREATE TABLE coupons (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  -- Coupon Identification
  code TEXT UNIQUE NOT NULL,           -- Coupon code (case-sensitive, e.g., "NEWYEAR25")
  name TEXT NOT NULL,                  -- Internal name for admin reference
  description TEXT,                    -- Optional description for internal use
  
  -- Discount Configuration
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed_amount', 'free_shipping', 'buy_x_get_y')),
  discount_value NUMERIC(10, 2),       -- Percentage (0-100) or dollar amount
  
  -- Buy X Get Y Configuration (optional, for future use)
  buy_quantity INTEGER,                -- Number of items to purchase
  get_quantity INTEGER,                -- Number of items to get free
  
  -- Applicability Rules
  applies_to TEXT NOT NULL DEFAULT 'all' CHECK (applies_to IN ('all', 'specific_products', 'specific_categories')),
  product_ids UUID[],                  -- Array of product IDs (if specific_products)
  category_names TEXT[],               -- Array of category names (if specific_categories)
  minimum_purchase NUMERIC(10, 2),     -- Minimum order value to apply coupon
  
  -- Validity Period
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  
  -- Usage Limits
  usage_limit INTEGER,                 -- Total number of times coupon can be used (NULL = unlimited)
  usage_limit_per_customer INTEGER DEFAULT 1,    -- Max uses per customer
  current_usage INTEGER DEFAULT 0,     -- Track total redemptions
  
  -- Status
  is_active BOOLEAN DEFAULT true,      -- Can be toggled on/off without deleting
  
  -- Metadata
  created_by TEXT,                     -- Admin user who created it
  notes TEXT                           -- Internal notes
);

-- Enable RLS
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;

-- Public can view active, valid coupons for validation
CREATE POLICY "Public can view active coupons" 
  ON coupons FOR SELECT 
  USING (is_active = true);

-- Admins can manage all coupons
CREATE POLICY "Admins can manage coupons" 
  ON coupons FOR ALL 
  USING (auth.role() = 'authenticated');

-- Indexes for performance
CREATE INDEX coupons_code_idx ON coupons(code);
CREATE INDEX coupons_is_active_idx ON coupons(is_active);
CREATE INDEX coupons_dates_idx ON coupons(start_date, end_date);

-- 2. COUPON REDEMPTIONS TABLE
CREATE TABLE coupon_redemptions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  -- Redemption Details
  coupon_id UUID REFERENCES coupons(id) ON DELETE CASCADE NOT NULL,
  customer_email TEXT,                 -- Track who used it (for usage limits)
  customer_ip TEXT,                    -- Additional tracking
  order_id TEXT,                       -- Reference to order (when checkout is implemented)
  
  -- Discount Applied
  discount_amount NUMERIC(10, 2) NOT NULL,  -- Actual dollar amount saved
  order_total NUMERIC(10, 2),          -- Original order total before discount
  final_total NUMERIC(10, 2),          -- Final total after discount
  
  -- Products in Order
  product_ids UUID[],                  -- Products in the order
  
  -- Metadata
  redeemed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE coupon_redemptions ENABLE ROW LEVEL SECURITY;

-- Anyone can record a redemption (when applying coupon)
CREATE POLICY "Anyone can create redemptions" 
  ON coupon_redemptions FOR INSERT 
  WITH CHECK (true);

-- Admins can view all redemptions
CREATE POLICY "Admins can view redemptions" 
  ON coupon_redemptions FOR SELECT 
  USING (auth.role() = 'authenticated');

-- Indexes for analytics
CREATE INDEX redemptions_coupon_id_idx ON coupon_redemptions(coupon_id);
CREATE INDEX redemptions_customer_email_idx ON coupon_redemptions(customer_email);
CREATE INDEX redemptions_date_idx ON coupon_redemptions(redeemed_at);

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to increment coupon usage count
CREATE OR REPLACE FUNCTION increment_coupon_usage()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE coupons 
  SET current_usage = current_usage + 1,
      updated_at = NOW()
  WHERE id = NEW.coupon_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-increment usage on redemption
CREATE TRIGGER increment_usage_on_redemption
  AFTER INSERT ON coupon_redemptions
  FOR EACH ROW
  EXECUTE FUNCTION increment_coupon_usage();

-- Function to validate coupon
CREATE OR REPLACE FUNCTION validate_coupon(
  p_code TEXT,
  p_order_total NUMERIC,
  p_product_ids UUID[],
  p_customer_email TEXT DEFAULT NULL
)
RETURNS TABLE (
  is_valid BOOLEAN,
  error_message TEXT,
  coupon_id UUID,
  discount_type TEXT,
  discount_value NUMERIC,
  discount_amount NUMERIC
) AS $$
DECLARE
  v_coupon RECORD;
  v_customer_usage INTEGER;
  v_calculated_discount NUMERIC;
BEGIN
  -- Find the coupon
  SELECT * INTO v_coupon
  FROM coupons
  WHERE code = p_code;
  
  -- Check if coupon exists
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Invalid coupon code', NULL::UUID, NULL::TEXT, NULL::NUMERIC, NULL::NUMERIC;
    RETURN;
  END IF;
  
  -- Check if active
  IF NOT v_coupon.is_active THEN
    RETURN QUERY SELECT false, 'This coupon is no longer active', NULL::UUID, NULL::TEXT, NULL::NUMERIC, NULL::NUMERIC;
    RETURN;
  END IF;
  
  -- Check validity dates
  IF v_coupon.start_date IS NOT NULL AND NOW() < v_coupon.start_date THEN
    RETURN QUERY SELECT false, 'Coupon is not yet active', NULL::UUID, NULL::TEXT, NULL::NUMERIC, NULL::NUMERIC;
    RETURN;
  END IF;
  
  IF v_coupon.end_date IS NOT NULL AND NOW() > v_coupon.end_date THEN
    RETURN QUERY SELECT false, 'Coupon has expired', NULL::UUID, NULL::TEXT, NULL::NUMERIC, NULL::NUMERIC;
    RETURN;
  END IF;
  
  -- Check total usage limit
  IF v_coupon.usage_limit IS NOT NULL AND v_coupon.current_usage >= v_coupon.usage_limit THEN
    RETURN QUERY SELECT false, 'Coupon usage limit has been reached', NULL::UUID, NULL::TEXT, NULL::NUMERIC, NULL::NUMERIC;
    RETURN;
  END IF;
  
  -- Check per-customer usage limit
  IF p_customer_email IS NOT NULL AND v_coupon.usage_limit_per_customer IS NOT NULL THEN
    SELECT COUNT(*) INTO v_customer_usage
    FROM coupon_redemptions
    WHERE coupon_id = v_coupon.id AND customer_email = p_customer_email;
    
    IF v_customer_usage >= v_coupon.usage_limit_per_customer THEN
      RETURN QUERY SELECT false, 'You have already used this coupon', NULL::UUID, NULL::TEXT, NULL::NUMERIC, NULL::NUMERIC;
      RETURN;
    END IF;
  END IF;
  
  -- Check minimum purchase
  IF v_coupon.minimum_purchase IS NOT NULL AND p_order_total < v_coupon.minimum_purchase THEN
    RETURN QUERY SELECT false, 
      'Minimum purchase of $' || v_coupon.minimum_purchase || ' required', 
      NULL::UUID, NULL::TEXT, NULL::NUMERIC, NULL::NUMERIC;
    RETURN;
  END IF;
  
  -- Calculate discount amount
  IF v_coupon.discount_type = 'percentage' THEN
    v_calculated_discount := (p_order_total * v_coupon.discount_value / 100);
  ELSIF v_coupon.discount_type = 'fixed_amount' THEN
    v_calculated_discount := LEAST(v_coupon.discount_value, p_order_total);
  ELSIF v_coupon.discount_type = 'free_shipping' THEN
    -- For now, free shipping returns 0, can be enhanced later
    v_calculated_discount := 0;
  ELSE
    v_calculated_discount := 0;
  END IF;
  
  -- Return valid result
  RETURN QUERY SELECT 
    true, 
    NULL::TEXT, 
    v_coupon.id, 
    v_coupon.discount_type, 
    v_coupon.discount_value,
    ROUND(v_calculated_discount, 2);
END;
$$ LANGUAGE plpgsql;
