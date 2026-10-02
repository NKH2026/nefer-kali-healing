-- ============================================================================
-- Uploaded assets
-- ============================================================================
-- Files the owner attaches in the chat -- product photos, logos, screenshots --
-- stored so the assistant can reference them and the site can use them.
--
-- IMPORTANT: this is Option A. The assistant learns that a file EXISTS and gets
-- its URL and dimensions. It does NOT read file contents. Nothing here gives the
-- model the ability to interpret an image.
--
-- Idempotent: safe to run more than once.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Storage bucket.
--
-- Public read, because these are website assets that need to be servable by URL.
-- Writes are admin-only via the policy below.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('site-assets', 'site-assets', true)
on conflict (id) do update set public = true;

-- Storage policies: anyone may read, only admins may write or delete.
drop policy if exists "Site assets are publicly readable" on storage.objects;
create policy "Site assets are publicly readable"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'site-assets');

drop policy if exists "Admins can upload site assets" on storage.objects;
create policy "Admins can upload site assets"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'site-assets' and public.is_admin());

drop policy if exists "Admins can update site assets" on storage.objects;
create policy "Admins can update site assets"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'site-assets' and public.is_admin());

drop policy if exists "Admins can delete site assets" on storage.objects;
create policy "Admins can delete site assets"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'site-assets' and public.is_admin());

-- ---------------------------------------------------------------------------
-- Metadata
-- ---------------------------------------------------------------------------
create table if not exists public.admin_uploads (
  id            uuid primary key default gen_random_uuid(),
  storage_path  text not null,
  public_url    text not null,
  file_name     text not null,
  mime_type     text,
  byte_size     bigint,
  -- Optional context the owner or the assistant provides later.
  title         text,
  notes         text,
  uploaded_by   uuid,
  created_at    timestamptz not null default now()
);

create index if not exists admin_uploads_created_idx
  on public.admin_uploads (created_at desc);

comment on table public.admin_uploads is
  'Files attached in the admin chat, stored in the site-assets bucket. Metadata only -- the assistant can reference these but cannot read their contents.';

alter table public.admin_uploads enable row level security;

drop policy if exists "Admins can manage uploads" on public.admin_uploads;
create policy "Admins can manage uploads"
  on public.admin_uploads
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

revoke all on table public.admin_uploads from anon, authenticated;
grant select, insert, update, delete on table public.admin_uploads to authenticated;
grant all on table public.admin_uploads to service_role;


-- ============================================================================
-- VERIFY
-- ============================================================================
-- select id, public from storage.buckets where id = 'site-assets';
-- EXPECT: one row, public = true

-- select policyname, cmd from pg_policies
-- where schemaname = 'storage' and tablename = 'objects'
--   and policyname like '%site assets%';
-- EXPECT: 4 rows (select, insert, update, delete)

-- select grantee, privilege_type from information_schema.role_table_grants
-- where table_schema = 'public' and table_name = 'admin_uploads'
--   and grantee = 'anon';
-- EXPECT: ZERO rows
