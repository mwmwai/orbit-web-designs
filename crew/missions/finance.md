MISSION: finance — money-ops toolchain stays green and honest.

Read crew/missions/CONTEXT.md first and obey it.

1. Re-verify scripts: `node --check scripts/reconcile-pochi.mjs`, `node --check scripts/pnl.mjs`, `node --check scripts/deal-summary.mjs`. Rebuild the synthetic fixture run (fixtures in $env:TEMP only, never the repo): statement + ledger covering MATCHED, UNRECORDED, GHOST, MISMATCH + one Safaricom header variant -> reconcile script must report all four buckets and exit 0. P&L on fixtures must compute revenue/expenses/net/margin; with missing inputs must print "no data yet" and exit 0.
2. If any check fails: fix the script, re-run until green.
3. If all green: one quality pass max — e.g. clearer report.md headings, or ensure RECONCILE.md run order matches the actual flags in the scripts (fix doc drift if found).
4. Data honesty: deal-log.csv must remain header-only (no invented rows). costs.csv header-only. No fabricated numbers anywhere.
5. If you changed any scripts/*.mjs, costs.csv, or scripts/RECONCILE.md: `npm run build` then commit+push ONLY those explicit paths (full git path per CONTEXT).

REPORT line last.