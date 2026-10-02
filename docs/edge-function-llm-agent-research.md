# Hosting an LLM Agent Loop in Supabase Edge Functions (Deno)

**Scope:** Vite+React SPA on Vercel (static) → Supabase (Postgres+RLS, Auth, Storage, Deno Edge Functions) → an admin-only AI agent that reads/writes site data with the service-role key, invoked from the browser with the logged-in user's JWT.

**Verification legend used throughout:**
- **[V]** = verified from an official Supabase / Deno / provider docs page fetched during this session (URL cited).
- **[C]** = corroborated by an official-adjacent source (provider blog, official GitHub example, official discussion) but not a canonical doc page.
- **[U]** = uncertain, undocumented, or known to be a docs gap. Do not treat as a guarantee.

**Date caveat (important):** the documentation served during this session carries **2026** markers. Provider model lineups have moved on from the names in the original brief (OpenAI GPT-6/GPT-5.6, Claude Haiku 4.5 / Sonnet 5 / Opus 5.5, Gemini 3.8 Flash / 3.1 Pro, DeepSeek `deepseek-flash` / `deepseek-v4-pro`). Where the brief named older models, I give the current lineup **and** the legacy price where I verified it. Re-verify prices and model IDs before budgeting.

---

## Executive summary

1. **The runtime is adequate for this workload.** The binding constraint is **2 s of CPU per request** and a **400 s wall-clock worker lifetime (150 s on Free)**. An agent loop waiting on LLM HTTP responses is I/O-bound, not CPU-bound, so multi-round-trip tool calling fits comfortably. **[V]**
2. **The real operational risk is the 150 s request idle timeout**, which returns **504** if no response byte has been sent. Keep buffered runs well under that, or stream. **[V]**
3. **Streaming is supported** and Supabase documents the exact pattern for exactly this use case (SSE/AI stream forwarding with `EdgeRuntime.waitUntil`). **[V]**
4. **Your current import style is obsolete.** `https://deno.land/std@0.168.0/http/server.ts` `serve()` is a deprecated std API; `Deno.serve` (built in) is the modern primitive, and Supabase's own current examples use `export default { fetch }` with an optional `withSupabase` wrapper from `npm:@supabase/server`. **[V/C]**
5. **`auth.role() = 'authenticated'` cannot gate an admin surface** on a public-signup project — every visitor can sign up. Use an explicit allowlist table read with the service role (recommended, shown in the skeleton) or a service-role-controlled custom claim. **[V]**
6. **Prefer `getClaims()` over `getUser()` for hot-path verification** when the project uses an asymmetric signing key; `getUser()` remains the authoritative server round-trip fallback. **[V]**
7. **OpenAI's Messages↔Responses split matters for tool calling:** the Responses API is recommended for all new projects, and **GPT-6 Astra requires the Responses API for tool calling**. Chat Completions is still supported but is now the legacy path. **[V]**
8. **One OpenAI-compatible code path covers OpenAI, DeepSeek, and Gemini** (the latter via `https://generativelanguage.googleapis.com/v1beta/openai/`). Anthropic needs its own envelope. **[V]**
9. **Cost is a rounding error at this volume** (~$7–$60/month across small tiers, ~$13–$60/month with caching). Choose on tool-call reliability and schema fidelity, not price. **[V]**
10. **Supabase has no container/long-lived-worker product**, and its own docs' escape hatch is self-hosting `edge-runtime` on Fly.io. But you almost certainly don't need it: **stay on Edge Functions and stream**, and if you need durability, add **Cron + Queues** (both $0 incremental) rather than a new vendor. **[V]**

---

## 1. Edge Function runtime facts that matter for an agent loop

### 1.1 Deno runtime version

