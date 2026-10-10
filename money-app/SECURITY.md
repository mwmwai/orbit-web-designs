# money-app — local-mode threat model & gate reference

Owner override (Oct 6): money is OFF orbitwebdesigns.co.ke. `money-api/**` is
served ONLY by `money-app/server.mjs` on `127.0.0.1:8390`. Vercel serves
`api/` (chat/generate/submit — no money routes) + `dist`. Audited 2026-10-09.

## 1. Local-mode threat model

Trust boundary: loopback. Anyone/anything on THIS machine can reach the runner.

| Actor | Reach | Risk |
|---|---|---|
| Other processes / local users on this machine | Full — 127.0.0.1 is not auth | Can hit `/health` (env key names + set/missing, never values), POST fake confirmations |
| Drive-by browser page (owner visits malicious site) | Simple `text/plain` POST to `127.0.0.1:8390` is sent without CORS preflight | **Conditional:** could ingest a fake sale row ONLY if `MPESA_CALLBACK_TOKEN` unset AND Supabase env set. Today both unset → `ConfigError` → 503, nothing written. Mitigation: set `MPESA_CALLBACK_TOKEN` in `.env` BEFORE setting Supabase keys. |
| Remote internet | None — `server.listen(PORT, '127.0.0.1')` (server.mjs:158) | No public surface |
| Browser JS reading responses cross-origin | Blocked — shim sends no CORS headers, preflights fail | Responses unreadable off-origin |

**If the domain re-enabled:** loopback protection vanishes; the drive-by row
forgery above becomes real internet-wide (URL guessable, Daraja sends no
signature). That is why token-gate + RLS must be live before any public route.

## 2. Gate matrix (endpoint × token × failure mode)

| Endpoint | Gate | Token SET, valid | Token SET, missing/invalid | Token UNSET | Env missing | Other |
|---|---|---|---|---|---|---|
| `POST /api/mpesa/c2b/confirmation` (confirmation.js:34-43) | `MPESA_CALLBACK_TOKEN` via `?token=` or `x-callback-token`, timing-safe (shop-ingest.js:47-72) | 200 ResultCode 0, row written/deduped | **401, nothing written** (line 37) | accepted + warn-once (line 40-43) | `ConfigError` → **503** retryable, generic msg (line 90-95) | malformed/over-KES1M → 200 ack, not recorded; never 500, no stack |
| `POST /api/mpesa/c2b/validation` (validation.js:23-35) | log-only by design (writes nothing) | 200 always | warn + 200 | warn-once + 200 | 200 (env never touched) | always 200 ResultCode 0 |
| `POST /api/ingest/sms` (sms.js:26-31) | `INGEST_SECRET` in body, **fail-closed**, timing-safe compare via `shaEq` (sms.js:28) | correct → proceed | 401 | **401 for every request** (unset = reject all) | after gate → 503 generic (line 70-73) | unparseable → 400; store fail → 500 fixed string |
| `GET/POST /api/transactions` (transactions.js:22-34) | Supabase Auth JWT | authenticated → 200 | 401 | n/a | `authEnvMissing` → 503 generic (line 27) | 400/409/500 fixed strings; GET strips `raw` (line 64) |
| `GET /health` (server.mjs:114-118) | none (localhost) | returns key names + set/missing only — never values | | | | |
| `GET /` | none (localhost) | static shop-tracker UI | | | | |

Adapter safety net (server.mjs:94-97): if a handler throws, the runner logs
the stack to console only and answers a fixed `{ok:false, error:"Internal
server error"}` — raw error messages are never echoed to the client. A second
net at dispatch level (server.mjs:141-151) catches adapter-promise rejections
(previously an unhandled rejection that killed the process) and, like a
malformed request target (server.mjs:107-113), answers a fixed string — never
a raw error.
`res.setHeader` is honored (server.mjs:88), so handler-set headers such as
`Cache-Control: no-store` on /api/transactions actually reach the client.

Phone masking: visible `note` masks MSISDN (confirmation.js:83, sms.js:63 →
`maskPhone`, shop-ingest.js:76-80). Full number lives only in `raw` jsonb,
which no GET endpoint returns.

## 3. Env-key inventory (`.env`, loaded by server.mjs:14-19, never overridden)

| Key | Class | Notes |
|---|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | **SECRET** | Server-only; bypasses RLS; never in code, logs, or responses |
| `MPESA_CALLBACK_TOKEN` | **SECRET** | Shared gate on Daraja URL; unset = accept-any (warn-once) |
| `INGEST_SECRET` | **SECRET** | Fail-closed for `/api/ingest/sms` |
| `PUBLIC_SUPABASE_ANON_KEY` | Public by design | Safe only WITH RLS enforced |
| `PUBLIC_SUPABASE_URL` | Public | |
| `TILL_SHOP_MAP`, `POCHI_SHOP_MAP` | Internal config | Shop mapping, not credentials; don't publish |
| `MONEY_APP_PORT` | Non-secret | Default 8390; binding stays 127.0.0.1 |

## 4. Re-enable on domain — STRICT ORDER

1. **RLS re-verify FIRST** — apply `supabase/dashboard-schema.sql`, confirm
   `shop_transactions` has no anon/authenticated SELECT/INSERT policies and
   only `service_role` bypasses. Public anon key exposure without RLS = full
   ledger leak.
2. **Register Daraja URLs BEFORE setting `MPESA_CALLBACK_TOKEN`** — paste
   Validation + Confirmation URLs into the Safaricom portal WITH
   `?token=<value>` already appended, THEN set `MPESA_CALLBACK_TOKEN=<same
   value>` in env. Reverse order = every real confirmation 401s and payments
   go unrecorded (confirmation.js:37).
3. Move code back: `git mv money-api/* api/`, restore `src/pages/dashboard.astro`,
   set `SUPABASE_SERVICE_ROLE_KEY` + `MPESA_CALLBACK_TOKEN` + `INGEST_SECRET`
   as Vercel env vars (never in code).
4. **Turnstile sitekey redeploy** — public sitekey in frontend env; secret key
   server-side only; verify `/api/supabase/submit` challenge before go-live.
5. `npm run build`, push, then smoke test: confirmation without token → 401,
   with token → 200; sandbox Daraja transaction recorded once (deduped on retry).

Never skip 1 or 2. Order between 3-4-5 is flexible; 1 and 2 are hard gates.
