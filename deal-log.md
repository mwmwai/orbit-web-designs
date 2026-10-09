# The Deal Log — Orbit Web Designs

One file, the single source of truth for sales and cash. File-based, append-only, no external services.
`deal-log.csv` = the data · `scripts/deal-summary.mjs` = the report · run it: `node scripts/deal-summary.mjs`

## Columns
`date` (YYYY-MM-DD, deal created) · `client` (name or WA number) · `tier` (Starter/Business/Master/Responder/Dashboard/Custom/Design/Care)
`quote_kes` (quoted total) · `deposit_kes` (cash received as deposit) · `balance_kes` (cash received as balance — 0 until it lands)
`mpesa_ref` · `source` (whatsapp/referral/instagram/google/repeat) · `outcome` · `notes`
outcome ladder: `quoted` → `deposit_paid` → `delivered` → `balance_paid`, or `lost`.

## Who appends
Any agent, in the same sitting as a REAL close event on WhatsApp 254741992308 — quote sent, deposit confirmed, delivery, balance, or a lost deal.
Never invent rows. Zero deals = header-only file, and that is the honest state. No P&L number exists until a row exists.

## Append rules
1. **Append-only.** New deal = one new row at the bottom. Never delete, reorder, or rewrite a closed row (`balance_paid` / `lost`).
2. **One row per DEAL, not per message.** An open deal's own row advances in place as it moves (outcome, deposit, balance, notes) — that is progress, not history.
   `date` and `quote_kes` never change after append; a real correction goes in `notes` (`corrected 2026-10-06: quote 39,999 not 44,999`).
3. **Money columns = cash actually received** (M-Pesa receipt seen), never expected or promised. An unpaid balance stays 0 in `balance_kes` and shows up as "balance still due" in the report.
4. **`mpesa_ref` = last 4–6 characters of the M-Pesa receipt code**, exactly as M-Pesa returns it.
5. **Cash rail:** 50% deposit via M-Pesa Pochi till 0741992308 / Send Money (no STK), balance on delivery.
   Standard 50%: Starter 14,500 · Business 20,000 · Master 25,000 (rounded from 28,999 / 39,999 / 49,999).

## Friday reconciliation ritual
1. `node scripts/deal-summary.mjs` — take the week's snapshot.
2. Open the M-Pesa statement for 0741992308 (founder provides the export) and walk every credit line Fri→Fri.
3. Match each credit to a row by amount + `mpesa_ref`. Credit with no row → append it. Row with no credit → flag it.
4. Write the balance landing date into that deal's `notes` as `paid YYYY-MM-DD` — this is what makes DSO computable.
5. Mismatches to the founder the same day, one line each: date, amount, ref, what is missing.

## The 4 KPIs (computed by the script, never guessed)
1. **Cash collected** — KES total, split deposit vs balance, weekly and monthly.
2. **Deals by tier** — where revenue actually concentrates.
3. **Win rate** — won (`deposit_paid`/`delivered`/`balance_paid`) ÷ (won + lost); `quoted` reported separately as open pipeline.
4. **DSO** — average days from `date` to the `paid YYYY-MM-DD` note on `balance_paid` rows.

## Daily use
- Closed or quoted anything on WhatsApp → append the row in the same sitting (30 seconds beats Friday archaeology).
- `node scripts/deal-summary.mjs` → weekly + monthly totals, pipeline, win rate; prints "no deals yet" while empty instead of crashing.
- Future cash source of truth: M-Pesa statement export for 0741992308 (founder); Supabase `shop_transactions` once Daraja callbacks are registered.
