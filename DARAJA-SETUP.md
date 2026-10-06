# Daraja setup — owner checklist (Safaricom side)

> **STATUS — money tracking is OFF the site (owner decision, 6 Oct 2026).**
> Nothing money-related is served from orbitwebdesigns.co.ke anymore:
>
> | Piece | Where it is now | Deployed? |
> |---|---|---|
> | Ingest + ledger routes | `money-api/` (`transactions.js`, `ingest/sms.js`, `mpesa/c2b/*`, `_lib/`) | **No** — local only |
> | Dashboard page | deleted (`git show 1e7a6c4^:src/pages/dashboard.astro`) | **No** — 404 |
> | Tracker page | `shop-tracker/index.html` (root copy; `public/` copy deleted) | **No** — open the file directly |
> | SQL schema | `supabase/dashboard-schema.sql` | n/a |
> | Site functions | `api/` (`chat.ts`, `generate.mjs`, `supabase/submit.ts`) | Yes |
>
> **What works today with zero setup:** open `shop-tracker/index.html` in a
> browser and import a Safaricom statement CSV. Everything stays in that
> browser's local storage — no server, no domain, no accounts.

Goal (when re-enabled): every Till payment lands in a dashboard automatically.

## Turning it back on (4 steps)

1. `git mv money-api/* api/` and restore the page:
   `git show 1e7a6c4^:src/pages/dashboard.astro > src/pages/dashboard.astro`
2. Set the env vars in Step 0 + Step 5, then redeploy.
3. Run `supabase/dashboard-schema.sql` in the Supabase SQL editor and create
   the owner user (Dashboard → Authentication → Add user).
4. Register the C2B URLs (Step 2) and do one real KES 10 test per Till (Step 4).

> Local note: `astro dev` serves pages only. The `api/*` functions are Vercel
> serverless functions — test them with `vercel dev`, not `astro dev`.

## Step 0 — Vercel env the dashboard page needs (build time)

`/dashboard` reads these at **build** time. If either is missing, the built
page shows *"Dashboard is not configured yet"* and nothing else:

- `PUBLIC_SUPABASE_URL` — Supabase → Project Settings → API → Project URL
- `PUBLIC_SUPABASE_ANON_KEY` — same page → `anon` `public` key (safe to expose)

These two are separate from the server-only keys in Step 5.

## Step 1 — Create the Daraja app (10 min, developer.safaricom.co.ke)

1. Go to <https://developer.safaricom.co.ke> → log in (or create account).
2. **Apps → Add a New App**, name it e.g. `orbit-shops`.
3. Open the app → copy **Consumer Key** and **Consumer Secret** into env
   as `DARAJA_CONSUMER_KEY` / `DARAJA_CONSUMER_SECRET` (reserved for future
   token use; the C2B callbacks below work without code changes).
4. For each Till: **APIs → M-Pesa → Go Live / Sandbox → Lipa Na M-Pesa** — note
   the **Passkey** for each shortcode (needed at go-live, keep secret).

## Step 2 — Register the C2B URLs (sandbox first)

1. In the Daraja portal: your app → **APIs → C2B → Register URLs** (sandbox).
2. Set (these require a **public** URL — Daraja cannot reach localhost):
   - Validation URL: `https://<your-host>/api/mpesa/c2b/validation`
   - Confirmation URL: `https://<your-host>/api/mpesa/c2b/confirmation`
   - Response Type: **Completed**.
3. Do this once per shortcode (each Till has its own BusinessShortCode).

## Step 3 — Simulate in sandbox, verify in dashboard

1. Daraja portal → **APIs → C2B → Simulate** (or use the curl tests below).
2. Log in to `/dashboard` — the test payment appears as IN / Sales / Till
   Number under the mapped shop.
3. Send the same `TransID` twice: the second is ignored (dedupe works).

## Step 4 — Go live

1. Daraja portal → **Go Live** for the app (Safaricom approval may take days).
2. Re-register the **same two URLs** on the production (live) environment.
3. Take one real KES 10 payment per Till and confirm it appears in the dashboard.

## Step 5 — Map each Till / Pochi phone to its shop (env)

- `TILL_SHOP_MAP` — shortcode → shop, e.g.
  `{"600111":"Aggmart","600222":"Trade Star Shop"}`
- `POCHI_SHOP_MAP` — forwarding phone → shop, e.g.
  `{"0741992308":"Aggmart","0741000000":"Trade Star Shop"}`
- `INGEST_SECRET` — long random string; the SMS forwarder must send it back.
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase Dashboard → Project Settings → API →
  service_role key. Server only. Never paste it into frontend code.

Unmapped shortcodes/phones fall back to Aggmart and are flagged in the row's
`raw` column (`_unmappedShortcode` / `_unmappedPhone`) — fix the map, don't
lose the money.

## Pochi la Biashara + SMS fallback (no Daraja needed)

On the shop phone that receives the M-Pesa SMS: install an SMS-forwarder app
and forward every `MPESA` sender message to `POST <host>/api/ingest/sms` with
JSON `{ "secret": "<INGEST_SECRET>", "text": "<full SMS>", "phone": "<this phone>" }`.

## Test commands (curl, local with `vercel dev`)

Use a **unique TransID per test** (dedupe ignores repeats). Replace
`PASTE-INGEST-SECRET` with your real `INGEST_SECRET` only in your terminal —
never commit it.

```bash
# 1. Validation (expect {"ResultCode":0,"ResultDesc":"Accepted"})
curl -s -X POST http://localhost:3000/api/mpesa/c2b/validation \
  -H "Content-Type: application/json" \
  -d '{"TransactionType":"Pay Bill","TransID":"SBXTEST001","TransTime":"20261005103000","TransAmount":"10","BusinessShortCode":"600111","BillRefNumber":"test","MSISDN":"254700000000","FirstName":"Test"}'

# 2. Confirmation (expect {"ResultCode":0,"ResultDesc":"Success"}; row appears in dashboard)
curl -s -X POST http://localhost:3000/api/mpesa/c2b/confirmation \
  -H "Content-Type: application/json" \
  -d '{"TransactionType":"Pay Bill","TransID":"SBXTEST002","TransTime":"20261005103000","TransAmount":"100.00","BusinessShortCode":"600111","BillRefNumber":"Aggmart","MSISDN":"254712345678","FirstName":"Jane","MiddleName":"","LastName":"Doe"}'

# 3. SMS ingest — received money (expect {"ok":true,...})
curl -s -X POST http://localhost:3000/api/ingest/sms \
  -H "Content-Type: application/json" \
  -d '{"secret":"PASTE-INGEST-SECRET","phone":"0741992308","text":"SBXTEST003 Confirmed. You have received Ksh1,250.00 from JOHN DOE 0722000000 on 5/10/26 at 10:30 AM. New M-PESA balance is Ksh5,000.00."}'
```
