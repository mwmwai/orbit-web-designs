# FOUNDERS.md — 5 gates only you can open (each ≤5 min, click-by-click)

Your browser/portal only. Anything the team can do is NOT in this file. Money stays off
the public domain (owner override, Oct 6 — commits 1e7a6c4, 998f404) unless you ask for it back.
Env var names below are exact — copy/paste, never retype.

## IF YOU ONLY HAVE 10 MINUTES — top 3

1. **Turnstile sitekey** (Gate 1) — restores live inbound: contact-form leads + newsletter.
2. **Supabase schema + owner user** (Gate 2, steps 1–3) — unlocks every data call.
3. **Pochi statement export** (Gate 4, steps 1–2) — the only path to a real cash number.

---

## GATE 1 — Turnstile sitekey → Vercel → redeploy

**Blocked:** `PUBLIC_TURNSTILE_SITE_KEY` is missing from the build (secret IS set, verified Oct 6),
so no widget renders: /contact is WhatsApp-failover only (no `leads` rows) and the footer newsletter
POSTs with no token → API returns 400 (`api/supabase/submit.ts:130`).

1. Cloudflare dashboard → Turnstile → Sites → add site `orbitwebdesigns.co.ke` (or open the existing one) → copy the **Site key** (starts `0x`). *(Navigation is generic — confirm in provider dashboard.)*
2. Vercel → project → **Settings → Environment Variables** → add `PUBLIC_TURNSTILE_SITE_KEY` = the `0x…` key, scoped **Production + Preview + Development** → Save.
   - Correcting drift: the name is `PUBLIC_TURNSTILE_SITE_KEY` (underscore before `KEY`), read at `Footer.astro:5`, `src/components/react/ContactForm.tsx:4`, `Comments.astro:56`.
   - Do **not** touch `TURNSTILE_SECRET_KEY` — already set in prod (dummy token → 403, not 503).
3. Vercel → **Deployments → ⋯ → Redeploy** the latest production deployment. (Vite inlines the key at build; saving the var alone changes nothing.)
4. Verify: view-source `https://orbitwebdesigns.co.ke/contact` → contains `0x` sitekey and the `challenges.cloudflare.com/turnstile/v0/api.js` script (`Layout.astro:310`).

**Done when:** /contact shows the Turnstile box and one test enquiry returns success (row in Supabase `leads`); footer newsletter Join shows "You're in — check your inbox" (API 200, not 400).
**Rollback:** delete the var + redeploy → back to today's WhatsApp-failover state. No data risk.

---

## GATE 2 — Supabase schema, owner account, env keys

**Blocked:** `supabase/dashboard-schema.sql` has never been run and no owner user exists — no ledger
row can be read or written; `money-app/health.log` reports the same 7 missing keys every 10 minutes.

1. Supabase → **SQL Editor → New query** → paste the FULL contents of `supabase/dashboard-schema.sql` (disk and git HEAD are both current as of commit `8d85de5`, Oct 9 — the strict-RLS + amount≤10M edits are committed) → **Run**.
2. **Authentication → Add user** (owner email + password) → copy the user UUID → SQL Editor, run the template in the file's section 0:
   `insert into profiles (id, is_owner) values ('<UUID>', true) on conflict (id) do update set is_owner = true;`
