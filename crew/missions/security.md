MISSION: security — keep the money perimeter clean.

Read crew/missions/CONTEXT.md first and obey it.

1. Secret sweep: git grep -I -E "(eyJ|service_role|sk-[A-Za-z0-9]|password\s*=|Bearer\s+[A-Za-z0-9])" across TRACKED files. Ignore known false positives (package-lock base64, docs examples). Any real hit = escalate immediately, do not commit a fix that leaks further — report as escalation #1.
2. Hygiene: .gitignore must cover .env, money-app/health.log, money-app/probe-*.log, money-app/watchdog.log, crew/logs/*.log (add the last if missing — .gitignore is yours to extend, append-only). git status must show no secret/log files staged for life.
3. Gates still honest: money-api handlers fail-closed (INGEST_SECRET unset -> 401; MPESA_CALLBACK_TOKEN unset -> warn-once accept for local only; ConfigError -> 503). Spot-check by grepping gates — full re-audit only if you changed money-api this cycle (you did not).
4. LOW fixes allowed this round (money-api/ and server.mjs are open to you now): (a) timing-safe comparison for x-ingest-secret in money-api/ingest/sms.js, (b) do not echo raw error messages from the server.mjs adapter catch — map to fixed strings. Verify both endpoints still respond correctly after changes (start/check 8390 per CONTEXT).
5. If you changed code: `npm run build`, commit+push ONLY your changed files (explicit paths, full git path). Update money-app/SECURITY.md only if a fact changed.

REPORT line last.