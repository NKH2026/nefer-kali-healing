# Admin AI Agent — Build Plan

**Site:** Nefer Kali Healing — Vite + React 19 SPA on Vercel, Supabase-only backend.
**Goal:** an admin-only chatbot that can answer questions about the store and make changes —
data changes applied instantly after a preview, page changes delivered as a preview link for approval.
**Decisions locked:** data + pages in scope · every write shows a preview and waits for a click · DeepSeek as the model.

Date of research: 2026-09-27. Verify prices/model IDs before budgeting.

---

## 1. Architecture

```
Browser (admin session)                          Supabase Edge Function            External
┌──────────────────────────────┐                 ┌──────────────────────┐          ┌──────────┐
│ /admin/assistant chat panel  │  POST + JWT     │ admin-agent          │  HTTPS   │ DeepSeek │
│  · message list              │ ──────────────► │  1 verify JWT        │ ───────► │ v4-flash │
│  · confirmation cards        │                 │  2 admin_users gate  │ ◄─────── │          │
│  · "Apply" button            │ ◄────────────── │  3 tool loop (≤8)    │          └──────────┘
└──────────┬───────────────────┘   SSE/JSON      │  4 propose, don't    │
           │                                     │    execute writes    │          ┌──────────┐
           │ Apply(proposalId, argsHash)         └──────────┬───────────┘          │ GitHub   │
           └────────────────────────────────────────────────┘                      │ API      │
                     executes, writes audit row                                 └────┬─────┘
                                                                                     │ push branch
                                                                                ┌────▼─────┐
                                                                                │ Vercel   │
                                                                                │ preview  │
                                                                                └──────────┘
```

Three separate endpoints, deliberately:

| Endpoint | Job | Why separate |
|---|---|---|
| `admin-agent/chat` | read tools + build proposals | Long LLM loop; streams; never mutates |
| `admin-agent/apply` | execute ONE approved proposal | Short, transactional, hash-verified |
| `admin-agent/undo` | revert ONE executed proposal | Reads `before_state`, compensates |

Splitting them is what makes the approval gate real. The model can ask for a change; it can never
reach the code path that performs one. It also keeps each invocation inside the Edge Function
limits (see §8) because a human thinking about a confirmation card is not a live HTTP request.

---

## 2. The authorization model must be fixed first

**This is a prerequisite, not a nice-to-have. Do not add an agent before this ships.**

Current state, verified in this repo: every admin policy in `db_schema.sql`, `product_schema.sql`,
`checkout_schema.sql`, `coupons_schema.sql`, `events_schema.sql`, `site_settings_schema.sql`,
`reviews_schema.sql` reads:

```sql
using (auth.role() = 'authenticated')
```

That is not an admin check. It means *"any signed-in user."* On a project with public signup enabled
that is the whole internet; Supabase anonymous sign-ins also assume the `authenticated` role. Also
`auth.role()` is deprecated in favour of the `TO` clause.

### Migration 1 — real admin check

```sql
-- private schema is NOT exposed through PostgREST
create schema if not exists private;

create table if not exists private.admin_users (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  role       text not null default 'owner' check (role in ('owner','editor')),
  created_at timestamptz not null default now()
);
alter table private.admin_users enable row level security;   -- no policies = deny by default

create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from private.admin_users
    where user_id = (select auth.uid())
  );
$$;

revoke all on function private.is_admin() from public, anon;
grant execute on function private.is_admin() to authenticated;
```

Then rewrite every admin policy, e.g.:

```sql
drop policy if exists "Admins can manage products" on products;
create policy "Admins can manage products" on products
  for all to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));
```

> Put `is_admin()` in a **non-exposed** schema. A `security definer` function in `public` is callable
> over the Data API by anyone with a grant, executing with the definer's privileges.

### Migration 2 — close the grants door

Supabase's RLS guidance is explicit that on projects which still grant `anon`/`authenticated` by
default, *"adding policies doesn't remove them."* Revoke the defaults on every table that should not
be client-writable, then grant back only `select` where the storefront genuinely needs it:

```sql
revoke all on all tables in schema public from anon, authenticated;
grant select on products, product_images, product_variants, product_categories,
                blog_posts, events, coupons, reviews, review_media, site_settings
  to anon, authenticated;
grant insert on reviews, review_media, event_registrations, back_in_stock_requests,
                coupon_redemptions
  to anon, authenticated;
-- no direct grants to orders/subscriptions for anon; admins go through the agent or the panel
```

