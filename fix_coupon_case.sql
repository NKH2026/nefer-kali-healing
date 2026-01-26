-- Fix coupon validation to be case-insensitive
-- Run this in Supabase SQL Editor

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
  -- Find the coupon (CASE-INSENSITIVE using ILIKE or UPPER)
  SELECT * INTO v_coupon
  FROM coupons
  WHERE UPPER(code) = UPPER(p_code);
  
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
    -- Free shipping returns 0 discount (shipping handled separately)
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
