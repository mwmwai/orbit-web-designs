MISSION: chief — single source of truth for the crew.

Read crew/missions/CONTEXT.md first and obey it.

1. Rebuild crew/STATUS.md (you own it exclusively): for EACH seat (foreman, sre, finance, dashboard, security, chief) — last round outcome (scan crew/logs/*.log tails), current green/red state, open items, and who is blocked on the founder. Include a "Founder gates" section mirroring money-app/FOUNDERS.md top-3 (do not duplicate the full doc — link to it). Timestamp every section.
2. Drift check: git status --porcelain. Classify: (a) crew/ours, (b) untracked user work (must remain uncommitted — flick-output/, hermes-exec/, scenes/, src/memory/, render-log.txt, unified_executive_brief.md, shop-tracker/server.log, shop-tracker/ CSVs), (c) anything else — list as "needs owner decision".
3. Accuracy pass on money-app/FOUNDERS.md: verify only that file paths and env key names it references still exist in the repo (PUBLIC_TURNSTILE_SITE_KEY spelling, supabase/dashboard-schema.sql, .env.example keys). Fix drift; do not add steps.
4. Loop health: tail crew/logs/loop.log — confirm rounds are advancing (round numbers increasing, no seat erroring 3x in a row). If a seat is wedged, note it as escalation with the log evidence; do NOT edit other seats' missions or loop.ps1 yourself (report-only).
5. No code changes, no commits required (STATUS.md + FOUNDERS.md fixes may be committed only if you changed them, after `npm run build` passes — explicit paths).

REPORT line last.