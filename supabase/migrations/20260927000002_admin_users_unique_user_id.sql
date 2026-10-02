-- ============================================================================
-- admin_users: add uniqueness on user_id
-- ============================================================================
-- Why: is_admin() matches on user_id first, but that column was created by the
-- hardening migration as a plain `uuid` with NO unique constraint. Without one,
-- admin_users can accumulate duplicate rows for the same person, and the
-- `on conflict (user_id)` upsert fails with:
--   ERROR: 42P10: there is no unique or exclusion constraint matching the
--   ON CONFLICT specification
--
-- This migration is idempotent -- safe to run more than once.
-- Run the whole file in the Supabase SQL Editor.
-- ============================================================================


-- ---------------------------------------------------------------------------
-- STEP 1 -- Inspect first. Run just this, and look at the output.
-- ---------------------------------------------------------------------------
select conname, contype, pg_get_constraintdef(oid) as definition
from pg_constraint
where conrelid = 'public.admin_users'::regclass
order by conname;

select user_id, email, role, created_at
from public.admin_users
order by created_at;


-- ---------------------------------------------------------------------------
-- STEP 2 -- Remove duplicates, keeping the oldest row per user.
--
-- Harmless when there are none. Only touches rows where user_id is NOT NULL,
-- so an email-only legacy row is left alone.
-- ---------------------------------------------------------------------------
delete from public.admin_users au
where au.user_id is not null
  and exists (
    select 1
    from public.admin_users older
    where older.user_id = au.user_id
      and older.created_at < au.created_at
  );


-- ---------------------------------------------------------------------------
-- STEP 3 -- Add the unique constraint.
--
-- Guarded so re-running does not error with "constraint already exists".
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.admin_users'::regclass
      and contype = 'u'
      and pg_get_constraintdef(oid) = 'UNIQUE (user_id)'
  ) then
    alter table public.admin_users
      add constraint admin_users_user_id_key unique (user_id);
  end if;
end $$;

-- Note: the constraint allows MULTIPLE NULL user_id values, which is correct --
-- Postgres treats NULLs as distinct. Rows with a NULL user_id are legacy
-- email-keyed rows that is_admin() matches via its email fallback.


-- ---------------------------------------------------------------------------
-- STEP 4 -- Confirm the constraint exists.
-- ---------------------------------------------------------------------------
select conname, contype, pg_get_constraintdef(oid) as definition
from pg_constraint
where conrelid = 'public.admin_users'::regclass
  and contype in ('u', 'p')
order by conname;

-- EXPECT: a row with definition "UNIQUE (user_id)"


-- ============================================================================
-- STEP 5 -- NOW the upsert works. Adds both accounts as owners.
-- ============================================================================
insert into public.admin_users (user_id, email, role)
select id, email, 'owner'
from auth.users
where email in ('mastrianni11@gmail.com', 'info@neferkalihealing.org')
on conflict (user_id) do update
  set email = excluded.email,
      role  = excluded.role;


-- ---------------------------------------------------------------------------
-- STEP 6 -- Verify both admins are present and linked.
-- ---------------------------------------------------------------------------
select user_id, email, role
from public.admin_users
order by email;

-- EXPECT: two rows, both with a non-null user_id and role 'owner'.


-- ============================================================================
-- FINAL CHECK -- this is the real test
-- ============================================================================
-- is_admin() must return true for the signed-in admin. Run this in the SQL
-- editor while signed in to the admin panel:
--
--   select public.is_admin();
--
-- But note: the SQL editor runs as `postgres`, not as your JWT, so auth.uid()
-- is NULL there and this will return false. That is expected and does NOT
-- indicate a problem.
--
-- The real verification is the assistant itself: reload /admin/assistant and
-- ask "How is the shop doing right now?" A 403 means the row is still not
-- matching; a real answer means it works.
