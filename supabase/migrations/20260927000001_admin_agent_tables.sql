-- ============================================================================
-- Admin agent: conversation storage
-- ============================================================================
-- Phase 1 (read-only copilot). These tables live in the `private` schema so
-- PostgREST cannot reach them: the browser must never be able to read or write
-- the transcript directly. Only the admin-agent Edge Function touches them,
-- with the service-role key.
--
-- Run AFTER 20260927000000_harden_admin_authorization.sql.
-- ============================================================================

create schema if not exists private;

-- ---------------------------------------------------------------------------
-- Sessions: one per conversation, owned by one admin.
-- ---------------------------------------------------------------------------
create table if not exists private.agent_sessions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  title       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists agent_sessions_user_idx
  on private.agent_sessions (user_id, updated_at desc);

-- ---------------------------------------------------------------------------
-- Messages: append-only transcript.
--
-- `tool_calls` holds the tool calls the model requested on that assistant turn,
-- and `tool_results` holds what came back. Both are stored so the transcript is
-- a faithful record of what the agent saw and did -- this is the audit trail,
-- and it is never mutated after insert.
-- ---------------------------------------------------------------------------
create table if not exists private.agent_messages (
  id           uuid primary key default gen_random_uuid(),
  session_id   uuid not null references private.agent_sessions(id) on delete cascade,
  role         text not null check (role in ('user', 'assistant', 'tool')),
  content      text,
  tool_calls   jsonb,
  tool_results jsonb,
  model        text,
  prompt_tokens     integer,
  completion_tokens integer,
  created_at   timestamptz not null default now()
);

create index if not exists agent_messages_session_idx
  on private.agent_messages (session_id, created_at);

-- ---------------------------------------------------------------------------
-- Deny by default. RLS on with no policies means no client role can read these
-- even if a grant is ever added by accident. service_role bypasses RLS.
-- ---------------------------------------------------------------------------
alter table private.agent_sessions enable row level security;
alter table private.agent_messages enable row level security;

revoke all on table private.agent_sessions from anon, authenticated;
revoke all on table private.agent_messages from anon, authenticated;
revoke all on schema private from anon, authenticated;

-- ---------------------------------------------------------------------------
-- Keep updated_at current on sessions.
-- ---------------------------------------------------------------------------
create or replace function private.touch_agent_session()
returns trigger
language plpgsql
set search_path to ''
as $$
begin
  update private.agent_sessions
     set updated_at = now()
   where id = new.session_id;
  return new;
end;
$$;

drop trigger if exists agent_messages_touch_session on private.agent_messages;
create trigger agent_messages_touch_session
  after insert on private.agent_messages
  for each row
  execute function private.touch_agent_session();


-- ============================================================================
-- VERIFY
-- ============================================================================
-- select tablename, rowsecurity from pg_tables where schemaname = 'private';
-- ^ both agent tables should show rowsecurity = true.
--
-- select grantee, table_name, privilege_type
-- from information_schema.role_table_grants
-- where table_schema = 'private';
-- ^ must return ZERO rows.
