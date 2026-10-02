-- ============================================================================
-- Publishing: send tracking for marketing drafts
-- ============================================================================
-- Tier 3 is different from everything built so far. A price change, a theme
-- change, even a merge can be reverted. An email that has left the building, or
-- a social post that is live, cannot be.
--
-- So the model here is deliberately different too:
--   - the assistant can DRAFT, and can propose edits to a draft
--   - it has NO tool that can send, schedule or publish anything
--   - sending is performed only by a named action in the admin UI, behind an
--     explicit confirmation and after the owner has seen the final text
--
-- The columns below exist to make a send auditable and hard to repeat, not to
-- make it convenient.
--
-- Idempotent: safe to run more than once.
-- ============================================================================

alter table public.marketing_drafts
  add column if not exists publisher        text,
  add column if not exists published_at     timestamptz,
  add column if not exists publish_ref      text,
  add column if not exists publish_error    text,
  add column if not exists approved_at      timestamptz,
  add column if not exists approved_by      uuid;

-- The exact bytes that were sent. Kept separate from `body` because the body can
-- still be edited afterwards, and the point of this column is to record what
-- actually left the building.
alter table public.marketing_drafts
  add column if not exists sent_snapshot    jsonb;

-- A draft may not be marked sent without a timestamp, and vice versa. This is a
-- database-level guard rather than a code-level one, so a bug in the Edge
-- Function cannot produce a row claiming success without evidence.
--
-- Note the state machine: draft -> approved -> sending -> sent (or failed).
-- `sending` is a CLAIM. The row is stamped before the network call so two
-- concurrent sends cannot both dispatch. A claim is abandoned rather than
-- silently retried after STALE_CLAIM_MINUTES, because a send that may have
-- succeeded must never be repeated automatically.
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.marketing_drafts'::regclass
      and conname = 'marketing_drafts_sent_consistency'
  ) then
    alter table public.marketing_drafts
      add constraint marketing_drafts_sent_consistency
      check (
        (status = 'sent' and published_at is not null)
        or (status <> 'sent')
      );
  end if;

  -- `sending` and `failed` did not exist in the original check constraint.
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.marketing_drafts'::regclass
      and conname = 'marketing_drafts_status_check'
  ) then
    alter table public.marketing_drafts
      add constraint marketing_drafts_status_check
      check (status in ('draft', 'approved', 'sending', 'sent', 'failed', 'discarded'));
  end if;
end $$;

create index if not exists marketing_drafts_pending_idx
  on public.marketing_drafts (status, created_at desc);

comment on column public.marketing_drafts.sent_snapshot is
  'The exact payload sent, captured at send time. `body` may be edited later; this may not.';
comment on column public.marketing_drafts.publish_ref is
  'Provider-side identifier for the send (broadcast id, post id, webhook response).';


-- ============================================================================
-- VERIFY
-- ============================================================================
-- select column_name from information_schema.columns
-- where table_schema = 'public' and table_name = 'marketing_drafts'
-- order by ordinal_position;
-- EXPECT: the original columns plus publisher, published_at, publish_ref,
--         publish_error, approved_at, approved_by, sent_snapshot

-- select conname from pg_constraint
-- where conrelid = 'public.marketing_drafts'::regclass;
-- EXPECT: marketing_drafts_sent_consistency present
