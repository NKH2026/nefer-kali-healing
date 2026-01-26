-- ============================================
-- INVENTORY TRACKING FUNCTION
-- Decrements inventory when orders are placed
-- Run this in Supabase SQL Editor
-- ============================================

-- Function to decrement inventory for a product variant
CREATE OR REPLACE FUNCTION decrement_inventory(
  p_product_id uuid,
  p_variant_id uuid,
  p_quantity integer DEFAULT 1
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- If variant_id is provided, decrement variant inventory
  IF p_variant_id IS NOT NULL THEN
    UPDATE product_variants
    SET 
      inventory_quantity = GREATEST(0, inventory_quantity - p_quantity),
      updated_at = now()
    WHERE id = p_variant_id;
  -- Otherwise, decrement product inventory (if tracking at product level)
  ELSIF p_product_id IS NOT NULL THEN
    UPDATE products
    SET 
      inventory_quantity = GREATEST(0, inventory_quantity - p_quantity),
      updated_at = now()
    WHERE id = p_product_id;
  END IF;
END;
$$;

-- Function to increment inventory (for refunds/cancellations)
CREATE OR REPLACE FUNCTION increment_inventory(
  p_product_id uuid,
  p_variant_id uuid,
  p_quantity integer DEFAULT 1
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- If variant_id is provided, increment variant inventory
  IF p_variant_id IS NOT NULL THEN
    UPDATE product_variants
    SET 
      inventory_quantity = inventory_quantity + p_quantity,
      updated_at = now()
    WHERE id = p_variant_id;
  -- Otherwise, increment product inventory
  ELSIF p_product_id IS NOT NULL THEN
    UPDATE products
    SET 
      inventory_quantity = inventory_quantity + p_quantity,
      updated_at = now()
    WHERE id = p_product_id;
  END IF;
END;
$$;

-- Function to check if product is in stock
CREATE OR REPLACE FUNCTION check_inventory(
  p_product_id uuid,
  p_variant_id uuid,
  p_quantity integer DEFAULT 1
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  available_qty integer;
  do_track boolean;
BEGIN
  -- Check variant first
  IF p_variant_id IS NOT NULL THEN
    SELECT pv.inventory_quantity, p.track_inventory
    INTO available_qty, do_track
    FROM product_variants pv
    JOIN products p ON p.id = pv.product_id
    WHERE pv.id = p_variant_id;
  -- Otherwise check product
  ELSIF p_product_id IS NOT NULL THEN
    SELECT inventory_quantity, track_inventory
    INTO available_qty, do_track
    FROM products
    WHERE id = p_product_id;
  ELSE
    RETURN true; -- No product/variant specified, assume in stock
  END IF;

  -- If not tracking inventory, always in stock
  IF do_track IS NULL OR do_track = false THEN
    RETURN true;
  END IF;

  -- Check if enough quantity available
  RETURN COALESCE(available_qty, 0) >= p_quantity;
END;
$$;

-- Grant execute permissions to authenticated users and service role
GRANT EXECUTE ON FUNCTION decrement_inventory(uuid, uuid, integer) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION increment_inventory(uuid, uuid, integer) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION check_inventory(uuid, uuid, integer) TO authenticated, service_role;

-- ============================================
-- SUCCESS! Inventory tracking is now active.
-- The webhook will automatically decrement
-- inventory when orders are placed.
-- ============================================
