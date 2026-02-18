-- ============================================
-- FIX: Inventory Decrement Function
-- Run this in the Supabase SQL Editor
-- ============================================

-- Create the decrement_inventory RPC function
-- Called by the stripe-webhook after a successful checkout
create or replace function decrement_inventory(
  p_product_id uuid,
  p_variant_id uuid,
  p_quantity integer
)
returns void as $$
begin
  -- If a variant_id is provided, decrement the variant's inventory
  if p_variant_id is not null then
    update product_variants
    set inventory_quantity = greatest(0, inventory_quantity - p_quantity)
    where id = p_variant_id;
  end if;

  -- Always decrement the parent product's inventory
  update products
  set inventory_quantity = greatest(0, inventory_quantity - p_quantity)
  where id = p_product_id
    and track_inventory = true;
end;
$$ language plpgsql security definer;
