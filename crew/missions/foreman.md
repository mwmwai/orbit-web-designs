MISSION: foreman — integration + ship round.

Read crew/missions/CONTEXT.md first and obey it.

1. ADAPTER BUG (top priority): money-app/server.mjs mounts money-api handlers via a req/res shim, but POST bodies are not reaching handlers.
   - REPRO (expected vs actual): start server (node money-app/server.mjs, port 8390), then
     curl -X POST http://127.0.0.1:8390/api/mpesa/c2b/confirmation -H "Content-Type: application/json" -d "{\"TransID\":\"T1\",\"TransAmount\":\"100\",\"BusinessShortCode\":\"1\",\"TransTime\":\"20261008120000\"}"
     ACTUAL: HTTP 200 {"ResultCode":0,"ResultDesc":"Success"} (body parsed as empty -> malformed-ack path at confirmation.js:56).
     EXPECTED: HTTP 503 {"ResultCode":1,...} because env is unset -> insertDeduped -> ConfigError (name "ConfigError") -> confirmation.js:90-95.
   - PROOF the handler itself is correct: calling handler directly with req.body = JSON string returns 503 + logs "[shop-ingest] missing env".
   - Suspects: rawBody(req) in server.mjs (empty string despite curl -d), or r.body ending up undefined so readJson falls to the stream path and throws (plain object has no .on) -> catch -> {}. Instrument, find root cause, fix server.mjs ONLY (handlers are correct).
   - Re-verify: confirmation POST -> 503; GET /api/transactions -> 503 {"ok":false,...}; POST /api/ingest/sms (no body) -> 401; validation POST -> 200 ResultCode 0; /health -> 200.
2. MOUNT DASHBOARD: money-app/dashboard.html exists (built by dashboard seat). Serve it at /dashboard in server.mjs the same way / serves shop-tracker/index.html (path.join(ROOT,'money-app','dashboard.html')). Verify curl returns 200 + text/html.
3. RESTART CLEANLY: find the PID listening on 8390 (only that one), kill it, start `node money-app/server.mjs` hidden from the repo dir, re-run all checks in step 1 + /dashboard.
4. SHIP: run `npm run build`. If green, commit and push ONLY: money-app/server.mjs, any crew/** files, opencode.json, and any other files YOU created this round. ALSO commit this known-approved backlog (all untracked/modified by prior team rounds, founder-approved Oct 6): scripts/reconcile-pochi.mjs, scripts/pnl.mjs, scripts/deal-summary.mjs, scripts/RECONCILE.md, costs.csv, deal-log.csv, deal-log.md, supabase/dashboard-schema.sql, money-app/dashboard.html, money-app/watchdog.ps1, money-app/install-service.ps1, money-app/OPS.md, money-app/SECURITY.md, money-app/FOUNDERS.md, money-app/README.md. Do NOT add unrelated dirty files (git add by explicit path only). Use full paths: C:\Program Files\Git\bin\git.exe, C:\Program Files\GitHub CLI\gh.exe.
5. Escalate anything you cannot fix without founder action (env keys, Daraja, sitekey).

REPORT line last.