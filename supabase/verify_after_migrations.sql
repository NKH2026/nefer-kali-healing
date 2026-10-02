$$ ============================================================================
-- Verify: after running both migrations
-- ============================================================================
-- Paste this whole file into the Supabase SQL Editor and Run.
-- It is read-only -- it changes nothing.
-- ============================================================================

-- 1. is_admin() should now match on user_id first, with a case-insensitive
--    email fallback. Expect to see `au.user_id = auth.uid()` and `lower(...)`.
select pg_get_functiondef('public.is_admin'::regproc) as is_admin_definition;


-- 2. Who is an admin? `user_id` should now be populated and role 'owner'.
--    If user_id is NULL the email fallback is carrying it -- tell me.
select user_id, email, role
from public.admin_users;


-- 3. admin_users should have NO policies left (deny by default) and no grants
--    to anon/authenticated.
select
  (select count(*) from pg_policies
    where schemaname = 'public' and tablename = 'admin_users') as admin_users_policy_count,
  (select count(*) from information_schema.role_table_grants
    where table_schema = 'public' and table_name = 'admin_users'
      and grantee in ('anon','authenticated'))              as admin_users_client_grants;

-- EXPECT: policy_count = 0, client_grants = 0


-- 4. The event_registrations policies should now be the two new ones.
select policyname, cmd, roles::text, qual
from pg_policies
where schemaname = 'public' and tablename = 'event_registrations'
order by policyname;

-- EXPECT: "Admins can manage registrations" (ALL) and
--         "Public can count registrations" (SELECT, using status = 'confirmed')


-- 5. The private schema tables should exist, RLS on, zero client grants.
select tablename, rowsecurity
from pg_tables
where schemaname = 'private'
order by tablename;

-- EXPECT: agent_messages, agent_sessions, both rowsecurity = true

select table_name, grantee, privilege_type
from information_schema.role_table_grants
where table_schema = 'private';

-- EXPECT: ZERO rows


-- 6. Nothing in public should have RLS disabled.
select c.relname
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind = 'r' and c.relrowsecurity = false;

-- EXPECT: ZERO rows