### Migration 3 — disable public signup

Dashboard → Authentication → Providers → Email → **disable "Allow new users to sign up."**
There is no signup UI in this repo, so nothing client-side breaks. Verify with a manual
`POST /auth/v1/signup` that it now fails.

### Migration 4 — fix the existing Edge Functions

`refund-order` currently requires no authentication at all: it is invoked by the browser with
`fetch(.../functions/v1/refund-order)` and only the publishable key. Anyone who reads the SPA bundle
can call it and issue Stripe refunds. Add the same JWT + `admin_users` gate described in §4 to
`refund-order`, `send-order-email`, and `send-review-email`. `stripe-webhook` must stay
unauthenticated — it verifies a Stripe signature instead, and its `verify_jwt` default needs to be
made explicit (there is no `supabase/config.toml` in this repo today).

---

## 3. Runtime facts that shape the design

Verified from Supabase's Edge Functions limits page:

| Limit | Value | Consequence here |
|---|---|---|
| Memory | 256 MB (another page says 250) | fine |
| Wall clock | Free 150 s · Paid 400 s | a whole agent turn must fit; paid plan recommended |
| **CPU per request** | **2 s** (excludes async I/O) | LLM waits don't count; JSON parsing does — clamp tool results |
| **Request idle timeout** | **150 s → 504** | **the real constraint.** Stream, and never let the loop run silently for 150 s |
| Bundle | 20 MB CLI / 5 MB server-side | fine |
| Secrets | 100 × ≤48 KiB | fine |

Design consequences:

1. **Stream the response.** Open the SSE stream *before* the first LLM call so a byte is on the wire
   immediately; heartbeat every ~15 s. Use `EdgeRuntime.waitUntil(pump)` or the isolate may be retired
   and the stream cut off mid-sentence.
2. **Cap the loop**: `MAX_ITERATIONS = 8`, a total 120 s budget checked *before* each round trip, and
   the remaining budget passed as the per-call `AbortController` timeout. Never start a call you
   can't finish.
3. **Clamp tool results** to ~12 000 chars before `JSON.parse`/`JSON.stringify` — CPU is the scarce
   resource.
4. **One turn at a time.** Loop state lives in Postgres, not in a 400-second function. A turn ends
   when the model produces a final answer *or* a proposal.

---

## 4. Authentication of the caller

Two independent checks, in order:

1. **Is this a genuine, currently-valid Supabase user JWT?**
   `supabase.auth.getClaims(jwt)` verifies locally against the project JWKS when the project uses an
   asymmetric signing key, and is the preferred hot path; fall back to `auth.getUser(jwt)`, which
   always round-trips to the Auth server and is authoritative/revocation-aware.
   `getSession()` is **not** an authorization primitive — it reads client state.

2. **Is this user an admin?** Look the `sub` claim up in `private.admin_users` **with a service-role
   client**. An allowlist is unforgeable by the client, instantly revocable (delete a row — no waiting
   for a token to expire, unlike a custom claim or cached JWT), and deny-by-default with RLS on and no
   policies.

> ### ⚠ The trap that silently defeats the whole design
> Supabase: *"A secret key bypasses RLS only when the request carries **no user access token**. If the
> request carries one, it runs under the RLS policies of that signed-in user, **even when the client
> library was initialized with a secret key**."*
>
> So the privileged client must be **fresh and header-free**, created separately from the client used
> to validate the JWT. If you reuse one client, your "service role" client silently degrades to
> user-level permissions and every tool call is filtered by RLS. Getting this wrong yields errors that
> look like bugs, not authorization failures.

Recommended: use Supabase's `withSupabase({ auth: 'user' }, handler)` wrapper where available
(CLI 2.117+), which deliberately exposes `ctx.supabase` (RLS-scoped to the caller) and
`ctx.supabaseAdmin` (bypasses RLS) as two distinct objects.

---

## 5. The tool surface

Every tool is one row in a registry that holds both the JSON schema *and* the implementation, so the
schema the model sees can never drift from the code that runs. Read tools execute immediately; write
tools **return a proposal**. There is no `execute_sql`, no arbitrary `fetch`, and no outbound-request
tool — cutting the exfiltration leg entirely is worth more than any prompt-level defense.

### Read tools (execute immediately)

