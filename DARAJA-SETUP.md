# Daraja setup — owner checklist (Safaricom side)

Goal: every Till payment lands in the dashboard automatically. You do this once;
day-to-day tracking is then automatic. Technical pieces (schema, API routes,
dashboard page) are already in this repo.

Deployed endpoints (replace domain only if it ever changes):

- Validation:    `https://www.orbitwebdesigns.co.ke/api/mpesa/c2b/validation`
- Confirmation:  `https://www.orbitwebdesigns.co.ke/api/mpesa/c2b/confirmation`
- SMS fallback:  `https://www.orbitwebdesigns.co.ke/api/ingest/sms`

> Local note: `astro dev` serves the dashboard UI only. The `/api/*`
> functions are Vercel serverless functions (see `api/`). Test them locally
> with `vercel dev`, not `astro dev`.

## Step 0 — Vercel env the dashboard itself needs (build time)

The `/dashboard` page reads these at **build** time. If either is missing, the
built page shows *"Dashboard is not configured yet"* and nothing else — set
them, then redeploy:

- `PUBLIC_SUPABASE_URL` — Supabase → Project Settings → API → Project URL
- `PUBLIC_SUPABASE_ANON_KEY` — same page → `anon` `public` key (safe to expose)

These two are separate from the server-only keys in Step 5.

## Step 1 — Create the Daraja app (10 min, developer.safaricom.co.ke)

1. Go to <https://developer.safaricom.co.ke> → log in (or create account).
2. **Apps → Add a New App**, name it e.g. `orbit-shops`.
3. Open the app → copy **Consumer Key** and **Consumer Secret** into Vercel env
   as `DARAJA_CONSUMER_KEY` / `DARAJA_CONSUMER_SECRET` (reserved for future
   token use; the C2B callbacks below work without code changes).
4. For each Till: **APIs → M-Pesa → Go Live / Sandbox → Lipa Na M-Pesa** — note
   the **Passkey** for each shortcode (needed at go-live, keep secret).

## Step 2 — Register the C2B URLs (sandbox first)

1. In the Daraja portal: your app → **APIs → C2B → Register URLs** (sandbox).
2. Set:
   - Validation URL: `https://www.orbitwebdesigns.co.ke/api/mpesa/c2b/validation`
   - Confirmation URL: `https://www.orbitwebdesigns.co.ke/api/mpesa/c2b/confirmation`
   - Response Type: **Completed**.
3. Do this once per shortcode (each Till has its own BusinessShortCode).

## Step 3 — Simulate in sandbox, verify in dashboard

1. Daraja portal → **APIs → C2B → Simulate** (or use the curl tests below).
2. Log in at `https://www.orbitwebdesigns.co.ke/dashboard` — the test payment
   appears as IN / Sales / Till Number under the mapped shop.
3. Send the same `TransID` twice: the second is ignored (dedupe works).

## Step 4 — Go live

1. Daraja portal → **Go Live** for the app (Safaricom approval may take days).
2. Re-register the **same two URLs** on the production (live) environment.
3. Take one real KES 10 payment per Till and confirm it appears in the dashboard.

## Step 5 — Map each Till / Pochi phone to its shop (Vercel env)

Set these Vercel environment variables (Production + Preview), then redeploy:

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

## Pochi la Biashara + fallback (no Daraja needed)

On the shop phone that receives the M-Pesa SMS: install an SMS-forwarder app
and forward every `MPESA` sender message to `POST /api/ingest/sms` with JSON
`{ "secret": "<INGEST_SECRET>", "text": "<full SMS>", "phone": "<this phone>" }`.

## Sandbox test commands (curl)

Use a **unique TransID per test** (dedupe ignores repeats). Replace
`PASTE-INGEST-SECRET` with your real `INGEST_SECRET` only in your terminal —
never commit it.

```bash
# 1. Validation (expect {"ResultCode":0,"ResultDesc":"Accepted"})
curl -s -X POST https://www.orbitwebdesigns.co.ke/api/mpesa/c2b/validation \
  -H "Content-Type: application/json" \
  -d '{"TransactionType":"Pay Bill","TransID":"SBXTEST001","TransTime":"20261005103000","TransAmount":"10","BusinessShortCode":"600111","BillRefNumber":"test","MSISDN":"254700000000","FirstName":"Test"}'

# 2. Confirmation (expect {"ResultCode":0,"ResultDesc":"Success"}; row appears in dashboard)
curl -s -X POST https://www.orbitwebdesigns.co.ke/api/mpesa/c2b/confirmation \
  -H "Content-Type: application/json" \
  -d '{"TransactionType":"Pay Bill","TransID":"SBXTEST002","TransTime":"20261005103000","TransAmount":"100.00","BusinessShortCode":"600111","BillRefNumber":"Aggmart","MSISDN":"254712345678","FirstName":"Jane","MiddleName":"","LastName":"Doe"}'

# 3. SMS ingest — received money (expect {"ok":true,...})
curl -s -X POST https://www.orbitwebdesigns.co.ke/api/ingest/sms \
  -H "Content-Type: application/json" \
  -d '{"secret":"PASTE-INGEST-SECRET","phone":"0741992308","text":"SBXTEST003 Confirmed. You have received Ksh1,250.00 from JOHN DOE 0722000000 on 5/10/26 at 10:30 AM. New M-PESA balance is Ksh5,000.00."}'
```
