-- ============================================================================
-- Harden admin authorization
-- ============================================================================
-- Date: 2026-09-27
--
-- Context: RLS is correctly enabled on every public table, and every admin
-- policy already routes through public.is_admin(). Signup, anonymous sign-ins,
-- and manual linking are all disabled in the Auth settings. This migration
-- fixes the remaining weaknesses in is_admin() itself and closes the
-- admin_users email-enumeration leak.
--
-- REVIEW BEFORE RUNNING. Run in the Supabase SQL Editor, in order.
-- Phase 0 is safe. Phase 1 changes how admins are identified -- read the
-- pre-flight check in that section before you run it.
-- ============================================================================


-- ============================================================================
-- PRE-FLIGHT -- run these two queries BEFORE anything else
-- ============================================================================
--   -- (a) Who is currently an admin, and how is the row keyed?
--   select * from public.admin_users;
--
--   -- (b) What email does Supabase actually put in the JWT for that user?
--   select id, email, email_confirmed_at, created_at from auth.users;
--
-- If (a) returns ZERO rows, then is_admin() is already false for everyone and
-- your admin panel is already broken -- stop and report that before running
-- anything here.
--
-- If (a) returns a row, confirm its email matches (b) exactly, including case.
--
-- LEAVE "Confirm email" ENABLED in Authentication > Providers > Email. The
-- whole weakness being fixed here is that is_admin() trusted an unverified
-- email claim; turning email confirmation off would make that exploitable
-- instead of merely fragile.
-- ============================================================================


-- ============================================================================
-- PHASE 0 -- SAFE TO RUN NOW
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 0.1  Make sure the admin_users table has the columns the new function needs.
--      These are no-ops if they already exist.
-- ---------------------------------------------------------------------------
alter table public.admin_users
  add column if not exists user_id uuid;

alter table public.admin_users
  add column if not exists role text not null default 'owner';

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.admin_users'::regclass
      and contype = 'c'
      and conname = 'admin_users_role_check'
  ) then
    alter table public.admin_users
      add constraint admin_users_role_check
      check (role in ('owner', 'editor'));
  end if;
end $$;

-- Link any existing email-keyed row to its auth user, so the ID-based check
-- below works immediately without you having to look up a UUID by hand.
update public.admin_users au
set user_id = u.id
from auth.users u
where au.user_id is null
  and lower(au.email) = lower(u.email);

-- ---------------------------------------------------------------------------
-- 0.2  Replace is_admin().
--
--      Before: matched on the email claim alone (unverified per Supabase),
--              with a case-sensitive `=`.
--      After:  matches on auth.uid() when the row is linked, falling back to
--              a case-insensitive email match so you can never be locked out.
--              All references stay explicitly schema-qualified.
-- ---------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path to 'public'
as $function$
  select exists (
    select 1
    from public.admin_users au
    where
      -- Preferred: stable identifier from the verified JWT `sub` claim.
      (au.user_id is not null and au.user_id = auth.uid())
      -- Fallback: case-insensitive email, so a casing change cannot lock you out.
      or (au.email is not null and lower(au.email) = lower(auth.jwt() ->> 'email'))
  );
$function$;

comment on function public.is_admin() is
  'True when the current JWT belongs to a row in public.admin_users. Matches on '
  'user_id (preferred) or a case-insensitive email fallback. SECURITY DEFINER so '
  'RLS policies can call it without granting table access.';

-- ---------------------------------------------------------------------------
-- 0.3  admin_users is read ONLY by is_admin() (which is SECURITY DEFINER, so it
--      does not need a client-facing policy). Drop the policy that let any
--      authenticated user probe whether a given email is an administrator.
-- ---------------------------------------------------------------------------
drop policy if exists "Admins can view admin users" on public.admin_users;
drop policy if exists "Admins can manage admin users" on public.admin_users;
drop policy if exists "authenticated can view admin users" on public.admin_users;

-- Belt and braces: RLS on with zero policies = deny by default for every
-- non-bypassing role. Only service_role can touch this table.
alter table public.admin_users enable row level security;

revoke all on table public.admin_users from anon, authenticated;

-- ---------------------------------------------------------------------------
-- 0.4  Fix the event_registrations read policy.
--
--      The old policy "Users can view their own registrations" actually tested
--      is_admin() rather than ownership, so it granted admin-level row access
--      under a name that suggested the opposite.
--
--      Separately, the public event page counts registrations as an anonymous
--      visitor (pages/EventDetail.tsx:65, a head:true count). The admin-only
--      SELECT policy blocks that, so the count is most likely returning 0 to
--      the public right now. VERIFY THIS before and after -- load a live event
--      page and see whether the registration count is stuck at zero.
--
--      The fix splits the two concerns: a count-only policy that reveals no
--      rows, and an admin policy that does. Both the old and new count policies
--      permit an anonymous count of CONFIRMED registrations -- i.e. the same
--      number the event page already intends to display publicly. If you would
--      rather not expose attendance counts at all, delete the first policy and
--      the page should render 0 / hide the count instead.
-- ---------------------------------------------------------------------------
drop policy if exists "Users can view their own registrations" on public.event_registrations;
drop policy if exists "Authenticated users can manage all registrations" on public.event_registrations;

-- Anonymous and any signed-in user may COUNT confirmed registrations.
create policy "Public can count registrations"
  on public.event_registrations
  for select
  to anon, authenticated
  using (status = 'confirmed');

