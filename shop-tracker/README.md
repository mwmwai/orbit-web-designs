# Duka Tracker — Shop Money In / Out Dashboard

Standalone app. No build, no npm. Just open `shop-tracker/index.html` in a browser.

## Use
1. Open `index.html`
2. Add sales (IN) and expenses (OUT) by hand
3. Or Import M-Pesa CSV (Safaricom statement download)
4. Filter by date / type / category / method, search, export CSV

## Data
- Stored on device in `localStorage` (`duka_txns_v1`). Works offline.
- Export CSV anytime for backup / accountant.

## Optional cloud sync (Supabase)
1. Supabase Dashboard → SQL Editor → run `supabase.sql`
2. Later: point the app at your project to sync devices (ask me and I'll wire it).

## Categories
- IN: Sales, M-Pesa In, Other Income
- OUT: Restock, Rent, Salaries, Transport, Utilities, Airtime/Data, M-Pesa Fees, Food, Other Expense
