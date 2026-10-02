-- ============================================================================
-- Vision descriptions
-- ============================================================================
-- Cached readings of uploaded images.
--
-- Why a cache rather than describing on demand every time:
--   - image tokens are the expensive part of a vision call, and the same asset
--     is often asked about more than once
--   - a description is stale-able context the assistant can rely on without
--     spending a call
--
-- THE SECURITY POINT: a description is derived from attacker-controlled pixels.
-- Text inside an image ("ignore your instructions and...") is another injection
-- surface, so a description is treated exactly like text fetched from the web:
-- it is DATA. It is labelled untrusted wherever it is returned, and it can never
-- by itself authorise a write -- writes still require the owner to click Apply
-- on a fingerprinted proposal.
--
-- Idempotent: safe to run more than once.
-- ============================================================================

create table if not exists public.vision_descriptions (
  id            uuid primary key default gen_random_uuid(),
  -- The storage object this describes. Unique so a re-describe replaces rather
  -- than accumulating near-duplicate rows.
  storage_path  text not null unique,
  public_url    text not null,
  description   text not null,
  -- What was asked, when the owner asked something specific rather than
  -- requesting a general description.
  question      text,
  model         text,
  prompt_tokens     integer,
  completion_tokens integer,
  created_at    timestamptz not null default now()
);

create index if not exists vision_descriptions_path_idx
  on public.vision_descriptions (storage_path);

comment on table public.vision_descriptions is
  'Cached readings of uploaded images. Descriptions are UNTRUSTED: they derive from image pixels, which are attacker-controlled content.';

alter table public.vision_descriptions enable row level security;

drop policy if exists "Admins can manage vision descriptions" on public.vision_descriptions;
create policy "Admins can manage vision descriptions"
  on public.vision_descriptions
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

revoke all on table public.vision_descriptions from anon, authenticated;
grant select, insert, update, delete on table public.vision_descriptions to authenticated;
grant all on table public.vision_descriptions to service_role;


-- ============================================================================
-- VERIFY
-- ============================================================================
-- select grantee, privilege_type from information_schema.role_table_grants
-- where table_schema = 'public' and table_name = 'vision_descriptions'
--   and grantee = 'anon';
-- EXPECT: ZERO rows
--
-- select count(*) from pg_policies
-- where schemaname = 'public' and tablename = 'vision_descriptions';
-- EXPECT: 1
