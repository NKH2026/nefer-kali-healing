-- ============================================================================
-- Marketing drafts
-- ============================================================================
-- Where drafted marketing copy lives before it goes anywhere.
--
-- The assistant drafts; the owner publishes. Nothing here is ever posted to a
-- platform automatically -- an email, an Instagram caption or a partner message
-- cannot be un-sent, so sending stays a human action.
--
-- Idempotent: safe to run more than once.
-- ============================================================================

create table if not exists public.marketing_drafts (
  id           uuid primary key default gen_random_uuid(),
  channel      text not null check (channel in (
                 'newsletter', 'instagram', 'facebook', 'blog_social',
                 'partner_outreach', 'press', 'other'
               )),
  subject      text,
  body         text not null,
  -- Free-form so a draft can record the campaign, the audience, the offer, or
  -- the organisation being approached.
  notes        text,
  status       text not null default 'draft' check (status in (
                 'draft', 'approved', 'scheduled', 'sent', 'discarded'
               )),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  created_by   uuid
);

create index if not exists marketing_drafts_channel_idx
  on public.marketing_drafts (channel, created_at desc);
create index if not exists marketing_drafts_status_idx
  on public.marketing_drafts (status);

comment on table public.marketing_drafts is
  'Marketing copy drafted by the admin assistant. The owner publishes; nothing sends automatically.';

-- ---------------------------------------------------------------------------
-- Access
--
-- Admin-only. Unlike the theme there is no reason for the storefront to read
-- this, so there is no anon policy at all: RLS on with no client policy means
-- deny by default, and only the service role reaches it.
-- ---------------------------------------------------------------------------
alter table public.marketing_drafts enable row level security;

drop policy if exists "Admins can manage marketing drafts" on public.marketing_drafts;
create policy "Admins can manage marketing drafts"
  on public.marketing_drafts
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

revoke all on table public.marketing_drafts from anon, authenticated;
grant select, insert, update, delete on table public.marketing_drafts to authenticated;
grant all on table public.marketing_drafts to service_role;

-- Keep updated_at current.
create or replace function public.touch_marketing_draft()
returns trigger
language plpgsql
set search_path to ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists marketing_drafts_touch on public.marketing_drafts;
create trigger marketing_drafts_touch
  before update on public.marketing_drafts
  for each row
  execute function public.touch_marketing_draft();


-- ============================================================================
-- VERIFY
-- ============================================================================
-- select count(*) from pg_policies
-- where schemaname = 'public' and tablename = 'marketing_drafts';
-- EXPECT: 1

-- select grantee, privilege_type from information_schema.role_table_grants
-- where table_schema = 'public' and table_name = 'marketing_drafts'
--   and grantee in ('anon');
-- EXPECT: ZERO rows
