MISSION: dashboard — local money UI verified against the live runner.

Read crew/missions/CONTEXT.md first and obey it.

1. Verify serving: GET http://127.0.0.1:8390/dashboard -> 200 text/html (if foreman has not mounted it yet, do NOT edit server.mjs yourself — report blocked-on-foreman instead and continue to step 3 using file:// check).
2. Verify data states with curl against 127.0.0.1:8390 (read-only probes):
   - GET /api/transactions -> currently 503 (env unset): dashboard must show the "backend not configured" banner when loaded.
   - /health -> 200: dashboard must show LIVE banner when API returns 200.
   Simulate in-browser logic by reading dashboard.html: confirm banner code paths for 200/401/503/404 exist and SAMPLE toggle disables export.
3. Browser-level check: if a headless check is impractical, do a DOM/JS static audit: no external URLs (grep http/https in the file except relative fetch), all getElementById targets exist in markup, CSV export escapes quotes, KES format 'KSh ' + toLocaleString('en-KE').
4. Fix any defect you find (you own money-app/dashboard.html exclusively). Re-run node --check on the extracted script after edits.
5. One improvement max if everything is green (e.g. add a last-updated timestamp or error detail line). No scope creep.
6. If you changed money-app/dashboard.html: no build needed (not part of Astro output) — commit+push ONLY that file after `npm run build` passes (CONTEXT rules).

REPORT line last.