| Tool | Purpose |
|---|---|
| `get_store_overview` | counts + revenue + pending work (the dashboard, in words) |
| `search_products` | by title / category / status / inventory |
| `get_product` | full row + images + variants |
| `search_orders` | by customer email, status, date range, order number |
| `get_order` | order + line items + tracking |
| `search_blog_posts` | by title / category / published state |
| `get_blog_post` | full row incl. content |
| `list_reviews` | by status / rating / product |
| `list_events` | upcoming / past + registration counts |
| `list_coupons` | with usage |
| `list_subscriptions` | active / paused / past due |
| `get_site_settings` | vacation mode and friends |
| `search_pages` | find hardcoded page copy in the repo (for page edits) |

### Write tools (return a proposal, never execute)

| Tool | Notes |
|---|---|
| `propose_blog_post` | create or update; **draft by default** |
| `propose_publish_blog_post` | publishing is a separate, higher-risk proposal |
| `propose_product_update` | price, description, ingredients, warnings, SEO, category |
| `propose_inventory_update` | quantity, sold-out flag, back-in-stock |
| `propose_product_create` | new product, `status='draft'` |
| `propose_sale` | `on_sale` + `compare_at_price` across a set of products — one transaction |
| `propose_event` | create / update / cancel |
| `propose_coupon` | create / deactivate |
| `propose_review_moderation` | approve / reject / feature, single or bulk |
| `propose_settings_change` | `site_settings` key/value, e.g. vacation mode |
| `propose_order_status` | status / tracking / internal notes (not money) |
| `propose_refund` | calls the existing `refund-order` function after approval; **owner role only** |
| `propose_page_edit` | §7 — produces a preview branch |
| `propose_undo` | revert a previous executed action |

Deliberately **not** in v1: anything touching `auth.users`, RLS policies, migrations, schema, or
Storage deletes. Those are not agent-shaped problems.

---

## 6. The approval gate

### Data model

```sql
create table private.admin_agent_sessions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  title       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table private.admin_agent_messages (
  id          uuid primary key default gen_random_uuid(),
  session_id  uuid not null references private.admin_agent_sessions(id) on delete cascade,
  role        text not null check (role in ('user','assistant','tool')),
  content     text,
  tool_calls  jsonb,
  created_at  timestamptz not null default now()
);

create table private.admin_agent_actions (
  id            uuid primary key default gen_random_uuid(),
  session_id    uuid not null references private.admin_agent_sessions(id) on delete cascade,
  user_id       uuid not null references auth.users(id),
  tool_name     text not null,
  args          jsonb not null,
  args_hash     text not null,          -- sha256 of canonicalised args
  summary       text not null,          -- "Change Rohini Tincture price $39 -> $44"
  preview       jsonb not null,         -- before/after rows for the diff UI
  before_state  jsonb,                  -- enough to reconstruct; enables undo
  risk          text not null check (risk in ('low','medium','high')),
  reversible    boolean not null default true,
  status        text not null default 'proposed'
                check (status in ('proposed','applied','failed','rejected','undone','expired')),
  result        jsonb,
  error         text,
  created_at    timestamptz not null default now(),
  expires_at    timestamptz not null default now() + interval '30 minutes',
  decided_at    timestamptz,
  applied_at    timestamptz,
  model         text,
  prompt_tokens integer,
  completion_tokens integer
);

alter table private.admin_agent_actions enable row level security;
create index on private.admin_agent_actions (session_id, created_at desc);
create index on private.admin_agent_actions (status) where status = 'proposed';
```

Keeping all three tables in `private` means PostgREST can never reach them, the browser cannot read
or write them directly, and the audit trail cannot be edited by the thing it is auditing.

### The rule

> The model produces a proposal. A **human click** produces an execution.

`apply` must:

1. Re-verify the JWT and `admin_users` membership.
2. Load the row; reject if `status != 'proposed'` or `now() > expires_at` (replay / stale-approval guard).
3. Recompute `sha256` over the *canonicalised* arguments and **reject on mismatch** with `args_hash`.
   This is the control that stops a proposal from being mutated between display and execution — the
   admin approves exactly the bytes they were shown, not "whatever the tool eventually receives."
4. Re-check the role: `high` risk proposals require `owner`.
5. Execute as **one Postgres RPC = one transaction**, so a multi-table change (product + variants +
   images) either fully lands or doesn't.
6. Record `result`, `status='applied'`, `applied_at`.
7. Refuse a second `high`-risk action in the same session without an explicit second confirmation.

### Undo

Because every write records `before_state` and writes are one transaction, `undo` is a compensating
RPC, not a rollback of a committed transaction. Rules:

- Prefer **soft delete** (`status='archived'`, `is_active=false`) over `DELETE` everywhere in the agent
  surface, so an undo can always restore.
- Refunds are **irreversible** — mark `reversible=false`, exclude from the undo UI, and require the
  strongest confirmation. (Stripe refunds can be cancelled in a short window, but don't plan on it.)
- Audit rows themselves are append-only and never deleted.

---

## 7. Page edits → preview link → approval

This is the part of the request that needs a different pipeline, because page content is **not** in the
database.

### Current reality

| Kind of content | Where it lives | Instant? |
|---|---|---|
| Products, blog, events, coupons, reviews, settings, orders | Postgres | yes |
| Legal/support/about copy, hero text, nav labels, SEO | hardcoded in `pages/*.tsx`, `components/*.tsx` | needs code + deploy |
| The 13 healing guides | one large `.tsx` per guide (23–35 KB each) | needs code + deploy |

### The flow

```
admin: "Update the Sea Moss guide to say we ship on Tuesdays"
  → agent uses search_pages, finds pages/guides/SeaMossGuide.tsx
  → propose_page_edit returns a diff proposal (exact hunks, not prose)
  → card shows a colour-coded diff
  → admin clicks "Build preview"
      → Edge Function creates branch agent/<slug>-<short-id> via GitHub API
      → commits the file changes, opens a PR
      → Vercel's Git integration deploys a preview URL automatically
      → card shows the link + "open preview"
  → admin reviews the live site on the preview URL
  → "Approve & publish" → agent merges the PR → production deploy
      or "Discard" → agent closes the PR and deletes the branch
```

Because the repo already deploys from GitHub (`NKH2026/nefer-kali-healing`, `main`), Vercel's Git
integration gives preview deployments for free — no new infrastructure. This is the same
propose → preview → approve → apply shape as data edits, just with a slower, human-reviewable apply.

Requirements: a fine-grained GitHub token scoped to **this one repo**, with *Contents: read/write* and
*Pull requests: read/write*, stored as an Edge Function secret. Keep the token repo-scoped so the worst
case is a bad commit in a repo whose history you control, not account-wide access.

### The one-time investment that makes this much better

Each guide is a hand-written `.tsx` file. That means *every* future text tweak to a guide costs a
branch, a build, a preview and a merge — slow, and it burns agent tokens on file surgery.

**Recommended: run one migration that extracts guide and page copy into a `page_content` table**, with
each rendered page reading from the DB and falling back to the hardcoded text. This is a mechanical,
low-risk codemod (13 guides + a handful of legal/marketing pages), and it converts the majority of
future page edits from "code change + preview deploy" into "instant data change with a preview card."
The PR pipeline stays — but it becomes the exception (layout, new sections, new routes) instead of the
default. Do this *after* Phase 2 ships, so the agent is already useful while it happens.

---

## 8. Model configuration (DeepSeek)

Verified from the DeepSeek API docs on 2026-09-27:

| | `deepseek-flash` | `deepseek-v4-pro` |
|---|---|---|
| Version | DeepSeek-V4.1-Flash | DeepSeek-V4-Pro-0813 |
| Context | 1M | 1M |
| Tool calls | ✓ | ✓ |
| JSON output | ✓ | ✓ |
| Input (cache miss) | $0.15 / M off-peak · $0.30 peak | $0.66 · $1.32 |
| Input (cache hit) | $0.003 · $0.006 | $0.022 · $0.044 |
| Output | $0.60 / M off-peak · $1.20 peak | $1.98 · $3.96 |
| Concurrency | 2500 | 500 |

Off-peak is exactly half price; peak is 01:00–04:00 and 06:00–10:00 UTC Mon–Fri. Everything else,
including all weekends, is off-peak.

**Use `deepseek-flash`.** At this volume the cost difference between tiers is a rounding error and
`flash` is the reliable, cheap choice for schema-shaped CRUD.

### Thinking mode: turn it off by default

Thinking mode is **enabled by default with effort `high`**, and:

- It ignores `temperature`, `presence_penalty`, `frequency_penalty` (silently — no error).
- When the request carries `tools`, **`reasoning_content` from every prior turn must be passed back**
  or the API returns a 400.

That second rule is the one that bites: it makes multi-round tool loops stateful in a way that's easy to
get subtly wrong, and it makes every turn slower and more expensive. For an agent whose job is
"find the product, propose the price change," the reasoning budget buys almost nothing.

**Recommended:** send `{"thinking": {"type": "disabled"}}` (OpenAI format) for the default path. Expose
a "Think harder" toggle on the composer that re-runs with `reasoning_effort: "high"` for genuinely
multi-step requests ("find every product in the Extracts category, apply 15% off, and draft a blog post
about the sale"), and handle `reasoning_content` passthrough correctly on that path only.

Two more DeepSeek specifics worth using:

- **`strict` mode (beta)** — set `strict: true` on every function and use `base_url="https://api.deepseek.com/beta"`.
  The server then validates tool arguments against the JSON schema, so you stop hand-writing
  "the model emitted `price: "44"` instead of `44`" repairs. Constraints: every `object` must list all
  properties as `required` and set `additionalProperties: false`; `minLength`/`maxLength`/`minItems`/`maxItems`
  are **not** supported. Design the schemas to fit.
- **Context caching** is automatic, on by default, with **no write fee** — so the long, static system
  prompt (data model + tool definitions + house rules) is billed at the cache-hit rate after the first
  call, with no cache-management code.

**Cost estimate.** Assume 12 000 turns/month, ~8 000-token static prefix (mostly cached), ~4 000 tokens
of conversation, ~600 output tokens:

- cached input: 96M × $0.003/M ≈ **$0.29**
- fresh input: 48M × $0.15/M ≈ **$7.20**
- output: 7.2M × $0.60/M ≈ **$4.32**

**≈ $8–20/month**, plus a paid Supabase plan for the 400 s wall clock. Top up $10–20 and monitor.

---

## 9. Guardrails

1. **The click is the security boundary, not the prompt.** A 14-author OpenAI/Anthropic/DeepMind paper
   (arXiv 2510.09023) bypassed 12 published prompt-injection defenses with >90% success under adaptive
   attack. Do not budget for a classifier as the safety net.
2. **Assume every string the agent reads is hostile** — review bodies, customer names, order notes,
   `internal_notes`, blog drafts. Wrap tool output in clearly delimited untrusted blocks; never let
   retrieved text become instructions.
3. **Never persist agent-generated free text that the agent will later re-read**, or you build a
   stored-injection loop. The agent's own output does not go into `internal_notes`.
4. **No escape hatches.** No `execute_sql`, no generic `fetch`, no `send_email`. An allowlist is only an
   allowlist if there is no way around it.
5. **Bind write tools only when the admin's own message is the instruction.** A turn that is just
   "summarise last month's reviews" should run with **zero write tools bound**, so injected text
   inside a review has nothing to call. This is cheap and it removes the highest-value attack.
6. **Validate arguments server-side**, on top of `strict` mode: numeric ranges, enum membership, target
   row exists, price within sane bounds, publish only from `draft`.
7. **Rate limit** per user and per session (e.g. 60 turns/hour) and cap input message length.
8. **Log everything**: model name, token counts, every tool call and its result, every proposal, every
   decision, every execution. `admin_agent_actions` is the record of what the agent did to the store.
9. **CORS**: allowlist the production and Vercel preview origins. Do not use `*` on an admin endpoint —
   `refund-order` uses `*` today.
10. **Least privilege for the model's tools.** Tools run as "the agent," not "the owner." `propose_refund`
    is the only money-moving tool and it requires the `owner` role plus a second confirmation.

---

## 10. Phases

| Phase | Deliverable | Effort |
|---|---|---|
| **0** | Auth fix: `private.admin_users`, `is_admin()`, rewritten policies, revoked grants, signup disabled, `refund-order` gated, `config.toml` with explicit `verify_jwt` | 2–3 days |
| **1** | Read-only copilot: `/admin/assistant` chat panel, streaming Edge Function, JWT + admin gate, schema introspection, ~13 read tools, **zero write tools bound**. Immediately useful and risk-free. | 3–5 days |
| **2** | Write path: agents tables, `propose_*` tools, confirmation cards with diffs, `apply` and `undo` endpoints, audit log. Ship with 3–4 write tools (settings, inventory, review moderation), not all 13. | 1 week |
| **3** | Page pipeline: `search_pages`, `propose_page_edit`, GitHub branch + PR, preview link card, merge-to-publish. | 4–6 days |
| **4** | The rest of the write tools, `page_content` extraction codemod, "Think harder" toggle, undo UI, optional MCP server so you can drive the same tool layer from Claude or ChatGPT. | ongoing |

Total: **~3–4 weeks** of focused work. Phase 1 is worth shipping on its own.

### Gate between phases

Do not add a write tool until the previous phase's writes have a working undo. Do not proceed past
Phase 2 until 50 approved writes have executed without a single `before_state`/rollback failure.

---

## 11. Schema drift — a prerequisite for the tool layer

The `.sql` files in this repo **do not match the live database.** Concretely:

- `db_schema.sql` defines `reviews(reviewer_name, comment, is_approved)`.
  `lib/api.ts` and `reviews_schema.sql` use `reviews(customer_name, review_text, status)`.
- `db_schema.sql` defines `products(price text, image_url, rating, reviews_count)`.
  `product_schema.sql` and `pages/Shop.tsx` use `price numeric`, `featured_image_url`,
  `inventory_quantity`, `is_sold_out`, `published`, `status`.
- `checkout_schema.sql` defines `orders(total, subtotal, ...)`; there is no `total_cents`.
- `db_schema.sql` and `product_schema.sql` both `create table products`; `reviews` is defined twice.

This matters because the agent's system prompt must describe the *real* columns. **Generate the
data-model section of the system prompt from the live database at runtime** — PostgREST publishes an
OpenAPI description at `/rest/v1/`, which gives accurate table and column names without a migration
tool, or query `information_schema.columns`. Then the prompt can never drift from reality, and the
tool implementations are written against a schema you have confirmed rather than one you read in a
`.sql` file.

Do this introspection *first*: it is also how you find out whether any RLS policy you are about to
rewrite doesn't exist, or exists under a different name than the file suggests.

---

## 12. Files in this repo from the research phase

| File | Status |
|---|---|
| `docs/admin-ai-agent-research.md` | Full architecture research (~10 sections, cited). Reference. |
| `docs/edge-function-llm-agent-research.md` | Edge Function / limits / provider research (~79 KB, cited). Reference. |
| `supabase/functions/admin-agent/index.ts` | **Scaffold only — do not deploy as-is.** See caveats below. |
| `supabase/functions/admin-agent/deno.json` | Per-function import map. Usable. |
| `supabase/admin_users.sql` | Starting point for Migration 1. Review before running. |

### Caveats on the generated scaffold

`supabase/functions/admin-agent/index.ts` was written before the current schema was read from this repo,
and needs these changes before it is deployable:

1. **Its embedded data-model prompt is wrong for this project.** It describes `orders.total_cents`,
   `products.price_cents`, `products.is_active`, `reviews.body`/`is_published`, and `orders.updated_by`.
   None of those exist here. Replace with runtime introspection (§11).
2. **Its write tool mutates directly.** `set_order_status` calls `.update()` inside the loop — the exact
   thing §6 forbids. All write tools must return proposals instead.
3. **`temperature: 0.2` and `parallel_tool_calls: true`** are sent unconditionally. DeepSeek ignores
   temperature in thinking mode and the parameter set must match the mode actually used.
4. **No `admin_agent_actions` table, no `apply`/`undo` endpoints.** The approval gate is missing.
5. **Default `LLM_BASE_URL`/`LLM_MODEL`** point at OpenAI and `gpt-4.1-mini`; set
   `https://api.deepseek.com` and `deepseek-flash` (or the `/beta` base URL to use `strict` mode).
6. **Not type-checked** — Deno was not available in the environment that produced it. Run
   `deno check supabase/functions/admin-agent/index.ts` before trusting it.

Its value is the shape it establishes: JWT verification with an authoritative fallback, the
`admin_users` gate, a registry that keeps tool schemas and implementations together, a budget-aware
loop that never starts a call it can't finish, per-tool error feedback, and the `waitUntil`-pumped SSE
pattern. Keep those; replace the schema, the write tools, and the model config.

---

## 13. Open decisions for the owner

1. **Supabase plan** — the free tier's 150 s wall clock is workable for Phase 1 but tight for multi-step
   turns. Paid raises it to 400 s.
2. **Page-content codemod (§7)** — do it, or keep every page edit on the PR path? It's the difference
   between most page edits being instant and all of them being a build-and-review cycle.
3. **Which roles exist** — the plan assumes `owner` and `editor`. If only one person will ever use this,
   collapse to a single role and drop the role check in `apply` (keep everything else).
4. **MCP (§1c)** — worth building in Phase 4 so you can drive the same tools from Claude or ChatGPT.
   It must stay a *second* interface: MCP clients own the approval UI, so an approval granted inside
   someone else's chat client leaves no durable record in `admin_agent_actions`.