3. **Authentication → Providers → Email → turn OFF "Allow new users to sign up"** (schema's own SECURITY note — strict RLS is the backstop, this is the front door).
4. Local `.env` (names exact; these eight are from `.env.example`): `PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `DARAJA_CONSUMER_KEY`, `DARAJA_CONSUMER_SECRET`, `TILL_SHOP_MAP`, `POCHI_SHOP_MAP`, `INGEST_SECRET` (+ `MPESA_CALLBACK_TOKEN` — used by `money-api`/`money-app/server.mjs` but not yet listed in `.env.example`; set it LAST, see Gate 3). Values: Supabase → Project Settings → API.
5. Vercel prod: `PUBLIC_SUPABASE_URL` + `PUBLIC_SUPABASE_ANON_KEY` already live-verified Oct 6 (bundle contained `signInWithPassword`). Still unverified server-only: `SUPABASE_SERVICE_ROLE_KEY`, `INGEST_SECRET`, `TILL_SHOP_MAP`, `POCHI_SHOP_MAP` — needed only when money routes return to the domain.

**Done when:** `GET /health` on money-app shows `env_missing=[]`; the verify query at the file's end (section 2) runs; an anon/auth non-owner `select` on `shop_transactions` returns permission denied (strict RLS holding).
**Rollback:** script is idempotent (`if not exists` / `drop policy if exists`) — safe to re-run; the loose-policy variant is commented in the file, do not enable unless asked.

---

## GATE 3 — Daraja C2B URLs (order matters: URLs first, token env second)

**Blocked:** money routes live in `money-api/` (off the domain), so Daraja has nowhere public to POST;
and if `MPESA_CALLBACK_TOKEN` is set before the registered URLs carry `?token=`, live confirmations 401
and payments go **unrecorded**.

0. **Precondition — your call only:** money must be back on the domain first: `git mv money-api/* api/`
   + `git show 1e7a6c4^:src/pages/dashboard.astro > src/pages/dashboard.astro` + build/commit/push
   (`money-app/README.md`, `DARAJA-SETUP.md`). While it's off: **stop** — local mode cannot receive
   callbacks (Daraja cannot reach localhost; no tunnel setup exists in this repo, don't improvise one).
1. developer.safaricom.co.ke → your app → **APIs → C2B → Register URLs** (sandbox first). *(Confirm navigation in provider dashboard.)*
2. Register both, Response Type **Completed**, one registration per shortcode (each Till):
   - Validation: `https://orbitwebdesigns.co.ke/api/mpesa/c2b/validation?token=<VALUE>`
   - Confirmation: `https://orbitwebdesigns.co.ke/api/mpesa/c2b/confirmation?token=<VALUE>`
3. **Only after both URLs carry the token:** set `MPESA_CALLBACK_TOKEN` = same value in Vercel (+ local `.env`) → redeploy. Until the URLs have it, leave the env unset.
4. Sandbox simulate → row lands in the dashboard; send the **same TransID** again → ignored (dedupe).
5. Go Live → re-register the same two URLs on production → one real KES 10 test per Till.

**Done when:** validation returns `{"ResultCode":0,…}`, confirmation writes one row, duplicate TransID writes nothing, function logs show no 401.
**Rollback / risk:** if the env is ever set while portal URLs lack `?token` → real payments 401. Fastest fix: add `?token=` to both portal URLs; emergency: unset `MPESA_CALLBACK_TOKEN` (accepts any POST — insecure, log says so) until URLs are corrected.

---

## GATE 4 — M-Pesa statement, Pochi 0741992308 — ⚠ DOWNGRADED to "from Finance seat"

**Blocked:** zero statement data exists anywhere; no cash-collected KPI, no deposit/balance truth, no DSO.
`scripts/reconcile-pochi.mjs` **exists** (Finance-verified Oct 8, alongside `deal-summary.mjs`, `pnl.mjs`, `generate-indexnow.mjs`, `ping-indexnow.sh`, `test-higgsfield.mjs`, `check-api-imports.mjs`) — the CSV goes to Finance to run it.

1. Safaricom app → **M-Pesa → Statements** → account **0741992308** (Pochi la Biashara) → period (Fri→Fri to match the weekly ritual) → export → **CSV** download/email. *(Navigation is generic — confirm in provider dashboard.)*
2. Send the CSV to the Finance seat (same sitting — this is the whole gate).
3. **Manual fallback if Finance hasn't wired the script yet:** export the ledger side (`node scripts/deal-summary.mjs` snapshot; shop-tracker CSV export if rows exist) and compare credit-by-credit, Fri→Fri, by amount + last 4–6 chars of the receipt (`deal-log.md` rules): credit with no row → append it; row with no credit → flag it; write `paid YYYY-MM-DD` into that deal's `notes`.

**Done when:** statement delivered + Finance returns a same-day mismatch list, one line each (date, amount, ref, what's missing) — or "clean".
**Rollback:** none — read-only export. **No financial number may be stated until this lands** (deal-log stays header-only; GA G-FWPQVVQ668 has never been queried).

---

## GATE 5 — Standing approval: pushes to mwmwai/orbit-web-designs (Oct 6)

**Blocked:** nothing — this gate exists to stop the team asking twice.

1. Standing approval recorded: all pushes to `origin/main` (mwmwai/orbit-web-designs) are pre-approved.
2. Standing conditions the team still enforces: `npm run build` green first; Vercel auto-deploys the push; full Windows paths for git (`C:\Program Files\Git\bin\git.exe`).
3. **Not covered by this approval:** anything that puts money back on the public domain (dashboard page, `shop-tracker/`, moving `money-api/*` back into `api/`) — that stays a founder call.

**Done when:** the team ships green builds without waiting for push confirmation, and still escalates owner-override scope.
**Rollback:** say so — approval is revoked from that moment.

---

## DEPENDENCY MAP (gate → what it unblocks)

| Gate | Unblocks |
|---|---|
| 1 Turnstile sitekey | `leads` rows from /contact, newsletter signups (currently 400), blog comments, `generate.mjs`/`submit.ts` client paths (both fail-closed today) |
| 2 Supabase schema + owner + env | money-app `/health` green, every ledger read/write, dashboard data calls, Friday reconciliation, deal-log cash columns |
| 3 Daraja C2B URLs | automatic per-Till payment recording — gated on founder re-enabling money on the domain (step 0) |
| 4 Pochi statement | first honest "cash collected" KPI, deposit/balance truth, win rate + DSO, deal-log rows |
| 5 Push approval | team ships continuously; only owner-override (money-on-public-domain) items still escalate |

Sequencing: 1 and 2 are independent and parallel. 4 needs nothing. 3 needs 2 + step 0 first.
