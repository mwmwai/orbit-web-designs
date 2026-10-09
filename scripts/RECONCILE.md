# Friday money ops — reconcile, P&L, deal log

One chain, every Friday. ~15 minutes. All zero-dependency Node, Windows-safe, exit 0 always (read the stdout counts — never the exit code).

## Exact run order

1. `node scripts/deal-summary.mjs` — take the week's deal snapshot (KPIs below).
2. Export the M-Pesa statement for Pochi till **0741992308** → `m-pesa-YYYY-MM-DD.csv` (steps below).
3. Export the ledger → `ledger-YYYY-MM-DD.csv`:
   - Money dashboard → **Export CSV** (downloads `transactions-*.csv`, header `date,shop,type,amount,category,method,note,mpesa_code`), or
   - Supabase → Table Editor → `shop_transactions` → **Export CSV** (extra columns like `id`, `raw`, `created_at` are ignored by the script).
4. `node scripts/reconcile-pochi.mjs --statement m-pesa-2026-10-09.csv --ledger ledger-2026-10-09.csv --out reconcile-2026-10-09.md`
5. Clear the buckets (actions in "Reading the report"). Every UNRECORDED line gets appended in the same sitting — to `deal-log.csv` if it is deal cash, to the ledger if it is shop money.
6. `node scripts/pnl.mjs --ledger ledger-2026-10-09.csv --costs costs.csv --month 2026-10`
7. Append this week's spend to `costs.csv` — one row per receipt: `date,category,amount_kes,vendor,notes`.
8. Re-run `node scripts/deal-summary.mjs`. After the appends, statement and snapshot should agree.

## Export the M-Pesa statement (Safaricom)

Labels move between app versions — you want the statement for the **Pochi la Biashara till 0741992308**, NOT the personal wallet.

1. Open the **M-Pesa app** (or mySafaricom app) on the phone that manages till 0741992308, signed in to that number.
2. Menu → **Statements** (some versions: Profile/My Account → Statements; in mySafaricom: M-Pesa → Statements).
3. Pick the **business / Pochi la Biashara account** for **0741992308**.
4. Date range = the reconciliation week, Fri→Fri.
5. Choose **CSV or Excel** if offered → generate → the statement is emailed → download the attachment.
6. If only PDF comes back: open it and **Save As CSV** (Excel/Sheets → File → Save As → CSV). A PDF cannot be parsed by the script.
7. Save as `m-pesa-YYYY-MM-DD.csv` in the repo root (or anywhere — pass the path with `--statement`).

If the app has no Statements entry: try the Safaricom Business portal (business.safaricom.co.ke → M-Pesa → Statements) or ask Safaricom care for a till statement CSV. If all you can get is CSV-by-email with odd headers, the script detects the common variants — see below.

## Column expectations

### Statement (Safaricom export) — detected case-insensitively

| Role | Accepted headers | Notes |
|---|---|---|
| code | `Trans ID` · `Receipt` · `Transaction ID` · `M-Pesa Code` · `Reference` | the match key; 4+ char suffix matches too |
| amount | `Amount` · `Trans Amount` · `Paid In` · `Value` | credits only; blank/zero rows ignored (withdrawals) |
| when | `Date` · `Completion Time` · `Transaction Time` | `dd/MM/yyyy HH:mm:ss`, ISO, `dd-Mon-yyyy` all parse |
| party | `Paybill` · `Till` · `From` · `Party` · `Details` | optional, display only |
| status | `Status` · `Transaction Status` | failed/cancelled/reversed/pending rows are skipped |

Comma-delimited CSV (re-save if your export is semicolon-delimited). Junk lines above the header are tolerated — the script finds the header row itself. Times are read as **Africa/Nairobi (UTC+3)**; Supabase ISO timestamps carry their own offset, so both sides line up.

### Ledger (shop_transactions export)

Required: a `date` column and an `amount` column. Recognised (all optional): `shop`, `type`, `mpesa_code` (or `mpesa_ref`/`ref`/`receipt`), `note`.

- `type = in` → revenue, eligible to match a statement credit.
- `type = out` → skipped by the reconcile (it is spend; it belongs in `costs.csv`).
- `mpesa_code` full code preferred; a deal-log style 4–6 char `mpesa_ref` suffix also matches.

## Reading the report

| Bucket | Meaning | Action |
|---|---|---|
| **MATCHED** | statement line ↔ ledger row agree (code, or amount + ±10 min) | nothing — done |
| **UNRECORDED** | money received (statement only) and never booked — **lost revenue** | append the row same sitting: `deal-log.csv` for deal cash, ledger for shop money; then re-run step 4 |
| **GHOST** | booked in the ledger, no statement line | check it is not an out-row/typo; if truly not received, void it with a reason (ledger is append-only: post the opposite type + reason) |
| **AMOUNT MISMATCH** | same M-Pesa code, different KES | one line to the founder the same day: date, amount, ref, which side is wrong; fix the wrong side |

Matching order: M-Pesa code first (full or ≥4-char suffix — a code match with a different amount lands in AMOUNT MISMATCH, never in MATCHED), then same amount within **±10 minutes** (nearest wins; if either side has no time-of-day, same Nairobi calendar day instead). Everything else falls into UNRECORDED / GHOST. The Gap line = statement credits − ledger in: it should be ~0 once the buckets are cleared.

## KPI definitions (same as deal-log.md — computed, never guessed)

1. **Cash collected** — KES total of won rows, split deposit vs balance, weekly and monthly (`deal-summary.mjs`).
2. **Deals by tier** — where revenue concentrates (Starter/Business/Master/…).
3. **Win rate** — won (`deposit_paid`/`delivered`/`balance_paid`) ÷ (won + lost); `quoted` reported separately as open pipeline.
4. **DSO** — average days from `date` to the `paid YYYY-MM-DD` note on `balance_paid` rows.

Reconciliation vocabulary: **UNRECORDED = lost revenue** (received, never booked), **GHOST = phantom booking** (booked, never received), **Gap = statement − ledger**.

P&L vocabulary (`pnl.mjs`): **Revenue** = ledger rows with `type=in`, grouped by `shop`. **Expenses** = `costs.csv` rows grouped by category (Hosting/Domain/Software/Airtime/Data/Transport/Other). **Net** = revenue − expenses. **Margin** = net ÷ revenue. Ledger `out` rows are never counted as revenue — M-Pesa spend gets logged in `costs.csv`.

## costs.csv contract

Repo root, header only until the first real receipt: `date,category,amount_kes,vendor,notes`.
Append-only, one row per spend, `date` as `YYYY-MM-DD`, category from the allowed set above. Zero rows = honest state: the P&L reports expenses 0 instead of guessing.
