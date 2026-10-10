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
4. NO BUILD, NO PUSH this seat (you have timed out 7x — build/push now belongs to chief). Instead: list every file you changed/created in your REPORT line as `CHANGED: <paths>`.
4b. CLEANUP: delete money-app/dbg-server.mjs, money-app/server-test-tmp.mjs, money-app/test8391.err, money-app/test8391.out (debug leftovers). MOVE src/pages/dashboard.astro (untracked money page — owner override keeps money OFF the public domain) to money-app/pages/dashboard.astro (mkdir money-app\pages first; archive, do not delete). Verify `npm` NOT needed: Test-Path src/pages/dashboard.astro must be False after the move. Report the move so founder can object.
4c. Escalate anything you cannot fix without founder action (env keys, Daraja, sitekey).

REPORT line last.