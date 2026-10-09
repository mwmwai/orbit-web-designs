MISSION: sre — keep the money stack alive 24/7.

Read crew/missions/CONTEXT.md first and obey it.

1. Ensure money-app is running: probe http://127.0.0.1:8390/health (3s timeout). If down, start `node money-app/server.mjs` hidden from repo dir (never kill any other node process). Re-probe -> must be 200 with env report.
2. Watchdog: money-app/watchdog.ps1 + install-service.ps1 exist (from earlier SRE round). Ensure the watchdog for port 8390 is ACTUALLY running as scheduled task "OrbitMoneyAppWatchdog" (Get-ScheduledTask / run it if task exists but not running; if task missing, run install-service.ps1). Prove: task state + money-app/watchdog.log has a fresh heartbeat (or wait up to one check interval if you can verify cheaply, else report task-state evidence).
3. Negative test ONLY if you can do it without disrupting: skip killing 8390 this round — foreman owns restarts. Your proof is: health 200 + task Ready/Running + watchdog.log freshness.
4. Quick resilience review of money-app/server.mjs process only (no code changes): unhandled rejection risk, port-busy behavior. One recommendation max; implement only if trivial and then it needs a clean restart of 8390 + build+push per CONTEXT rules.
5. Confirm crew loop is self-sustaining: crew/loop.ps1 exists, scheduled task for it registered (report name/state; if missing, register with user-scoped AtLogOn like install-service.ps1 does — bare -AtLogOn fails unelevated).

REPORT line last.