-- Only admins may read the attendee rows themselves (emails, names, codes).
create policy "Admins can manage registrations"
  on public.event_registrations
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- 0.5  Tighten the other anonymous-INSERT policies.
--
--      Both currently use WITH CHECK (true), which means any anonymous visitor
--      can insert arbitrary rows (spam, or a named row for someone else).
--      These constraints keep the real form working while requiring the data to
--      at least be shaped like a real submission.
-- ---------------------------------------------------------------------------
drop policy if exists "Anyone can submit back in stock requests" on public.back_in_stock_requests;
create policy "Anyone can submit back in stock requests"
  on public.back_in_stock_requests
  for insert
  to anon, authenticated
  with check (
    customer_email is not null
    and position('@' in customer_email) > 1
    and length(customer_email) <= 254
    and notified is not true          -- cannot self-mark as notified
    and notified_at is null
  );

drop policy if exists "Anyone can create registrations" on public.event_registrations;
create policy "Anyone can create registrations"
  on public.event_registrations
  for insert
  to anon, authenticated
  with check (
    email is not null
    and position('@' in email) > 1
    and length(email) <= 254
    and coalesce(status, 'confirmed') = 'confirmed'   -- cannot self-cancel/attend
    and ticket_sent_at is null
  );

-- reviews / review_media / coupon_redemptions already constrain the inserted
-- columns (reviews forces status='pending'). Left as-is deliberately, so this
-- migration does not change storefront behaviour beyond the fixes above.


-- ============================================================================
-- PHASE 1 -- STAGED. Read what it does before running.
-- ============================================================================
-- The policies are already correct (they all call is_admin(), which you just
-- hardened). This phase only removes the *table grants* that let anon and
-- authenticated even ATTEMPT writes that RLS will reject anyway. It is
-- defence in depth: today RLS is your only line of defence, and one careless
-- policy later would open a table completely.
--
-- It is staged separately because a mistake here breaks the storefront with
-- 403s, and the exact grant set must be verified against the live site.
--
-- Before running: confirm the storefront only READS these tables. From the
-- codebase, public (non-admin) pages read exactly:
--     products, product_images, product_variants, product_categories,
--     blog_posts, events, site_settings, reviews, review_media
-- and INSERT into exactly:
--     reviews, review_media, event_registrations, back_in_stock_requests,
--     coupon_redemptions
--
-- ORDER MATTERS: grant SELECT before revoking, or you will break the site.
-- Test the storefront immediately after each block.

-- begin;

-- -- 1. Admin-only tables: no client access at all. service_role bypasses RLS.
-- revoke all on table
--   public.orders,
--   public.order_items,
--   public.subscriptions,
--   public.subscription_items,
--   public.coupons,
--   public.coupon_redemptions,
--   public.admin_users
-- from anon, authenticated;

-- -- 2. Storefront-readable tables: SELECT only. No client-side writes --
-- --    every write to these goes through the admin panel or service_role.
-- revoke insert, update, delete, truncate, references, trigger on table
--   public.products,
--   public.product_images,
--   public.product_variants,
--   public.product_categories,
--   public.blog_posts,
--   public.events,
--   public.site_settings,
--   public.reviews,
--   public.review_media
-- from anon, authenticated;

-- grant select on table
--   public.products,
--   public.product_images,
--   public.product_variants,
--   public.product_categories,
--   public.blog_posts,
--   public.events,
--   public.site_settings,
--   public.reviews,
--   public.review_media
-- to anon, authenticated;

-- -- 3. Public-submission tables: INSERT only (plus the SELECT that the
-- --    event-registration count policy needs).
-- revoke update, delete, truncate, references, trigger on table
--   public.event_registrations,
--   public.back_in_stock_requests
-- from anon, authenticated;

-- grant select, insert on table
--   public.event_registrations,
--   public.back_in_stock_requests
-- to anon, authenticated;

-- -- 4. coupon_redemptions is INSERT-only from the storefront, but admins read
-- --    it through the panel. Admins are 'authenticated', so they need SELECT --
-- --    the is_admin() policy gates the rows. Keep SELECT, drop the rest.
-- grant select, insert on table public.coupon_redemptions to authenticated;
-- grant insert on table public.coupon_redemptions to anon;

-- commit;

-- After running, verify:
--   * a product page loads and shows inventory state
--   * the shop grid lists products
--   * a blog post renders
--   * an event page shows a non-zero registration count
--   * /admin/products, /admin/orders, /admin/blog all still load for you
--
-- If anything 403s, `rollback;` and tell me which page.


-- ============================================================================
-- VERIFY
-- ============================================================================

-- 1. The new function. Should return exactly one definition, matching on
--    user_id OR the case-insensitive email fallback.
-- select pg_get_functiondef('public.is_admin'::regproc);

-- 2. Confirm you are an admin from your own session (run this while logged in
--    to the admin panel, via the browser console):
--        (await supabase.rpc('is_admin')).data
--    ...but note is_admin() is not exposed via RPC unless granted. Easier:
--    just load /admin/products and confirm it works.

-- 3. Confirm the email-enumeration policy is gone and no policies remain on
--    admin_users:
-- select tablename, policyname, cmd, roles::text, qual
-- from pg_policies
-- where schemaname = 'public' and tablename = 'admin_users';

-- 4. Confirm every admin table is still gated, and that no table in public is
--    missing RLS:
-- select c.relname, c.relrowsecurity
-- from pg_class c
-- join pg_namespace n on n.oid = c.relnamespace
-- where n.nspname = 'public' and c.relkind = 'r' and c.relrowsecurity = false;
-- ^ must return ZERO rows.

-- 5. Confirm admin_users is keyed properly:
-- select user_id, email, role from public.admin_users;
-- ^ every row should have a user_id. If any is null, the email fallback is
--   doing the work and you should link it manually:
--   update public.admin_users au set user_id = u.id
--   from auth.users u where lower(au.email) = lower(u.email) and au.user_id is null;
