-- ============================================================================
-- Generated images
-- ============================================================================
-- A record of images the assistant generated, so a generation is reproducible
-- and attributable rather than a file appearing in a bucket from nowhere.
--
-- The generated file itself lives in the site-assets bucket and is recorded in
-- admin_uploads like any other asset, so list_assets finds it and it can be used
-- in a blog cover or page edit with no special handling.
--
-- Idempotent: safe to run more than once.
-- ============================================================================

-- The link to admin_uploads is added separately and only when that table exists.
-- A foreign key declared inline would make this migration fail outright on a
-- database where 000006 has not been applied yet, which is a real ordering
-- hazard when these are run by hand rather than by `supabase db push`.
create table if not exists public.image_generations (
  id             uuid primary key default gen_random_uuid(),
  prompt         text not null,
  -- The model and settings actually used, since output is not reproducible
  -- across models or quality levels.
  model          text not null,
  size           text,
  quality        text,
  output_format  text,
  -- Links to the stored file.
  upload_id      uuid,
  public_url     text,
  -- Provenance for the audit trail.
  requested_by   uuid,
  created_at     timestamptz not null default now()
);

do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'admin_uploads'
  ) and not exists (
    select 1 from pg_constraint
    where conrelid = 'public.image_generations'::regclass
      and conname = 'image_generations_upload_id_fkey'
  ) then
    alter table public.image_generations
      add constraint image_generations_upload_id_fkey
      foreign key (upload_id) references public.admin_uploads(id) on delete set null;
  end if;
end $$;

create index if not exists image_generations_created_idx
  on public.image_generations (created_at desc);

comment on table public.image_generations is
  'Images generated via the OpenAI Image API. The file is stored in site-assets and recorded in admin_uploads.';

alter table public.image_generations enable row level security;

drop policy if exists "Admins can manage image generations" on public.image_generations;
create policy "Admins can manage image generations"
  on public.image_generations
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

revoke all on table public.image_generations from anon, authenticated;
grant select, insert, update, delete on table public.image_generations to authenticated;
grant all on table public.image_generations to service_role;


-- ============================================================================
-- VERIFY
-- ============================================================================
-- select grantee, privilege_type from information_schema.role_table_grants
-- where table_schema = 'public' and table_name = 'image_generations'
--   and grantee = 'anon';
-- EXPECT: ZERO rows
