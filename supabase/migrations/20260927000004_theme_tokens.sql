-- ============================================================================
-- Theme tokens: data-driven visual control of the whole site
-- ============================================================================
-- Design values live in a row instead of in CSS files, so the admin assistant
-- can propose a visual change, show a before/after card, and have it take
-- effect with no build and no deploy.
--
-- Readable by the storefront (anon) so the public site can apply the palette at
-- runtime. Writable only by the Edge Function's service role -- there is no
-- write policy, and RLS is on, so a client cannot modify the theme.
--
-- Idempotent: safe to run more than once.
-- ============================================================================

create table if not exists public.theme_settings (
  key        text primary key,
  value      jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by uuid
);

comment on table public.theme_settings is
  'Site-wide design tokens rendered as CSS custom properties. Written by the admin agent through the service role; read publicly.';

alter table public.theme_settings enable row level security;

-- Exactly one policy: public read. No insert/update/delete policy exists, so
-- RLS denies those to every client role. The service role bypasses RLS.
drop policy if exists "Theme is publicly readable" on public.theme_settings;
create policy "Theme is publicly readable"
  on public.theme_settings for select
  to anon, authenticated
  using (true);

revoke all on table public.theme_settings from anon, authenticated;
grant select on table public.theme_settings to anon, authenticated;
grant all on table public.theme_settings to service_role;

-- ---------------------------------------------------------------------------
-- Seed.
--
-- Three keys, forming a base layer plus per-surface overrides:
--   tokens        -> base, inherited by both surfaces
--   tokens:site   -> storefront-only override  (sparse patch)
--   tokens:admin  -> admin-only override       (sparse patch)
--
-- The overrides start EMPTY on purpose. They are merges, not full sets, so an
-- override only needs to carry the tokens it changes; everything else keeps
-- following the base. That is what lets "make the admin trippy" leave the
-- storefront untouched without freezing the admin at stale values.
--
-- on conflict do nothing, so re-running never overwrites a live theme.
-- ---------------------------------------------------------------------------
insert into public.theme_settings (key, value)
values (
  'tokens',
  jsonb_build_object(
    -- Three hues drive every accent in the design, as HSL degrees.
    'hue1',           265,   -- primary   (purple today)
    'hue2',           325,   -- secondary (fuchsia/pink today)
    'hue3',           172,   -- tertiary  (teal today)

    'saturation',      70,   -- 0-100, overall vividness
    'glow',            40,   -- 0-100, bloom around accents
    'animationSpeed', 100,   -- 25-250 (%), scales ambient motion
    'backgroundDepth', 10,   -- 0-100, lightness of the near-black canvas
    'hueRotate',        0,   -- 0-360 deg, continuous animated hue cycling
    'contrast',       100,   -- 85-120 (%), accent/text contrast
    'grain',           12    -- 0-100, subtle texture overlay
  )::jsonb
)
on conflict (key) do nothing;

insert into public.theme_settings (key, value)
values ('tokens:site', '{}'::jsonb), ('tokens:admin', '{}'::jsonb)
on conflict (key) do nothing;


-- ============================================================================
-- VERIFY
-- ============================================================================
-- select key, jsonb_pretty(value), updated_at from public.theme_settings;

-- select grantee, privilege_type from information_schema.role_table_grants
-- where table_schema = 'public' and table_name = 'theme_settings'
-- order by grantee, privilege_type;
-- EXPECT: anon/authenticated -> SELECT only; service_role -> everything.

-- select count(*) from pg_policies
-- where schemaname = 'public' and tablename = 'theme_settings';
-- EXPECT: 1 (the public read policy)
