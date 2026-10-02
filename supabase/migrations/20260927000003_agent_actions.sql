-- ============================================================================
-- Phase 2: write proposals, approval, and undo
-- ============================================================================
-- Design: the model never writes. It can only create a row in
-- private.agent_actions with status='proposed'. A separate, short request --
-- triggered by a human clicking Apply -- flips it to 'applied' and performs the
-- write. The model has no code path to that endpoint.
--
-- Approval is bound to args_hash, a sha256 over the canonicalised proposal
-- payload. If the stored payload changes between display and execution, the
-- hash check fails and the write is refused. That is what makes "you approved
-- exactly this" enforceable rather than aspirational.
--
-- Idempotent -- safe to run more than once.
-- ============================================================================

create extension if not exists pgcrypto;

create table if not exists private.agent_actions (
  id           uuid primary key default gen_random_uuid(),
  session_id   uuid references private.agent_sessions(id) on delete set null,
  user_id      uuid not null references auth.users(id),
  tool_name    text not null,

  -- What will be written, and the hash the approval is bound to.
  args         jsonb not null,
  args_hash    text  not null,

  -- Human-readable one-liner for the confirmation card.
  summary      text not null,

  -- Per-field before/after for the diff UI:
  --   [{ field, label, before, after }]
  preview      jsonb not null,

  -- Target table + primary key + the exact previous values, so undo is a
  -- direct restore rather than a reconstruction.
  target_table text not null,
  target_id    text,
  before_state jsonb,

  risk         text not null default 'medium' check (risk in ('low', 'medium', 'high')),
  reversible   boolean not null default true,
  status       text not null default 'proposed'
               check (status in ('proposed', 'applied', 'failed', 'rejected', 'undone', 'expired')),

  result       jsonb,
  error        text,

  -- Written at APPLY time: the exact instructions needed to reverse this
  -- change. Kept in its own column rather than inside `result`, because
  -- `result` is returned to the browser and could be overwritten by a later
  -- request -- which would silently break undo.
  restore_state jsonb,

  created_at   timestamptz not null default now(),
  expires_at   timestamptz not null default now() + interval '30 minutes',
  decided_at   timestamptz,
  applied_at   timestamptz,
  undone_at    timestamptz,

  model              text,
  prompt_tokens      integer,
  completion_tokens  integer
);

-- Idempotent backfill: if agent_actions already existed from an earlier run of
-- this file, `create table if not exists` above would have skipped it, so make
-- sure the restore column is present either way.
alter table private.agent_actions
  add column if not exists restore_state jsonb;

create index if not exists agent_actions_session_idx
  on private.agent_actions (session_id, created_at desc);

-- Fast lookup of the live pending proposal for a session (one at a time).
create index if not exists agent_actions_pending_idx
  on private.agent_actions (session_id)
  where status = 'proposed';

-- Append-only record of what was actually changed, for verification.
create table if not exists private.agent_action_log (
  id         bigserial primary key,
  action_id  uuid not null references private.agent_actions(id) on delete cascade,
  event      text not null check (event in ('proposed', 'applied', 'rejected', 'failed', 'undone')),
  detail     jsonb,
  created_at timestamptz not null default now()
);

create index if not exists agent_action_log_action_idx
  on private.agent_action_log (action_id, created_at);

-- ---------------------------------------------------------------------------
-- Deny by default, exactly as with the other agent tables.
-- ---------------------------------------------------------------------------
alter table private.agent_actions enable row level security;
alter table private.agent_action_log enable row level security;

revoke all on table private.agent_actions from anon, authenticated;
revoke all on table private.agent_action_log from anon, authenticated;

grant usage on schema private to service_role;
grant select, insert, update, delete on all tables in schema private to service_role;
alter default privileges in schema private
  grant select, insert, update, delete on tables to service_role;


-- ============================================================================
-- VERIFY
-- ============================================================================
-- select table_name from information_schema.tables
-- where table_schema = 'private' order by table_name;
-- EXPECT: agent_action_log, agent_actions, agent_messages, agent_sessions

-- select has_schema_privilege('anon', 'private', 'USAGE') as anon_usage,
--        has_schema_privilege('authenticated', 'private', 'USAGE') as auth_usage,
--        has_schema_privilege('service_role', 'private', 'USAGE') as service_usage;
-- EXPECT: false, false, true

-- select grantee, privilege_type from information_schema.role_table_grants
-- where table_schema = 'private' and table_name = 'agent_actions'
--   and grantee in ('anon','authenticated');
-- EXPECT: ZERO rows
