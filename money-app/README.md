# money-app — local payments runner (never deployed to the domain)

Owner override (Oct 6): money is OFF orbitwebdesigns.co.ke. This folder is the
local, autonomous runner for the payments stack. Binds 127.0.0.1 only.

## Run

    node money-app/server.mjs            # or double-click start.cmd
    MONEY_APP_PORT=8390                  # default port

- `/` — shop-tracker admin UI (offline, CSV import/export, localStorage)
- `/health` — JSON status: env keys present/missing + route table
- `/api/transactions` — ledger API (Vercel-compatible handlers from `money-api/`)
- `/api/mpesa/c2b/validation` + `/confirmation` — Daraja callbacks (local test target)
- `/api/ingest/sms` — SMS fallback ingest
- `health.log` — heartbeats every 10 min + server start/stop evidence

## Autonomy

- Zero dependencies; runs forever; self-probes every 10 minutes.
- Handlers answer 503 (not 500) while env is missing — copy values from
  `.env.example` into `.env`: PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY, INGEST_SECRET, TILL_SHOP_MAP, MPESA_CALLBACK_TOKEN.
- Data truth requires the Supabase schema (`supabase/dashboard-schema.sql`)
  applied + an owner account — founder-only steps.

## Re-enable on the domain (founder call, documented recovery)

    git mv money-api/* api/
    git show 1e7a6c4^:src/pages/dashboard.astro > src/pages/dashboard.astro
    npm run build && git add -A && git commit && git push

Daraja portal URL registration must happen BEFORE setting MPESA_CALLBACK_TOKEN
(else real confirmations 401 and payments go unrecorded).