| Fact | Value | Source |
|---|---|---|
| Runtime | "Supabase Edge Runtime (Deno compatible runtime with TypeScript first)" | [Functions overview](https://supabase.com/docs/guides/functions) **[V]** |
| Deno 2.1 preview | Announced Apr 1, 2025; hosted platform was still **Deno 1.45** at that time | [Supabase blog: Edge Functions + Deno 2.1](https://dev.to/supabase/edge-functions-deploy-from-the-dashboard-deno-21-2omm) **[C]** |
| Current hosted version | "All regions now run Deno 2.1 compatible release" | [supabase discussion #37941](https://github.com/orgs/supabase/discussions/37941) **[C]** |
| Exact patch version | **Not published as a stable doc statement.** Treat the precise version as **[U]** — do not depend on a specific Deno minor's newer APIs without testing. | — |

**Practical reading:** the hosted platform is on a **Deno 2.1-compatible** runtime. That gives you `Deno.serve`, `npm:` specifiers, `node:` builtins, `deno.json` import maps, and Web Streams.

### 1.2 Import style: what to use instead of `std@0.168.0/http/server.ts` `serve()`

Your codebase does:

```ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
```

This is the pattern Supabase's 2021–2023 templates shipped. It is now superseded on three levels:

1. **`std` HTTP server is deprecated upstream.** `std/http/server.ts` no longer exists in the `denoland/std` main branch (raw fetch returns 404), and the ecosystem treats `serve()` from std as deprecated in favour of the built-in `Deno.serve`. **[C]**
2. **Supabase's official examples now use `Deno.serve`.** The current legacy-auth doc shows `Deno.serve(async (req: Request) => { ... })`, and the troubleshooting guide's SSE/AI-stream example uses `Deno.serve`. **[V]** — [auth-legacy-jwt](https://supabase.com/docs/guides/functions/auth-legacy-jwt), [worker timeouts](https://supabase.com/docs/guides/troubleshooting/edge-functions-worker-timeouts-and-websocket-drops)
3. **The newest Supabase style is a default-export handler, optionally wrapped.** Current examples use:

```ts
import { withSupabase } from 'npm:@supabase/server@^1'

export default {
  fetch: withSupabase({ auth: 'user' }, async (req, ctx) => {
    return Response.json({ ok: true })
  }),
}
```

**[V]** — [Background Tasks](https://supabase.com/docs/guides/functions/background-tasks), [CORS](https://supabase.com/docs/guides/functions/cors), official [`streams` example](https://github.com/supabase/supabase/blob/master/examples/edge-functions/supabase/functions/streams/index.ts)

`export default { fetch }` is also the interface `deno serve` expects (`Deno.ServeDefaultExport`) **[V]** — [Deno HTTP Server API](https://docs.deno.com/api/deno/http-server/).

**Dependency guidance from the current docs [V]:** prefer `npm:` specifiers (`npm:@supabase/supabase-js@2`), `node:` builtins, or `jsr:` (`jsr:@std/path@1.0.8`), and give **each function its own `deno.json`** for isolation. Your repo uses `https://esm.sh/@supabase/supabase-js@2`; that still works, but `npm:` is what the docs recommend now.

**Is `std@0.168` "deprecated"?** Precisely: the *pin* is not deprecated (a pinned URL still resolves and is immutable), but the **API** (`serve` from `std/http`) is superseded, and the pinned version is ancient relative to the runtime. The practical risk is that you are running 2023-era std code on a Deno 2.1 runtime. **Recommendation: migrate new functions to `Deno.serve` (or `export default { fetch }` + `withSupabase`) and plan a migration for the existing five.**

### 1.3 Limits per invocation

From the canonical [Limits page](https://supabase.com/docs/guides/functions/limits) **[V]**:

| Limit | Value | Notes for an agent loop |
|---|---|---|
| **Maximum memory** | **256 MB** | Plenty for JSON tool results. |
| **Maximum duration (wall clock)** | **Free 150 s / Paid 400 s** | This is the *worker* lifetime; a worker can serve multiple requests or background tasks. **[V]** |
| **Maximum CPU time** | **2 s per request** (excludes async I/O) | The binding constraint. LLM waits don't count; JSON parsing of huge tool results does. |
| **Request idle timeout** | **150 s** — returns **504** if the function doesn't send a response first | The real failure mode for slow buffered agent runs. **[V]** |
| **Max function size** | 20 MB (CLI-bundled) / 5 MB (server-side bundled) | Keep the bundle lean; cold start scales with it. |
| **Functions per project** | Free 100 / Pro 1000 / Team 2000 / Enterprise unlimited | — |
| **Max log message length** | 10,000 characters | Tool results logged for debugging get truncated. |
| **Log event threshold** | 100 events / 10 s | Don't log per-token. |
| **Recursive/nested calls** | 30 requests per trace within a 60 s window | Relevant if your agent calls other Edge Functions. **[V]** |
| **Secrets** | 100 max; name ≤ 256 chars; value ≤ 48 KiB; no `SUPABASE_` prefix | — |

**Do these differ by plan?** Yes, but only in two places: **wall clock (150 s → 400 s)** and **functions-per-project**. Memory, CPU, and the idle timeout are **plan-independent**. **[V]**

There is a **discrepancy in the official docs** worth flagging: the [546 troubleshooting page](https://supabase.com/docs/guides/troubleshooting/edge-function-546-error-response) states **"Memory: 250MB"** while the Limits page says **256MB**. Assume **250 MB usable** to be safe. **[U]** on which is authoritative.

**Request/response size limits: undocumented.** Supabase has an open issue requesting these be published ([supabase#28053](https://github.com/supabase/supabase/issues/28053)) **[C]**, and they do not appear on the Limits page **[V]**. Treat any specific number as **[U]** and defend server-side with your own `content-length` / body-size check (the skeleton caps the user message at 8,000 chars).

### 1.4 Isolate / concurrency semantics (why this matters for an agent)

From [Understanding Edge Function CPU limits](https://supabase.com/docs/guides/troubleshooting/edge-function-cpu-limits) and the [546 page](https://supabase.com/docs/guides/troubleshooting/edge-function-546-error-response) **[V]**:

- An **isolate handles one request at a time** and is bound to one function.
- Isolates have a **soft** and a **hard** CPU limit. On the soft limit the isolate **retires**: it accepts no new requests but finishes in-flight ones. New requests spin up a fresh isolate. On the hard limit it is terminated.
- Once an isolate has used **50% of any resource** it finishes the current request then shuts down. **[V]**
- Exceeding CPU/memory yields **HTTP 546** with `{"code":"WORKER_RESOURCE_LIMIT"}`, and a `CPUTime` shutdown reason in logs. **[V]**
- **`EarlyDrop`**: the supervisor retires an isolate early when it looks idle — defined as *the response has been returned* **and** *all `EdgeRuntime.waitUntil()` promises have resolved*. This can kill open WebSockets or truncate a stream. **[V]**

### 1.5 Streaming: yes, and here is the exact recommended pattern

**Streaming back to the browser is supported.** Two official patterns:

**(a) Simple SSE with a `ReadableStream`** — from the official [`streams` example](https://github.com/supabase/supabase/blob/master/examples/edge-functions/supabase/functions/streams/index.ts) **[V]**:

```ts
import { withSupabase } from 'npm:@supabase/server@^1'

const msg = new TextEncoder().encode('data: hello\r\n\r\n')

export default {
  fetch: withSupabase({ auth: 'user' }, (req, ctx) => {
    let timerId: number | undefined
    const body = new ReadableStream({
      start(controller) {
        timerId = setInterval(() => controller.enqueue(msg), 1000)
      },
      cancel() {
        if (typeof timerId === 'number') clearInterval(timerId)
      },
    })
    return new Response(body, { headers: { 'Content-Type': 'text/event-stream' } })
  }),
}
```

**(b) The pattern Supabase explicitly documents for "SSE or AI streams end before completion"** — piping an upstream LLM stream and keeping the isolate alive **[V]** ([worker timeouts and WebSocket drops](https://supabase.com/docs/guides/troubleshooting/edge-functions-worker-timeouts-and-websocket-drops), Scenario 4):

```ts
Deno.serve(async (_req) => {
  const upstream = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
    },
    body: JSON.stringify({ stream: true }),
  })

  const { readable, writable } = new TransformStream()

  // Keeps the isolate alive for the stream piping lifecycle.
  EdgeRuntime.waitUntil(upstream.body!.pipeTo(writable))

  return new Response(readable, {
    headers: { 'Content-Type': 'text/event-stream' },
  })
})
```

**Key takeaway:** `EdgeRuntime.waitUntil(pipePromise)` is **required** for long streams. Without it, the supervisor can consider the isolate idle and retire it, producing a silently truncated stream with no `[DONE]` marker — which the docs list as the exact symptom. **[V]**

### 1.6 Cold starts

- Architecture doc: a fresh V8 isolate per invocation, ESZip module graph, "cold starts … fast (milliseconds)". **[V]** — [Architecture](https://supabase.com/docs/guides/functions/architecture)
- Functions overview: "**cold starts are possible** — design for short-lived, idempotent operations. Heavy long-running jobs should be moved to background workers." **[V]**
- Troubleshooting Scenario 5 ("cold starts fail before first response", 504 / worker creation timeout): root cause is **large dependency trees or expensive top-level initialization**; the fixes are to **avoid slow top-level `await`**, **lazy-initialize heavy clients inside request handlers**, and reduce bundle size. **[V]**

**Implication for your code:** the existing `create-checkout` constructs the Stripe client **at module top level**. For the agent function, construct clients **inside** the handler (the skeleton does this) and keep the tool registry free of top-level network work.

### 1.7 Background tasks (`EdgeRuntime.waitUntil`)

Available, with these semantics **[V]** — [Background Tasks](https://supabase.com/docs/guides/functions/background-tasks):

- `EdgeRuntime.waitUntil(promise)` marks a background task; the instance keeps running until the promise settles. Callable at module scope **or** inside the handler without blocking the response.
- **Limit:** "The maximum duration is capped based on the wall-clock, CPU, and memory limits. The function will shut down when it reaches one of these limits." So a background task is **not** a way to escape the 400 s / 150 s ceiling. **[V]**
- `addEventListener('beforeunload', ev => ...)` fires on shutdown with `ev.detail?.reason` — use it to persist partial agent state. **[V]**
- Use `addEventListener('unhandledrejection', ...)` to catch promises without a rejection handler. **[V]**
- **Local dev gotcha:** CLI instances are terminated after each request, so background tasks never finish locally unless you set `[edge_runtime] policy = "per_worker"` in `supabase/config.toml`. **[V]**

**Verdict:** `waitUntil` is the right tool for *finishing a stream* or *writing an audit row after responding*, not for *extending an agent run beyond 400 s*.

### 1.8 Known issues with long-running (multi-minute) LLM calls

Consolidated from the troubleshooting page **[V]**:

| Symptom | Cause | Mitigation |
|---|---|---|
| Streaming starts but ends prematurely, no `[DONE]` | Worker hit wall clock or early retirement while forwarding a long stream | `EdgeRuntime.waitUntil(upstream.body.pipeTo(writable))` |
| Function killed at a consistent duration; 546 / cancellation | Wall clock budget exceeded | Split work; return early; stream from upstream |
| Killed by CPU limit long before wall clock | CPU and wall clock budgets are **independent** | Break synchronous loops; move heavy compute off-platform |
| `504` | No response initiated within **150 s** | Buffered agent run must stay under 150 s, or stream |
| WebSocket / SSE drops at ~½ the wall clock limit | `EarlyDrop` — isolate deemed idle | Keep a promise pending until the socket/stream closes |
| First request after idle fails (504 / worker creation timeout) | Cold start: large deps or slow top-level `await` | Lazy-init clients; shrink the bundle |

**Concrete guidance for the agent:** budget **≤ 4–6 LLM round trips** with a **60 s per-call `AbortController` timeout** (the skeleton does exactly this). Worst case 6 × 60 s = 360 s, which **exceeds the 150 s idle timeout** — so for the buffered path you must either cap the number of iterations lower, cap the total elapsed time, or **stream**. This is the single most important design decision in the whole task.

---

## 2. Securing an Edge Function that uses the `service_role` key

### 2.1 The two layers

[Authorization headers](https://supabase.com/docs/guides/functions/auth-headers) **[V]**:

| Header | Value | Used for |
|---|---|---|
| `Authorization` | `Bearer <user-jwt>` | A user signed in through Supabase Auth |
| `apikey` | `sb_publishable_...` or `sb_secret_...` | Calls from clients or services |

- **`verify_jwt` (default `true`)** is a **platform-level check before your code runs**. It validates legacy HS256 JWTs *and* JWTs signed with the new asymmetric signing keys. A missing/malformed/wrongly-signed token yields **401 before your handler executes**. **[V]**
- Publishable and secret keys are **not JWTs**, but for migration compatibility `verify_jwt` accepts them on either header. **Do not** send an API key as a bearer token — the platform check may pass but you cannot verify it as a JWT. **[V]**
- Per-function control in `supabase/config.toml`:
  ```toml
  [functions.stripe-webhook]
  verify_jwt = false
  ```
  **[V]** — [Function Configuration](https://supabase.com/docs/guides/functions/function-configuration)

> **Note for your repo:** there is **no `supabase/config.toml`** committed, so `verify_jwt` is at its default (`true`) for all five functions — including `stripe-webhook`, which Stripe cannot send a Supabase JWT to. Verify how that function is actually deployed (likely `--no-verify-jwt`). Adding a `config.toml` would make this explicit.

### 2.2 Reading the JWT and verifying it — exact code

Supabase's own documented `getUser(jwt)` pattern **[V]** ([Integrating With Supabase Auth](https://supabase.com/docs/guides/functions/auth-legacy-jwt)):

```ts
import { createClient } from 'npm:@supabase/supabase-js@2'

const supabaseClient = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_ANON_KEY') ?? '',
  {
    global: {
      headers: { Authorization: req.headers.get('Authorization')! },
    },
  }
)

const authHeader = req.headers.get('Authorization')!
const token = authHeader.replace('Bearer ', '')
const { data } = await supabaseClient.auth.getUser(token)
```

**Harden the parsing** — `replace('Bearer ', '')` fails on `bearer `, extra whitespace, or a missing scheme. Use:

```ts
const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '').trim()
```

**Fetching role/claims.** The user object from `getUser()` carries `id`, `email`, `role`, `app_metadata`, `user_metadata`. `app_metadata` is writable **only** with the service role, so it is trustworthy for authorization. **`user_metadata` is user-writable — never authorize on it.** **[C]** (well-established Supabase semantics; the docs discuss claims in [Custom Claims & RBAC](https://supabase.com/docs/guides/api/custom-claims-and-role-based-access-control-rbac) **[V]**).

### 2.3 Verifying the caller is THE admin (not merely any authenticated user)

**Why `auth.role() = 'authenticated'` is insufficient.** On a project with **public signup enabled**, anyone can `signUp()` and receive a valid JWT whose `role` claim is `authenticated`. That claim asserts *"this principal has a Supabase account in this project"* — it is an **authentication** fact, not an **authorization** one. An admin surface gated on it is effectively public. The JWT payload documented by Supabase confirms `role` is just "the Postgres role to use when applying RLS policies" (e.g. `authenticated`), not an app role. **[V]** — [JSON Web Token (JWT)](https://supabase.com/docs/guides/auth/jwts)

**Recommended mechanism: an `admin_users` allowlist table checked with the service role.** This is the strongest option because:

- The service role **bypasses RLS**, so no client-side policy can widen it.
- RLS enabled with **zero policies** = deny-by-default for `anon`/`authenticated`.
- It is trivially auditable and revocable (delete a row) with no JWT re-issue needed.

```sql
create table public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'admin',
  created_at timestamptz not null default now()
);
alter table public.admin_users enable row level security;  -- no policies
```

```ts
const { data: adminRow, error } = await admin   // service-role client
  .from('admin_users')
  .select('user_id, role')
  .eq('user_id', user.id)
  .maybeSingle()
if (error) return json({ error: 'authorization_check_failed' }, 500, headers)
if (!adminRow) return json({ error: 'forbidden' }, 403, headers)
```

Full working version in [`supabase/functions/admin-agent/index.ts`](../supabase/functions/admin-agent/index.ts) and [`supabase/admin_users.sql`](../supabase/admin_users.sql).

**Alternative: a custom claim via the Custom Access Token Auth Hook.** Supabase documents a `custom_access_token_hook(event jsonb)` PL/pgSQL function that adds e.g. `user_role` to the JWT before issuance, backed by `user_roles` / `role_permissions` tables, with RLS `authorize()` helpers. **[V]** — [Custom Claims & RBAC](https://supabase.com/docs/guides/api/custom-claims-and-role-based-access-control-rbac)

Trade-offs:

| Mechanism | Pros | Cons |
|---|---|---|
| **`admin_users` allowlist (recommended)** | Revocation is instant (DB write); no hook deployment; no JWT re-issue; service-role-read so unforgeable | One extra DB round-trip per request (~ms) |
| **Custom access token hook + claim** | Zero extra query; claim available in RLS on the *user's own* client too | Requires auth-hook deployment; **revocation lags until the access token expires** (default 1 h); a stale token keeps admin rights |
| **`app_metadata.role = 'admin'`** | No hook, no extra table; service-role-writable so unforgeable | Still baked into the token → same revocation lag; easy to set inconsistently |

**Belt-and-braces recommendation:** check the `admin_users` allowlist **as the authority** (instant revocation), and optionally also require `app_metadata.role === 'admin'` as a second factor. Never rely on the claim alone for a destructive-action surface.

### 2.4 `getUser()` vs `getSession()` vs `getClaims()` — including the 2025+ asymmetric-key change

- **`getSession()`** — reads the session from local storage/client state. In an Edge Function there is no session to read; **it is not an authorization primitive** and does not validate a passed token against the Auth server. Do not use it for this.
- **`getUser(jwt)`** — **[V]** "Gets the current user details if there is an existing session. **This method performs a network request to the Supabase Auth server, so the returned value is authentic and can be used to base authorization rules on.**" ([reference](https://supabase.com/docs/reference/javascript/auth-getuser))
- **`getClaims(jwt)`** — **[V]** "Extracts the JWT claims present in the access token by first **verifying the JWT against the server's JSON Web Key Set endpoint `/.well-known/jwks.json`** which is often cached, resulting in significantly faster responses. **Prefer this method over `GoTrueClient.getUser` which always sends a request to the Auth server for each JWT.** If the project is not using an asymmetric JWT signing key (like ECC or RSA) it always sends a request to the Auth server (similar to `getUser`)." ([reference](https://supabase.com/docs/reference/javascript/auth-getclaims))

**The 2025 change: asymmetric JWT signing keys.** From [JWT Signing Keys](https://supabase.com/docs/guides/auth/signing-keys) **[V]**:

- The **legacy shared JWT secret** is "**No longer recommended.** Available for backward compatibility."
- The new **signing keys** system supports asymmetric keys (**ES256** P-256 preferred, **RS256**, EdDSA coming) plus shared-secret HS256.
- Public keys are exposed at:
  ```
  GET https://project-id.supabase.co/auth/v1/.well-known/jwks.json
  ```
- **Caching:** the discovery endpoint is cached by Supabase edge servers for **10 minutes**; client libraries may cache keys in memory for **another 10 minutes**; the multi-level cache is **cleared every 20 minutes**. Supabase's own products (Auth, Data API, Storage, Realtime) **do not rely on this cache**, so revocation is instantaneous for them.
- **Benefits of asymmetric keys:** local, fast JWT validation that does not put the Auth server in the hot path; automatic revocation via the discovery endpoint; zero-downtime rotation that does not sign users out.
- **⚠ Migration warning that directly affects your project:** during rotation, "**If you're using Edge Functions that have the Verify JWT setting, continuing with the rotation might break your app. You will need to turn off this setting**" and verify in code instead using `supabase.auth.getClaims()`.

**Recommendation:** if the project is still on the legacy HS256 JWT secret, **migrate to an asymmetric signing key**, then use `getClaims(jwt)` for verification (local JWKS check) and fall back to `getUser(jwt)` when `getClaims` errors. The skeleton implements exactly this fallback chain. Because you verify in code, you may also consider `verify_jwt = false` on this specific function for full control — but leaving it `true` gives you defence in depth (the platform rejects garbage before your code runs).

### 2.5 CORS for a browser SPA

**[V]** — [CORS support for invoking from the browser](https://supabase.com/docs/guides/functions/cors):

**(a) Automatic** — `withSupabase` from `npm:@supabase/server` handles CORS and `OPTIONS` preflight for you:

```ts
export default {
  fetch: withSupabase({ auth: 'user' }, async (req, ctx) => {
    return Response.json({ ok: true })
  }),
}
```

**(b) Manual, using the SDK's own header set (recommended for `@supabase/supabase-js` v2.95.0+)** — import `corsHeaders` from `npm:@supabase/supabase-js@^2/cors` so it stays in sync with the client libraries:

```ts
import { corsHeaders } from 'npm:@supabase/supabase-js@^2/cors'

export default {
  fetch: async (req) => {
    if (req.method === 'OPTIONS') {
      return Response.json({ ok: true }, { headers: corsHeaders })
    }
    // ...
  },
}
```

**Your repo currently uses `'Access-Control-Allow-Origin': '*'`.** That is tolerable for a bearer-token admin endpoint (no cookies are sent, so `*` does not enable credentialed cross-origin reads), but it is the wrong default for an admin surface. **Recommendation:** echo a specific allowlisted `Origin` (the skeleton reads `ALLOWED_ORIGINS`), return `Vary: Origin`, and include `authorization` in `Access-Control-Allow-Headers` (already present in your existing functions). Note that the preflight `OPTIONS` request must succeed **without** a valid JWT, so handle it before any auth logic — the skeleton returns `204` first.

---

## 3. Calling LLM APIs from Deno — current recommended patterns

### 3.1 The one decision that shapes everything: which API surface

| Provider | Current recommendation | Endpoint | Tool calling | Notes |
|---|---|---|---|---|
| **OpenAI** | **Responses API** | `POST /v1/responses` | `function_call` items + `function_call_output` with `call_id` | "While Chat Completions remains supported, **Responses is recommended for all new projects.**" **GPT-6 Astra requires the Responses API for tool calling.** **[V]** |
| **OpenAI (legacy)** | Chat Completions | `POST /v1/chat/completions` | `message.tool_calls[]` + `role:"tool"` messages | From GPT-5.4, **Chat Completions does not support tool calling with `reasoning_effort` other than `none`**. **[V]** |
| **Anthropic** | Messages API | `POST /v1/messages` | `tool_use` blocks → `tool_result` blocks | Loop on `stop_reason == "tool_use"`. **[V]** |
| **Google Gemini** | Interactions API (new) **or** OpenAI-compat | `https://generativelanguage.googleapis.com/v1beta/openai/` | OpenAI-shaped `tools` | The direct API now uses `client.interactions.create(...)` with `steps[].type == "function_call"`. **[V]** |
| **DeepSeek** | OpenAI-compatible (also Anthropic-compatible) | `https://api.deepseek.com` | OpenAI-shaped `tools` | base_url (Anthropic): `https://api.deepseek.com/anthropic`. **[V]** |

**Practical consequence:** a single OpenAI-compatible client with a configurable `base_url` covers **OpenAI, DeepSeek, and Gemini**. Only Anthropic needs a second adapter. The skeleton is written against the OpenAI-compatible surface for exactly this reason.

**OpenAI Responses vs Chat Completions — the concrete deltas [V]** ([Migrate to the Responses API](https://developers.openai.com/api/docs/guides/migrate-to-responses)):

| Concept | Chat Completions | Responses |
|---|---|---|
| Endpoint | `POST /v1/chat/completions` | `POST /v1/responses` |
| Input | `messages[]` | `input` (string or Items) |
| System prompt | a `system` message | top-level `instructions` |
| Output | `choices[0].message.content` | `response.output_text`, or iterate typed `output` Items |
| Tool call | `message.tool_calls[]` | an output Item of `type: "function_call"` (`call_id`, `name`, `arguments`) |
| Tool result | `{role:"tool", tool_call_id, content}` | `{type:"function_call_output", call_id, output}` |
| Structured output | `response_format` | `text.format` |
| State | resend the whole `messages` array | `previous_response_id`, or replay `output` Items |
| Streaming | `choices[].delta` chunks | typed SSE events (`response.output_text.delta`, `response.function_call_arguments.delta`, `response.completed`) |

**Two warnings straight from the docs [V]:**
1. **Reasoning items must be passed back.** "For reasoning models like GPT-5 or o4-mini, any reasoning items returned in model responses with tool calls must also be passed back with tool call outputs." Dropping them degrades accuracy.
2. **`previous_response_id` does not carry `instructions`**, and **prior input tokens in the chain are still billed** as input tokens. Chain-linking is not a billing shortcut.

### 3.2 Exact request/response JSON for a tool-calling round trip

#### OpenAI Responses API (recommended for OpenAI) **[V]**

Request 1:
```json
{
  "model": "gpt-6-astra",
  "instructions": "You are a store admin assistant.",
  "tools": [
    {
      "type": "function",
      "name": "list_orders",
      "description": "List orders, newest first.",
      "parameters": {
        "type": "object",
        "properties": {
          "status": { "type": "string", "enum": ["paid","pending","refunded"] },
          "limit": { "type": "integer" }
        },
        "required": [],
        "additionalProperties": false
      },
      "strict": true
    }
  ],
  "input": [{ "role": "user", "content": "How many refunded orders today?" }]
}
```

Response 1 (`output` array; note the reasoning item must be echoed back):
```json
{
  "id": "resp_68af4030592c81938ec0a5fbab4a3e9f05438e46b5f69a3b",
  "object": "response",
  "output": [
    { "id": "rs_...", "type": "reasoning", "content": [], "summary": [] },
    {
      "id": "fc_12345xyz",
      "call_id": "call_12345xyz",
      "type": "function_call",
      "name": "list_orders",
      "arguments": "{\"status\":\"refunded\",\"limit\":20}"
    }
  ]
}
```

Request 2 — append the tool output **and** the preserved model output:
```json
{
  "model": "gpt-6-astra",
  "tools": [ /* same array */ ],
  "input": [
    { "role": "user", "content": "How many refunded orders today?" },
    { "type": "reasoning", "id": "rs_...", "content": [], "summary": [] },
    { "type": "function_call", "id": "fc_12345xyz", "call_id": "call_12345xyz",
      "name": "list_orders", "arguments": "{\"status\":\"refunded\",\"limit\":20}" },
    { "type": "function_call_output", "call_id": "call_12345xyz",
      "output": "{\"count\":3,\"orders\":[...]}" }
  ]
}
```

Then loop: **while `output` contains a `function_call` item, execute and append.** Exit when it contains only `message` items; read `response.output_text`.

#### OpenAI-compatible Chat Completions (OpenAI legacy / DeepSeek / Gemini-compat) **[V]**

Request 1:
```json
{
  "model": "deepseek-flash",
  "messages": [
    { "role": "system", "content": "You are a store admin assistant." },
    { "role": "user", "content": "How many refunded orders today?" }
  ],
  "tools": [
    {
      "type": "function",
      "function": {
        "name": "list_orders",
        "description": "List orders, newest first.",
        "parameters": {
          "type": "object",
          "properties": {
            "status": { "type": "string", "enum": ["paid","pending","refunded"] },
            "limit": { "type": "integer" }
          },
          "required": []
        }
      }
    }
  ],
  "tool_choice": "auto"
}
```

Response 1:
```json
{
  "choices": [{
    "finish_reason": "tool_calls",
    "message": {
      "role": "assistant",
      "content": null,
      "tool_calls": [{
        "id": "call_abc123",
        "type": "function",
        "function": { "name": "list_orders", "arguments": "{\"status\":\"refunded\",\"limit\":20}" }
      }]
    }
  }],
  "usage": { "prompt_tokens": 412, "completion_tokens": 38 }
}
```

Request 2 — **echo the assistant message verbatim** (including `tool_calls`), then append one `tool` message **per tool call**:
```json
{
  "model": "deepseek-flash",
  "messages": [
    { "role": "system", "content": "You are a store admin assistant." },
    { "role": "user", "content": "How many refunded orders today?" },
    { "role": "assistant", "content": null,
      "tool_calls": [{ "id": "call_abc123", "type": "function",
        "function": { "name": "list_orders", "arguments": "{\"status\":\"refunded\",\"limit\":20}" } }] },
    { "role": "tool", "tool_call_id": "call_abc123",
      "content": "{\"count\":3,\"orders\":[...]}" }
  ],
  "tools": [ /* same array */ ]
}
```

**Loop condition:** continue while `choices[0].finish_reason === "tool_calls"` (or `message.tool_calls` is non-empty); stop on `"stop"` and read `message.content`. **`tool_call_id` must match `tool_calls[].id` exactly** or the API returns a 400.

#### Anthropic Messages API **[V]**

Request 1:
```json
{
  "model": "claude-haiku-4-5",
  "max_tokens": 1024,
  "system": "You are a store admin assistant.",
  "tools": [
    {
      "name": "list_orders",
      "description": "List orders, newest first.",
      "input_schema": {
        "type": "object",
        "properties": {
          "status": { "type": "string", "enum": ["paid","pending","refunded"] },
          "limit": { "type": "integer" }
        },
        "required": []
      }
    }
  ],
  "messages": [{ "role": "user", "content": "How many refunded orders today?" }]
}
```

Response 1 — `stop_reason: "tool_use"`:
```json
{
  "id": "msg_01Aq9w938a90dw8q",
  "model": "claude-haiku-4-5",
  "stop_reason": "tool_use",
  "role": "assistant",
  "content": [
    { "type": "text", "text": "I'll check the refunded orders for you." },
    { "type": "tool_use", "id": "toolu_01A09q90qw90lq917835lq9",
      "name": "list_orders", "input": { "status": "refunded", "limit": 20 } }
  ]
}
```

Request 2 — **append the assistant turn, then a `user` message carrying `tool_result` blocks**:
```json
{
  "model": "claude-haiku-4-5",
  "max_tokens": 1024,
  "system": "You are a store admin assistant.",
  "tools": [ /* same array */ ],
  "messages": [
    { "role": "user", "content": "How many refunded orders today?" },
    { "role": "assistant", "content": [
        { "type": "text", "text": "I'll check the refunded orders for you." },
        { "type": "tool_use", "id": "toolu_01A09q90qw90lq917835lq9",
          "name": "list_orders", "input": { "status": "refunded", "limit": 20 } }
    ]},
    { "role": "user", "content": [
        { "type": "tool_result", "tool_use_id": "toolu_01A09q90qw90lq917835lq9",
          "content": "{\"count\":3,\"orders\":[...]}" }
    ]}
  ]
}
```

**Formatting rules that cause 400s if violated [V]:**
- `tool_result` blocks **must come FIRST** in the user message's `content` array; any text must come **after** all tool results.
- Tool results **must immediately follow** their corresponding `tool_use` blocks — no intervening messages.
- On failure, set **`is_error: true`** and put an **instructive** message in `content` (e.g. `"Rate limit exceeded. Retry after 60 seconds."`). Claude incorporates it and will retry 2–3 times with corrections.
- **Loop condition:** `while (stop_reason === "tool_use")`. Exit on `end_turn`, `max_tokens`, `stop_sequence`, or `refusal`. **[V]**
- **Security note from the docs:** tool results often carry untrusted content; keep it inside `tool_result` blocks rather than system prompts to reduce indirect prompt-injection risk. **[V]**

### 3.3 Streaming shapes

**OpenAI Responses** — typed SSE: `response.created`, `response.output_text.delta`, `response.function_call_arguments.delta`, `response.function_call_arguments.done`, `response.completed`, `error`. Accumulate tool arguments by `output_index`. **[V]**

**Anthropic** — event flow: `message_start` → (`content_block_start` → `content_block_delta`* → `content_block_stop`)* → `message_delta`* → `message_stop`. Tool arguments arrive as **partial JSON strings**:

```
event: content_block_delta
data: {"type":"content_block_delta","index":1,"delta":{"type":"input_json_delta","partial_json":"{\"location\": \"San Fra"}}
```

Accumulate the string deltas and `JSON.parse` once at `content_block_stop`; current models emit one complete key/value at a time, so **expect pauses between events while the model works**. Usage arrives on `message_delta` and is **cumulative**; watch `cache_creation_input_tokens` / `cache_read_input_tokens`. **[V]**

**Chat Completions** — `choices[].delta` chunks; accumulate `delta.tool_calls[i].function.arguments` by index.

### 3.4 Deno/edge-specific gotchas

| Gotcha | Guidance |
|---|---|
| **No Node SDK by default** | Import with an `npm:` specifier — `npm:openai@^4`, `npm:@supabase/supabase-js@2` — or call the REST API with `fetch`. Node builtins need `node:` (`node:process`). **[V]** |
| **`esm.sh` vs `npm:`** | Your repo uses `https://esm.sh/...`. It works, but `npm:` is what current docs recommend and avoids a third-party build CDN in the cold-start path. **[V]** |
| **`fetch` streaming** | `response.body` is a `ReadableStream`. Use `pipeTo` / `TransformStream` to forward it, and **`EdgeRuntime.waitUntil(pipePromise)`** or the isolate may retire early and truncate. **[V]** |
| **Timeouts** | There is no built-in per-request LLM timeout. Use `AbortController` + `setTimeout(..., ms)` and always `clearTimeout` in a `finally`. Deno has `AbortSignal.timeout(ms)` too, but the explicit controller lets you distinguish a timeout from a caller cancellation. |
| **CPU vs I/O accounting** | `await fetch(...)` consumes ~no CPU, but **`JSON.parse` of a large tool result does**. Cap tool-result size (the skeleton truncates at 12,000 chars) and prefer SQL-side `limit`/aggregation over fetching rows and reducing in JS. **[V]** |
| **Top-level initialization** | Construct clients and any heavy objects **inside** the handler; slow top-level `await` is a documented cold-start failure cause. **[V]** |
| **`node:http` servers don't apply** | You are not running a server you control; use the handler/`Deno.serve` model. Web Worker API and Node `vm` are **not available**. **[V]** |
| **No multithreading npm packages** | e.g. `sharp`, `libvips` are unsupported. **[V]** |
| **Outbound ports** | 25 and 587 are blocked — irrelevant for LLM APIs (443). **[V]** |
| **Secrets** | `Deno.env.get('LLM_API_KEY')`; store via `supabase secrets set`. Names cannot start with `SUPABASE_`. **[V]** |
| **Anthropic needs a browser-safety header** | When calling Anthropic from a *browser* you must send `anthropic-dangerous-direct-browser-access: true`. From an Edge Function (server-side) this is **not** needed. **[U]** (not re-verified this session) |

---

## 4. Cost/pricing comparison for a low-volume admin agent

**Volume model used:** 200 user requests/day × 2 LLM round trips = **400 calls/day → 12,000 calls/month**. Per call: **4,000-token cached system prompt** (schema + tool defs) + **2,000 tokens** conversation/tool results, **500 output tokens**. Monthly: **72M input tokens** (48M prefix + 24M conversation), **6M output tokens**.

### 4.1 Current per-million-token prices **[V]** (official pricing pages)

**OpenAI** — [pricing](https://developers.openai.com/api/docs/pricing) · [prompt caching](https://developers.openai.com/api/docs/guides/prompt-caching)

| Tier / model | Input /1M | Cached input /1M | Cache write /1M | Output /1M |
|---|---|---|---|---|
| Small: `gpt-5.6-luna` | $0.20 | $0.02 (0.1×) | $0.25 (1.25×) | $1.20 |
| Mid: `gpt-6-sol` | $2.00 | $0.20 | $2.50 | $10.00 |
| Frontier: `gpt-6-astra` | $10.00 | $1.00 | $12.50 | $50.00 |
| Legacy `gpt-5-mini` | $0.25 | $0.025 | no write charge | $2.00 |
| Legacy `gpt-4.1-mini` | $0.40 | $0.10 (0.25×) | no write charge | $1.60 |
| Legacy `gpt-4o-mini` | $0.15 | $0.075 (0.5×) | no write charge | $0.60 |

**Anthropic** — [pricing](https://platform.claude.com/docs/en/about-claude/pricing) · [prompt caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)

| Tier / model | Input /1M | 5-min write | 1-h write | Cache read | Output /1M |
|---|---|---|---|---|---|
| Small: `claude-haiku-4-5` | $1 | $1.25 (1.25×) | $2 (2×) | $0.10 (0.1×) | $5 |
| Mid: `claude-sonnet-5` | $2 | $2.50 | $4 | $0.20 (0.1×) | $10 |
| Frontier: `claude-opus-5-5` | $4 | $5 | $8 | $0.20 (0.05×) | $20 |
| Frontier+: `claude-fable-5-1` | $10 | $12.50 | $20 | $0.25 (0.025×) | $50 |

**Google Gemini** — [pricing](https://ai.google.dev/gemini-api/docs/pricing) · [caching](https://ai.google.dev/gemini-api/docs/caching)

| Tier / model | Input /1M | Cached input /1M | Output /1M |
|---|---|---|---|
| Small: `gemini-3.8-flash` | **$0.75** intro (→ $1.50 from 2027-01-01) | **$0.075** intro (→ $0.15) | **$3.75** intro (→ $7.50) |
| Frontier: `gemini-3.1-pro-preview` | $2 (<200k) / $4 (>200k) | not verified (~10% assumed) | $12 (<200k) / $18 (>200k) |
| Cheaper small: `gemini-3.1-flash-lite` | $0.25 text/image/video | not verified | $1.50 |

**DeepSeek** — [pricing](https://api-docs.deepseek.com/quick_start/pricing) · [context caching](https://api-docs.deepseek.com/guides/kv_cache)

| Tier | Cache hit /1M | Cache miss /1M | Output /1M |
|---|---|---|---|
| Small: `deepseek-flash` (off-peak / peak) | $0.003 / $0.006 | $0.15 / $0.30 | $0.60 / $1.20 |
| Frontier: `deepseek-v4-pro` (off-peak / peak) | $0.022 / $0.044 | $0.66 / $1.32 | $1.98 / $3.96 |

> **Brief-relative correction:** the brief asked about `deepseek-chat` / `deepseek-reasoner` and `gpt-4o-mini` / `claude-haiku` / `gemini-2.5-flash`. Those names are **legacy or removed** on the current docs; current names are above. Legacy prices are included where verified.

### 4.2 Prompt caching: how it works and what it saves

| Provider | Mechanism | Read discount | Write cost | Min cacheable prefix | TTL |
|---|---|---|---|---|---|
| **OpenAI** | **Automatic** by default; prefix matching over system + developer messages, **tool definitions**, and history | **0.1×** on GPT-5.6+ (0.25× gpt-4.1-mini, 0.5× gpt-4o-mini) | **1.25×** on GPT-5.6+; none on older models | **1,024 visible input tokens** (GPT-5.6+); older = "varies" | `prompt_cache_options.ttl: "30m"` (GPT-5.6+); older: `in_memory` ~5–10 min idle or `24h` |
| **Anthropic** | **Explicit**: `cache_control: {"type":"ephemeral"}`; max **4 breakpoints** | **0.1×** (0.05× Opus 5.5, 0.025× Fable 5.1) | **1.25×** (5-min TTL), **2×** (1-h TTL) | **512** (Opus 5.5/Fable 5.1) · **1,024** (Sonnet 5) · **2,048** (Opus 4.7, Haiku 3.5) · **4,096** (Haiku 4.5, Opus 4.6/4.5) | 5 min default, refreshed free on use; `ttl:"1h"` available |
| **Gemini** | **Implicit** caching on by default for 2.5+ (free, best-effort); **Explicit** caching creates a cache object (Beta) | **~10%** of input on 3.8 Flash | Explicit caching billed as **storage** (price **[U]**) | **4,096** (Gemini 3.x, 3.1 Pro) · **2,048** (2.5 Flash/Pro) | Implicit: managed. Explicit: default **1 hour**, configurable |
| **DeepSeek** | **Automatic**, on by default, **no write fee** | cache-hit rate (e.g. $0.003 vs $0.15 miss on flash) | none (misses billed at miss rate) | none documented | "a few hours to a few days", best-effort |

**⚠ The trap that applies directly to the brief's numbers:** a **4,000-token** system prompt sits **just below the 4,096-token minimum** for **Claude Haiku 4.5** and **Gemini 3.x**. Caching then **silently does not engage** (the request succeeds, uncached, with no error). **Fix: put the tool definitions inside the cached block** so the static prefix comfortably exceeds 4,096 tokens. **[V]**

**Savings at this volume (200 req/day):**

| Provider / tier | No caching | Caching (warm) | Saving |
|---|---|---|---|
| OpenAI `gpt-5.6-luna` | $21.60 | **$12.99** | 40% |
| OpenAI `gpt-6-sol` | $204.00 | $117.88 | 42% |
| OpenAI `gpt-6-astra` | $1,020.00 | $589.38 | 42% |
| Anthropic Haiku 4.5 * | $102.00 | $58.94 | 42% |
| Anthropic Sonnet 5 | $204.00 | $117.88 | 42% |
| Anthropic Opus 5.5 | $408.00 | $226.18 | 45% |
| Gemini 3.8 Flash (intro) * | $76.50 | $44.18 | 42% |
| Gemini 3.1 Pro (<200k) | $216.00 | $129.82 | 40% |
| **DeepSeek flash — off-peak** | $14.40 | **$7.36** | 49% |
| DeepSeek flash — peak | $28.80 | $14.72 | 49% |

\* Only if the cached prefix is padded above 4,096 tokens.

"Warm" assumes one 4,000-token cache write per day and cache reads for the rest. **If your traffic is bursty enough that every request re-writes the cache, the saving collapses from ~42% to ~15%.**

### 4.3 Recommendation

**Cost is not the deciding factor at this volume.** Total monthly spread across small tiers is roughly **$7–$60**; even an uncached top-tier model is ~$1,020/month, and cached frontier is $226–$589. Optimize for **schema fidelity and tool-call reliability**, not price.

- **Default to a small/fast tier with caching engaged.** Cheapest: **DeepSeek `deepseek-flash` off-peak (~$7–14/mo)** with automatic caching and no minimum. If you want a US/EU provider with fully documented caching semantics: **OpenAI `gpt-5.6-luna` (~$13–22/mo)**. **Claude Haiku 4.5** ($102 → ~$59 with caching) and **Gemini 3.8 Flash** ($76.50 → ~$44) are fine **only if you pad the cached prefix past 4,096 tokens.**
- **Escalate per request, not globally.** Route to **Claude Sonnet 5** (~$118–204/mo) or **Gemini 3.1 Pro** (~$130–216/mo) when the small model fails schema validation, emits a malformed tool call, or the request is explicitly multi-step. Reserve **Claude Opus 5.5** / **`gpt-6-astra`** for genuinely hard, rare work.
- **Caching hygiene is the highest-leverage cost lever.** Keep the schema + tool definitions **byte-stable and first** in the prompt — no timestamps, no per-user content, no reordering — and **append** rather than rewrite. For Anthropic, place an explicit breakpoint after the static prefix and use the **1-hour TTL** (the 2× write premium is ~$0.09/month here, while a 5-minute TTL will miss on ordinary gaps between admin requests).
- **Also consider the Edge Function invocation cost:** $2 per 1M invocations beyond quota (Free 500k, Pro/Team 2M). 200/day ≈ 6,000/month — **irrelevant**. **[V]** — [Functions pricing](https://supabase.com/docs/guides/functions/pricing)

---

## 5. Alternatives if Edge Function limits bite

### 5.1 The decision boundary

The Edge Function limits are **2 s CPU / 400 s wall clock (150 s Free) / 150 s idle timeout / 250–256 MB**. Move off Edge Functions only if you need **any** of:

1. A single agent run longer than ~400 s (or longer than 150 s without streaming).
2. Sustained CPU-bound work (heavy JSON/embedding computation) beyond 2 s per request.
3. Stateful, long-lived agent sessions (multi-minute interactive conversations held open server-side).
4. A background worker that polls a queue continuously.

For **200 requests/day with 2–6 LLM round trips each**, none of these apply — **stay on Edge Functions**, and stream if round-trip latency becomes a problem.

### 5.2 Supabase's own options for long-running / background work

**Headline: Supabase has no container / long-lived-process / background-worker product.** The [pricing page](https://supabase.com/pricing) Compute add-ons (Micro $10 → 16XL $3,730) size the **Postgres instance only**. There is no container, VM, or worker SKU, and a read of [supabase.com/changelog](https://supabase.com/changelog) (entries through 2026-09-25) shows **no long-running-functions or background-worker product**. **[V]** — *(the 2025 changelog archive was not exhaustively paged; treat "no such product launched in 2025" as **[U]**)*

**The only documented escape from hosted limits is self-hosting.** [Self-Hosting Functions](https://supabase.com/docs/reference/self-hosting-functions/introduction) documents the `supabase/edge-runtime` Docker image — and Supabase's own demo runs it **on Fly.io**. It is explicitly labelled **"Beta Version… There will be breaking changes."** **[V]**

| Supabase offering | What it actually is | Concrete limits | Fit for an agent loop |
|---|---|---|---|
| **Supabase Cron** (pg_cron) | Postgres module; jobs in `cron.job`, runs in `cron.job_run_details` | **Minimum granularity 1 second** (requires PG 15.1.1.61+); **recommended ≤ 8 concurrent jobs**; **recommended max ~10 min per job** (recommendations, *not* enforced caps); documented pattern is `net.http_post(..., timeout_milliseconds := 5000)` | Good for **scheduled** agent work, not interactive loops |
| **Supabase Queues** (pgmq) | **Pull-based** FIFO queue, at-least-once within a visibility window; requires PG 15.6.1.143+ | Basic (durable) vs Unlogged (fast, may lose messages) types; API `send`/`read`/`pop`/`archive`/`delete`; visibility window = `sleep_seconds`; **no built-in push consumer** | Excellent **durability layer**; the consumer still runs on the Edge Function runtime |
| **`pg_net`** | Async HTTP from Postgres; fires **only after commit** | `timeout_milliseconds` **default 2000** (no documented maximum **[U]**); **~200 requests/sec** reliable ceiling, beyond which "instability"; responses retained **6 hours** in **unlogged** tables (lost on crash); **POST+JSON only** | Trigger mechanism, not a compute host |
| **Database Webhooks** | Convenience wrapper over pg_net triggers | Still current; legacy `supabase_functions.http_request(url, method, headers, body, timeout)` form still documented | Event-driven agent kicks |
| **`EdgeRuntime.waitUntil`** | Background work in the same isolate | **Same wall-clock/CPU/memory caps** — not an escape hatch **[V]** | Finish streams; write audit rows |
| **Supavisor** (pooler) | Connection pooler | Pooler ceilings by compute: Micro **200** pooler / **60** direct → 16XL 12,000/500. Documented failure: **"Max client connections reached"** | **Critical** if you move the loop to an always-on external worker |
| **Realtime Broadcast** | Push channel to the browser | Payload **256 KB Free / 3,000 KB Pro**; DB broadcasts stored in `realtime.messages`, deleted after **3 days** (≥72 h, ≤4 days); Broadcast Replay `limit` max **25**; plan limits: Free 200 connections / 100 msg/s → Pro 500/500, Pro (no spend cap) 10,000/2,500 | **The right progress channel** for a long agent run |

**Two Realtime gotchas that will bite:** (1) `realtime.send()` from the DB does **not** create the daily partition — a client must connect first, or you get `WarnSendingBroadcastMessage` and the insert fails. (2) Use **Broadcast**, not Presence — the docs warn that rapid `track()` "will flood the channel and cause performance problems". **[V]**

### 5.3 Generic alternatives — concrete time limits

**Vercel** — **[V]** [Functions limits](https://vercel.com/docs/functions/limitations) · [Max duration](https://vercel.com/docs/functions/configuring-functions/duration) · [Cron usage & pricing](https://vercel.com/docs/cron-jobs/usage-and-pricing) · [Workflows](https://vercel.com/docs/workflows)

| | Default | Maximum | Extended max |
|---|---|---|---|
| Hobby | 300 s | **300 s** | — |
| Pro | 300 s | **800 s** (GA) | **1800 s (30 min) Beta** |
| Enterprise | 300 s | 800 s | 1800 s Beta |

- Edge runtime: must **begin a response within 25 s**, can **stream up to 300 s**. Vercel now says *"We recommend migrating from edge to Node.js"* and **`runtime = 'edge'` is unsupported from Next.js 16.3 onward**. Both runtimes run on **Fluid compute**.
- Memory: Hobby 2 GB/1 vCPU fixed; Pro max **4 GB/2 vCPU**. Body limit **4.5 MB**. Streaming supported.
- **Cron:** 100 jobs/project on all plans; **Hobby = once per day only** (±59 min precision) and sub-daily expressions **fail deployment**; Pro = once per minute.
- **Vercel Workflows:** **max run duration = no limit; max `sleep` = no limit.** 10,000 steps/run, 25,000 events/run, 50 MB payload, 2 GB state. Retention Hobby 1 day / Pro 7 days.

**Cloudflare Workers** — **[V]** [Workers limits](https://developers.cloudflare.com/workers/platform/limits/) · [DO limits](https://developers.cloudflare.com/durable-objects/platform/limits/) · [Workflows limits](https://developers.cloudflare.com/workflows/reference/limits/)

| Limit | Workers Free | Workers Paid |
|---|---|---|
| **CPU per HTTP request** | **10 ms** | **30 s default, 5 min max** |
| Memory per isolate | 128 MB | 128 MB |

**Wall-clock by invocation type:** incoming HTTP request — **unlimited while the client stays connected**; Durable Object RPC/HTTP — **unlimited while the caller stays connected**; Workflows per step — **unlimited**; Cron Trigger / Queue consumer / DO alarm handler — **15 min**; `ctx.waitUntil()` — **30 s** after response.

- **Durable Objects** (the long-lived-agent primitive): CPU **30 s default → 5 min configurable** (`limits.cpu_ms = 300000`); **every inbound HTTP request or WebSocket message resets the CPU timer**; 10 GB storage per SQLite-backed DO; **WebSocket Hibernation API** means *"Billable Duration (GB-s) charges do not accrue during hibernation"*; alarms are at-least-once with **6 retries** and exponential backoff from 2 s. **⚠ Deploying a new version disconnects all WebSockets.**
- **Pricing: $5/month minimum** (Paid) — 10M requests + 30M CPU-ms included. **The 10 ms free-tier CPU means Workers Paid is mandatory for an agent loop.**

**Fly.io** — **[V]** [Pricing](https://docs.fly.io/about/pricing) · [Autostop](https://docs.fly.io/launch/autostop-autostart)
- shared-cpu-1x **256 MB ≈ $1.94/30 d**, 512 MB ≈ $3.19/30 d *(figures computed from published per-second rates `$0.00000075/vCPU-s` + `$0.00000193/GB-s`, not quoted)*. Stopped machines cost **$0.15/GB/30 d** rootfs only.
- A running Machine has **no wall-clock or CPU cap** beyond its RAM allocation.
- **Set `auto_stop_machines = "off"` (or `min_machines_running = 1`)** so the process isn't reaped mid-loop.

**Railway** — **[V]** [Pricing](https://railway.com/pricing): Hobby **$5/mo including $5 credit**; memory **≈$10/GB-month**, CPU **≈$20/vCPU-month**; a 0.5 GB always-on service ≈ **$5/mo memory** → realistic **~$5–10/mo**. Sandboxes (ephemeral VMs for untrusted code) ≈ $50/GB-month.

**Also surveyed:** **Render** — free tier is **web services only**; **background workers and cron are paid-only**; free web services **spin down after 15 min idle** (~1 min cold start). **Deno Deploy** — 512 MB memory, **no published per-request CPU/wall cap** **[U]**; Pro **$20/mo**. **AWS Lambda** — **900 s (15 min)** standard, **90 min** for Managed Instances, **8 h** for MicroVMs; 6 MB sync / 1 MB async payload; streamed responses ≤ 200 MB. **[V]**

### 5.4 Recommendation: least-effort-first for this stack

| # | Option | Max request duration | Streams? | Cost @ ~6,000 runs/mo | New infra |
|---|---|---|---|---|---|
| 1 | **Supabase Edge Functions (status quo)** | 400 s paid / 150 s free worker; **150 s idle → 504**; 2 s CPU | ✅ SSE + Realtime | **$0 incremental** | **None** |
| 2 | **Supabase Cron + pg_net** | ~10 min recommended/job; 1 s granularity | via Realtime | $0 incremental | None |
| 3 | **Supabase Queues + Cron consumer** | consumer = 400 s / 2 s CPU per batch | via Realtime | $0 incremental | Low |
| 4 | **Vercel Function (Pro, Fluid)** | **800 s** GA / 1800 s Beta | ✅ | **≈$3.20/mo + $20/seat Pro** | Very low (same repo) |
| 5 | **Vercel Workflows** | **No limit**; no sleep limit | ✅ | ≈$1.20/mo events | Low–medium |
| 6 | **Cloudflare Workers + DO/Workflows** | HTTP/DO **unlimited**; CPU 5 min max | ✅ | **$5/mo** | High (second platform) |
| 7 | **Fly.io shared-cpu-1x 256 MB** | **Unbounded** (real process) | ✅ | **≈$1.94/30 d** | Medium–high |
| 8 | **Railway Hobby** | **Unbounded** | ✅ | ≈$5–10/mo | Medium–high |
| 9 | **AWS Lambda** | 900 s / 90 min / 8 h | ✅ ≤200 MB | ≈$6/mo compute | Very high |

**Step 0 — Do this first, before adding any infrastructure (hours–days, no new vendors).**
The 2 s CPU cap only bites if you burn CPU; an LLM/tool loop is I/O-bound. The binding constraints are the **400 s worker wall clock** and the **150 s request idle timeout**. Fix it structurally:
1. Make **one agent turn = one Edge Function invocation**; persist loop state (messages, tool results, step index) in Postgres.
2. Launch continuation work with `EdgeRuntime.waitUntil(...)` after returning `202`; use `beforeunload` to checkpoint before the worker retires. **[V]**
3. Stream progress with **Realtime Broadcast** (REST or `realtime.send()`), not Presence. Remember the partition-creation gotcha and the 256 KB / 3,000 KB payload caps. **[V]**
4. Watch the **30 recursive calls / 60 s** ceiling if your functions call each other. **[V]**

**Step 1 — Supabase Cron + Queues + pg_net (hours, no new vendors).** Convert "one long request" into "a durable queue drained by short invocations": a pgmq queue plus **Supabase Cron** (`*/10 * * * *`, or even `30 seconds`) invoking the consumer. This is Supabase's **officially documented pattern** ([Consuming Queues with Edge Functions](https://supabase.com/docs/guides/queues/consuming-messages-with-edge-functions)). Respect ≤ 8 concurrent jobs and ~10 min/job. **[V]**

**Step 2 — Vercel Functions on Pro (an afternoon)** — only if a single step genuinely needs > 400 s or > 2 s CPU. You are already on Vercel: set `export const maxDuration = 800` on one route and stream. **Caution: Hobby caps you at 300 s *and* one cron run per day — Pro ($20/seat) is what unlocks 800 s.** Incremental cost at this volume ≈ $3/month. **[V]**

**Step 3 — Vercel Workflows if you need durability, not just duration** — human-in-the-loop approval, retries, resumption across deploys/crashes, **unlimited run duration and sleeps**. Same repo. ≈ $1.20/month in workflow events at your volume. **[V]**

**Step 4 — Fly.io if you want a real process.** Cheapest, least lock-in, and it is the **exact escape hatch Supabase documents** (their self-hosted edge-runtime demo runs on Fly). ≈ **$1.94/30 d**; set `auto_stop_machines = "off"`. Bring a Dockerfile and a second deploy pipeline, and **use Supavisor's pooler** so you don't hit "Max client connections reached". **[V]**

**Step 5 — Cloudflare Workers + Durable Objects/Workflows** only if you want the best long-lived-agent primitives: unlimited HTTP wall time, DO with unlimited duration + WebSocket hibernation + alarms, Workflows with unlimited per-step wall time — all for $5/month. The cost is a second platform and re-wiring Supabase data access (Hyperdrive/PostgREST). **[V]**

**Do not pick first:** Render background workers (paid-only), Deno Deploy (thinner published guarantees, $20/mo), AWS Lambda (15 min is generous but the IAM/VPC/edge tax is severe for a 200-calls/day admin tool). **[V]**

### 5.5 One caveat if you move the loop off-platform

Any external always-on worker (Fly, Railway, Cloudflare) now holds **long-lived Postgres connections**. Supavisor's documented ceiling for a Micro instance is **200 pooler / 60 direct** connections; exceed it and you get the documented **"Max client connections reached"** error. Stay on the **pooler port** and size accordingly. **[V]**

---

## 6. Minimal production-shaped code skeleton

Files created in this workspace:

- **`supabase/functions/admin-agent/index.ts`** — full Deno TypeScript implementation.
- **`supabase/functions/admin-agent/deno.json`** — per-function import map.
- **`supabase/admin_users.sql`** — the admin allowlist table + deny-by-default RLS.

### Shape of the implementation

```
POST /functions/v1/admin-agent
  │
  ├─ OPTIONS  → 204 + CORS headers          (must precede auth)
  ├─ method guard (POST only)
  ├─ secrets guard (URL, service role, LLM key)
  │
  ├─ authenticate(req, adminClient)
  │    ├─ read Authorization: Bearer <jwt>   (regex, case-insensitive)
  │    ├─ getClaims(jwt)  ── local JWKS verify (fast path)
  │    │     └─ on error → getUser(jwt)      (authoritative server round-trip)
  │    ├─ 401 if no valid subject
  │    └─ admin_users allowlist via SERVICE ROLE → 403 if absent, 500 on error
  │
  ├─ body guard: message present, ≤ 8 000 chars  → 400 / 413
  │
  ├─ runAgent(message, ctx)
  │    ├─ messages = [system(SYSTEM_PROMPT), user(message)]
  │    └─ for iteration 1..MAX_ITERATIONS (6)
  │         ├─ callModel(messages) with AbortController timeout (60 s)
  │         ├─ if no tool_calls → return { ok, answer, iterations, usage }
  │         ├─ push assistant turn VERBATIM (content may be null + tool_calls)
  │         └─ for each tool call
  │              ├─ JSON.parse arguments (guarded → error fed back to model)
  │              ├─ unknown tool → error fed back to model
  │              ├─ tool.run() inside try/catch → { error } fed back to model
  │              └─ push { role:"tool", tool_call_id, content: clampedResult }
  │    └─ loop exhausted → { ok:false, truncated:true }
  │
  ├─ buffered path → structured JSON (200 | 422)
  └─ stream path   → SSE via sseStream() + EdgeRuntime.waitUntil(pump)
```

### Design decisions worth calling out

| Decision | Rationale |
|---|---|
| **Service-role client built per request inside the handler** | Slow top-level `await` is a documented cold-start failure cause; per-request construction also avoids leaking a privileged client across invocations. |
| **Two clients: anon for verification, service-role for data** | The anon client validates the JWT and enforces RLS for user-attributed reads; the service-role client does privileged work. Never conflate them. |
| **`getClaims` → `getUser` fallback** | Fast local JWKS verification when the project uses an asymmetric signing key, with an authoritative server check as the correctness backstop. |
| **`admin_users` read with the service role** | Unforgeable by clients, instantly revocable, no JWT re-issue needed. |
| **`MAX_ITERATIONS = 6`** | Bounded blast radius: caps both cost and worst-case latency. |
| **`AGENT_BUDGET_MS = 120_000` checked before every round trip** | The loop *never starts* an LLM call it cannot afford to finish, because the platform returns **504** the instant 150 s pass without a response. Remaining budget is passed as the per-call `AbortController` timeout, so the last call is clipped rather than the whole request being killed. This is the single most important line for surviving the idle timeout. |
| **60 s `AbortController` per LLM call, cleared in `finally`; abort distinguished from network error** | Prevents a hung upstream from consuming the whole budget, while still telling you *which* happened. |
| **Per-tool `try/catch` that *returns the error to the model*** | Enables self-correction (e.g. a bad UUID) instead of failing the whole request. Errors are also recorded in the returned `tool_calls` transcript for audit. |
| **Tool results clamped to 12,000 chars** | `JSON.parse`/`stringify` consumes **CPU**, which is capped at 2 s; large payloads are both a latency and a 546 risk. |
| **SQL-side `limit` on every read tool (≤ 50)** | Cheaper on CPU and Postgres than fetching then trimming in JS. |
| **`update` tools `.select().maybeSingle()`** | Detects "no such row" instead of silently reporting success. |
| **Assistant turn echoed verbatim** | Required by the OpenAI tool-calling contract; dropping `tool_calls` or substituting `content` breaks the next turn. |
| **`sseStream` wraps the run in `EdgeRuntime.waitUntil(pump)`** | Documented requirement to stop the supervisor retiring the isolate early and truncating the stream. |
| **Structured response** `{ ok, answer, truncated, iterations, tool_calls[], usage }` | Lets the admin UI show *what the agent actually did*, and lets you alert on `truncated: true`. |
| **`Deno.serve` plus explicit CORS** | Portable across the Supabase runtime without adding the `@supabase/server` dependency; the `withSupabase({ auth: 'user' })` variant is a drop-in simplification once you adopt that package. |

### Migration note for the existing five functions

They import `serve` from `https://deno.land/std@0.168.0/http/server.ts`. Since the hosted runtime is Deno 2.1-compatible:

1. Change `serve(handler)` → `Deno.serve(handler)` (mechanical; the handler signature is identical).
2. Optionally adopt `export default { fetch: handler }` for the newest style.
3. Swap `https://esm.sh/@supabase/supabase-js@2` → `npm:@supabase/supabase-js@2`.
4. Add a per-function `deno.json` and commit a `supabase/config.toml` making `verify_jwt` explicit per function — currently `stripe-webhook` relies on an undeclared default.

---

## 7. Verification status — what is solid vs what may have changed

### Verified directly from official documentation (fetched this session)

**Supabase Edge Functions:** all limits (256 MB memory, 150 s Free / 400 s Paid wall clock, 2 s CPU, 150 s request idle timeout → 504, 20 MB / 5 MB bundle, function counts by plan, 30 recursive calls per 60 s, 10,000-char log lines, 100 secrets / 48 KiB); the `withSupabase` auth modes; the `Authorization` / `apikey` header contract; `verify_jwt` semantics and per-function `config.toml`; `getClaims()` vs `getUser()` wording; signing-key migration guidance, the JWKS URL, and its 10 min / 10 min / 20 min cache behaviour; the official SSE example; the `EdgeRuntime.waitUntil` + `pipeTo` streaming pattern; background-task semantics and the `per_worker` local-dev caveat; soft/hard CPU limits, isolate retirement at 50 %, `EarlyDrop` conditions, and 546 semantics; the cold-start failure mode; the dependency guidance (`npm:`, `node:`, `jsr:`, per-function `deno.json`); Edge Function invocation pricing; Cron's 1-second granularity and 8-job / 10-minute guidance; pgmq's pull model; pg_net's 2000 ms default, 200 req/s ceiling and 6-hour retention; Database Webhooks being a pg_net wrapper; Realtime plan tables and payload caps; Supavisor connection ceilings; the self-hosted edge-runtime + Fly.io demo; Custom Claims & RBAC hook pattern.

**Deno:** `Deno.serve` as the built-in HTTP server primitive; `Deno.ServeDefaultExport` (`{ fetch }`).

**Providers:** OpenAI's Responses-vs-Chat-Completions guidance, typed Items, `function_call` / `function_call_output` + `call_id`, reasoning-item replay requirement, `text.format`, and streaming event names; Anthropic's `tool_use` / `tool_result` contract including the "tool_result first" and "no intervening messages" rules, `is_error`, the `while stop_reason === "tool_use"` loop, and the `input_json_delta` streaming shape; Gemini's OpenAI-compatible base URL; DeepSeek's OpenAI- and Anthropic-compatible base URLs.

**Pricing:** all four providers' current per-million-token input/output/cached rates and context windows; OpenAI's automatic caching (1,024-token minimum, 0.1× read, 1.25× write, 30-minute TTL on GPT-5.6+); Anthropic's `cache_control` multipliers (1.25× / 2× / 0.1×), per-model minimum cacheable lengths, and 4-breakpoint cap; Gemini's implicit-vs-explicit caching, 4,096-token minimum for Gemini 3.x, and ~10 % cached-input rate; DeepSeek's off-peak hours and automatic caching.

**Alternatives:** Vercel's 300 / 800 / 1800 s durations, 25 s / 300 s Edge runtime windows, 4.5 MB body limit, and cron frequency by plan; Cloudflare's 10 ms Free / 30 s default / 5 min max CPU, unlimited HTTP and DO wall time, 15-min cron/queue/alarm limits, DO hibernation and 6-retry alarms, and the $5/month minimum; Fly.io per-second rates and autostop semantics; Railway's plan and rate table; Render's free-tier exclusions; AWS Lambda's 900 s / 90 min / 8 h ceilings.

### Uncertain, undocumented, or likely to change

| Item | Status |
|---|---|
| **Exact Deno patch version on the hosted platform** | Only "Deno 2.1 compatible" is attested; no stable doc statement of the precise version. **Do not depend on a specific recent Deno minor API without testing.** |
| **Request/response body size limits** | **Not documented.** Open issue [supabase#28053](https://github.com/supabase/supabase/issues/28053). Enforce your own limit. |
| **Memory: 256 MB vs 250 MB** | The Limits page says 256 MB; the 546 troubleshooting page says 250 MB. Assume 250 MB usable. |
| **`std/http` deprecation** | `std/http/server.ts` no longer exists on `denoland/std` main (404), and the ecosystem treats `serve()` as deprecated — but I could not fetch a single canonical deprecation notice. Treated as **[C]**. |
| **`gpt-4.1-mini` / `gpt-4o-mini` / `claude-haiku` / `gemini-2.5-flash` / `deepseek-chat`** | **Legacy or removed.** The names in the original brief are no longer the current lineup. Some legacy prices are still published; others are gone. |
| **Gemini explicit-cache storage price** (per 1M tokens/hour) | Not visible on the English pricing page; a localized version of the same page suggests $0.50/1M/hour → $1.00 from 2027-01-01. **Provisional.** |
| **Gemini 3.1 Pro cached-input rate** | Not verified; 10 % assumed in the cost tables. |
| **OpenAI cache minimums for pre-GPT-5.6 models** | Documented only as "varies by request settings". |
| **`deepseek-v4-pro` availability** | Still listed, but from 04:00 UTC 2026-09-14 pro requests are routed to V4.1-Flash at Flash rates — so the pro tier is effectively unavailable despite being listed. |
| **Supabase Cron hard caps** | Docs say "we recommend" (≤8 concurrent, ~10 min); no documented enforced kill. |
| **pg_net maximum timeout** | No documented upper bound. |
| **Supabase long-running/worker product in 2025** | The changelog was read only to 2026-09-25, not exhaustively paged through 2025. |
| **Render background-worker price** | Client-rendered pricing page; no figure quoted. |
| **Deno Deploy per-request CPU/wall caps** | Deploy Classic's limits page now 404s; historical 100 ms figure unverified. |
| **Cloudflare Workers "50 ms CPU"** | Legacy figure; now applies only to deprecated Bundled-plan Workers. Current Free cap is **10 ms**. |
| **Anthropic browser-safety header** | `anthropic-dangerous-direct-browser-access` is needed from a browser but not from an Edge Function (server-side). Not re-verified this session. |
| **All prices and model IDs** | Provider lineups revised frequently; the pages fetched carry 2026 markers. **Re-verify before budgeting.** |

---

## Sources

**Supabase — Edge Functions**
- [Limits](https://supabase.com/docs/guides/functions/limits)
- [Functions overview](https://supabase.com/docs/guides/functions)
- [Architecture](https://supabase.com/docs/guides/functions/architecture)
- [Background Tasks](https://supabase.com/docs/guides/functions/background-tasks)
- [CORS support](https://supabase.com/docs/guides/functions/cors)
- [Securing Edge Functions](https://supabase.com/docs/guides/functions/auth)
- [Authorization headers](https://supabase.com/docs/guides/functions/auth-headers)
- [Integrating With Supabase Auth (legacy JWT)](https://supabase.com/docs/guides/functions/auth-legacy-jwt)
- [Managing dependencies](https://supabase.com/docs/guides/functions/dependencies)
- [Function Configuration](https://supabase.com/docs/guides/functions/function-configuration)
- [Pricing](https://supabase.com/docs/guides/functions/pricing)
- [Running AI Models](https://supabase.com/docs/guides/functions/ai-models)
- [Troubleshooting: worker timeouts and WebSocket drops](https://supabase.com/docs/guides/troubleshooting/edge-functions-worker-timeouts-and-websocket-drops)
- [Troubleshooting: 546 WORKER_RESOURCE_LIMIT](https://supabase.com/docs/guides/troubleshooting/edge-function-546-error-response)
- [Troubleshooting: CPU limits](https://supabase.com/docs/guides/troubleshooting/edge-function-cpu-limits)
- [Troubleshooting: 504](https://supabase.com/docs/guides/troubleshooting/edge-function-504-error-response)
- [Troubleshooting: wall clock time limit reached](https://supabase.com/docs/guides/troubleshooting/edge-function-wall-clock-time-limit-reached-Nk38bW)
- [Official `streams` SSE example](https://github.com/supabase/supabase/blob/master/examples/edge-functions/supabase/functions/streams/index.ts)
- [Issue #28053 — request/response size limits undocumented](https://github.com/supabase/supabase/issues/28053)
- [Discussion #37941 — Deno 2.1 in all regions](https://github.com/orgs/supabase/discussions/37941)
- [Blog: Edge Functions — Deploy from the Dashboard + Deno 2.1](https://dev.to/supabase/edge-functions-deploy-from-the-dashboard-deno-21-2omm)

**Supabase — Auth**
- [JWT](https://supabase.com/docs/guides/auth/jwts)
- [JWT Signing Keys](https://supabase.com/docs/guides/auth/signing-keys)
- [Custom Claims & RBAC](https://supabase.com/docs/guides/api/custom-claims-and-role-based-access-control-rbac)
- [JavaScript reference: `getClaims`](https://supabase.com/docs/reference/javascript/auth-getclaims)
- [JavaScript reference: `getUser`](https://supabase.com/docs/reference/javascript/auth-getuser)

**Deno**
- [HTTP Server API (`Deno.serve`)](https://docs.deno.com/api/deno/http-server/)

**OpenAI**
- [Function calling](https://developers.openai.com/api/docs/guides/function-calling)
- [Migrate to the Responses API](https://developers.openai.com/api/docs/guides/migrate-to-responses)
- [Pricing](https://developers.openai.com/api/docs/pricing)
- [Prompt caching](https://developers.openai.com/api/docs/guides/prompt-caching)

**Anthropic**
- [Tool use overview](https://platform.claude.com/docs/en/agents-and-tools/tool-use/overview)
- [How tool use works](https://platform.claude.com/docs/en/agents-and-tools/tool-use/how-tool-use-works)
- [Handle tool calls](https://platform.claude.com/docs/en/agents-and-tools/tool-use/handle-tool-calls)
- [Streaming messages](https://platform.claude.com/docs/en/build-with-claude/streaming)
- [Pricing](https://platform.claude.com/docs/en/about-claude/pricing)
- [Prompt caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)

**Google Gemini**
- [Function calling](https://ai.google.dev/gemini-api/docs/function-calling)
- [OpenAI compatibility](https://ai.google.dev/gemini-api/docs/openai)
- [Pricing](https://ai.google.dev/gemini-api/docs/pricing)
- [Context caching](https://ai.google.dev/gemini-api/docs/caching)

**DeepSeek**
- [Your First API Call](https://api-docs.deepseek.com/)
- [Models & Pricing](https://api-docs.deepseek.com/quick_start/pricing)
- [Context Caching](https://api-docs.deepseek.com/guides/kv_cache)

**Supabase — Cron, Queues, pg_net, Realtime, self-hosting**
- [Cron](https://supabase.com/docs/guides/cron) · [Cron quickstart](https://supabase.com/docs/guides/cron/quickstart) · [Cron install](https://supabase.com/docs/guides/cron/install)
- [Queues](https://supabase.com/docs/guides/queues) · [Queues quickstart](https://supabase.com/docs/guides/queues/quickstart) · [Queues API](https://supabase.com/docs/guides/queues/api) · [Consuming Queues with Edge Functions](https://supabase.com/docs/guides/queues/consuming-messages-with-edge-functions)
- [pg_net](https://supabase.com/docs/guides/database/extensions/pg_net) · [pgmq](https://supabase.com/docs/guides/database/extensions/pgmq) · [Database Webhooks](https://supabase.com/docs/guides/database/webhooks)
- [Supavisor](https://supabase.com/docs/guides/database/supavisor)
- [Realtime Broadcast](https://supabase.com/docs/guides/realtime/broadcast) · [Realtime Limits](https://supabase.com/docs/guides/realtime/limits) · [Realtime Presence](https://supabase.com/docs/guides/realtime/presence)
- [Self-Hosting Functions (edge-runtime)](https://supabase.com/docs/reference/self-hosting-functions/introduction)
- [Supabase pricing](https://supabase.com/pricing) · [Supabase changelog](https://supabase.com/changelog)
- [Edge Function invocations usage](https://supabase.com/docs/guides/platform/manage-your-usage/edge-function-invocations)

**Vercel**
- [Functions limits](https://vercel.com/docs/functions/limitations) · [Max duration](https://vercel.com/docs/functions/configuring-functions/duration) · [Fluid compute](https://vercel.com/docs/fluid-compute) · [Functions usage & pricing](https://vercel.com/docs/functions/usage-and-pricing)
- [Edge runtime](https://vercel.com/docs/functions/runtimes/edge) · [Streaming functions](https://vercel.com/docs/functions/streaming-functions)
- [Cron usage & pricing](https://vercel.com/docs/cron-jobs/usage-and-pricing)
- [Workflows](https://vercel.com/docs/workflows) · [Workflows pricing](https://vercel.com/docs/workflows/pricing) · [Queues pricing](https://vercel.com/docs/queues/pricing)

**Cloudflare**
- [Workers limits](https://developers.cloudflare.com/workers/platform/limits/) · [Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/)
- [Durable Objects limits](https://developers.cloudflare.com/durable-objects/platform/limits/) · [DO alarms](https://developers.cloudflare.com/durable-objects/api/alarms/) · [DO WebSockets](https://developers.cloudflare.com/durable-objects/best-practices/websockets/)
- [Queues limits](https://developers.cloudflare.com/queues/platform/limits/) · [Workflows limits](https://developers.cloudflare.com/workflows/reference/limits/) · [Containers limits](https://developers.cloudflare.com/containers/platform/limits/)

**Other platforms**
- [Fly.io pricing](https://docs.fly.io/about/pricing) · [Fly autostop/autostart](https://docs.fly.io/launch/autostop-autostart)
- [Railway pricing](https://railway.com/pricing)
- [Render free tier](https://render.com/docs/free) · [Render background workers](https://render.com/docs/background-workers) · [Render compute plans](https://render.com/docs/compute-plans)
- [Deno Deploy pricing & limits](https://docs.deno.com/deploy/pricing_and_limits/) · [Deno Deploy plans](https://deno.com/deploy/pricing)
- [AWS Lambda quotas](https://docs.aws.amazon.com/lambda/latest/dg/gettingstarted-limits.html)
