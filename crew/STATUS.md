# crew/STATUS.md — single source of truth (owner: chief seat)

Rebuilt 2026-10-09T13:46 local by chief, round=30 (loop session B, pid=3404, started 2026-10-09T07:16:31). Sources: `crew/logs/{loop,foreman,sre,finance,dashboard,security}.log` tails, `git status --porcelain`, `git log`, live probes recorded by sre r26 / security r29, `money-app/FOUNDERS.md` accuracy pass. Per-section timestamps below.

---

## Loop health — 2026-10-09T13:45

`crew/logs/loop.log` — session B is **advancing steadily**: rounds 1→30, ~6.5h uptime, no silent death. Since last rebuild (r24):

| Round | Seat | Result |
|---|---|---|
| 24 | chief | Completed, 324s (13:19:17) — previous STATUS.md |
| 25 | foreman | **Completed, 610s (13:29:39) — UNWEDGED after 5 consecutive timeouts** |
| 26 | sre | Completed, 350s (13:35:41) — all checks pass, no changes |
| 27 | finance | Completed, 250s (13:40:02) — fixtures green; RECONCILE.md drift fix → `ef817be` |
| 28 | dashboard | Completed, 104s (13:41:56) — audits clean, no changes |
| 29 | security | Completed, 108s (13:43:55) — sweep + live probes clean, no changes |
| 30 | chief | start 13:44:05 (this round, in progress) |

**3-strike check: no seat wedged.** Foreman's 5-timeout streak (21:37:42, 07:59:06, 10:16:09, 11:42:02, 12:43:10) **ended** at r25 — completed in 610s, produced a full round (root-cause analysis + restart + ship `8d85de5`). All six seats have now completed cleanly in the current cycle. Zero seat has failed even once since r19.

**Escalations (report-only; loop.ps1 and other missions untouched):**
1. **Resolved — foreman wedge:** unwedged itself at r25 (log evidence: `foreman.log` 13:29:39, full round + REPORT line). Its earlier timeouts left zero output (L1: timeout path still loses seat output — carried as watch-only, no recurrence since).
2. **L1 carried — timeout path loses seat output** (5 historic timeouts, 0 logs; no new data point this cycle).
3. **L2 (silent loop death) — no recurrence this session**; carried as watch-only.
4. **Owner decisions carried:** `src/pages/dashboard.astro` (money page vs off-domain rule) and `money-app/start.cmd` — both still untracked, see Drift (c). Note: `opencode.json` owner decision **closed** — committed in `8d85de5` (foreman r25, founder-approved backlog list).

---

## Seats

### foreman — 2026-10-09T13:30
- **Last round:** round=25 (session B), **Completed 610s** — first clean round after 5 consecutive timeouts. Outcome: (1) root-caused the c2b "503" confusion — server.mjs at HEAD was already correct; the earlier odd behavior was **client-side PowerShell/curl quoting** (mangled `\"` → 2-byte body → Safaricom malformed-ack path); valid JSON from file correctly returns 503 ConfigError. Per idempotency, did not churn server.mjs. (2) Confirmed `/dashboard` already mounted (`server.mjs:119-126`), 200 + text/html (26,643 B). (3) Clean restart of the money-app listener only: PID 13252 → **PID 6728**; 7/7 probes pass (c2b confirmation 503, transactions 503, ingest 401, validation 200, /health 200, /dashboard 200, / 200). (4) Shipped **`8d85de5`** after green build (43 pages): crew scaffolding, `opencode.json`, founder-approved backlog (`deal-log.csv/.md` header-only, `money-app/{FOUNDERS,OPS,README}.md`, `install-service.ps1`, `watchdog.ps1`, `supabase/dashboard-schema.sql`).
- **State: GREEN** (unwedged; work verified and shipped).
- **Open items:** watch for wedge recurrence at its next turn (r36).
- **Blocked on founder:** no — but escalates Gate 2 env keys (all 7 unset; endpoints correctly fail-closed 503), plus owner calls on `src/pages/dashboard.astro` and `money-app/start.cmd`.

### sre — 2026-10-09T13:35
- **Last round:** round=26 (session B), Completed 350s. All checks pass, no changes: `/health` 200 (PID 6728, post-foreman restart), watchdog **fresh heartbeat captured live** (`10:34:54Z status=up port=8390`), tasks `OrbitMoneyAppWatchdog` + `OrbitCrew` both Running. Resilience review: two known soft spots (`server.listen` no `'error'` listener; `new Promise(async…)` at server.mjs:61/130) — **diagnostics-only recommendation parked** (watchdog self-heals; implementing would be churn right after foreman's restart).
- **State: GREEN.**
- **Open items:** parked recommendation (optional diagnostics handlers) — no action required.
- **Blocked on founder:** no (7 `missing` env keys are the expected Gate 2 state).

### finance — 2026-10-09T13:40
- **Last round:** round=27 (session B), Completed 250s. `node --check` ×3 green; fixtures in `%TEMP%\orbit-finance-fixtures` (reconcile: MATCHED 1 / UNRECORDED 1 / GHOST 1 / AMOUNT MISMATCH 1 + Safaricom header variant, exit 0; P&L rev 4,900 / exp 1,280 / net 3,620 / margin 73.9% on fixtures, exit 0; "no data yet" paths exit 0). One doc drift fixed: `scripts/RECONCILE.md:3` falsely claimed deal-summary "exit 0 always" → corrected, shipped alone as **`ef817be`** after build. `deal-log.csv` / `costs.csv` remain header-only; synthetic numbers stayed in TEMP.
- **State: GREEN.**
- **Open items:** `deal-log.csv` + `deal-log.md` are now **tracked** (header-only, committed in `8d85de5`) — fine as-is; awaiting Gate 4 data.
- **Blocked on founder:** Gate 4 (Pochi CSV — no real statement data exists) and Gate 2 (schema run + env before any row can be written).

### dashboard — 2026-10-09T13:42
- **Last round:** round=28 (session B), Completed 104s. Probes: `/dashboard` 200 text/html, `/api/transactions` 503 (expected), `/health` 200. Static audit of `dashboard.html`: 0 external URLs, 0 missing DOM ids (incl. dynamic kToday/k7/k30 sets), CSV escaping + `node --check` OK. Suggested improvements already present → **zero churn, no commit**. (Cosmetic: its REPORT line self-labeled "design-ui" — no action.)
- **State: GREEN.**
- **Open items:** none.
- **Blocked on founder:** Gate 2 (`/api/transactions` → 503, re-confirmed r28/r29).

### security — 2026-10-09T13:44
- **Last round:** round=29 (session B), Completed 108s — **4th consecutive clean round**. Secret sweep: 40+ grep hits, all false positives, 0 live keys. Hygiene: `.gitignore` covers `.env`, money-app logs, `crew/logs/*.log`; `git ls-files` confirms zero secrets/logs tracked. Live gate tests fail-closed: ingest bogus-secret **401**, transactions **503** ConfigError, C2B warn-once accept (token unset). Both prior LOW items already implemented (timing-safe `shaEq`, fixed-string adapter errors) — zero diff.
- **State: GREEN.**
- **Open items:** none.
- **Blocked on founder:** no for its own work; Gates 2/3 remain the standing arming condition for money go-live.

### chief — 2026-10-09T13:46
- **Last round:** round=30 (session B), **this round, in progress** (start 13:44:05). Deliverables: STATUS.md rebuilt (foreman unwedged), drift re-classified post-`8d85de5`/`ef817be`, FOUNDERS accuracy pass (one drift fixed: Gate 2 step 1 stale "uncommitted schema" warning), loop health assessed.
- **State: IN PROGRESS** → green on completion of REPORT line.
- **Open items:** see Escalations.
- **Blocked on founder:** no.

---

## Founder gates (top-3 mirror — full doc: [`money-app/FOUNDERS.md`](../money-app/FOUNDERS.md)) — 2026-10-09T13:45

1. **Gate 1 — Turnstile sitekey** (`PUBLIC_TURNSTILE_SITE_KEY` → Vercel → redeploy): restores live inbound — contact-form leads + newsletter (currently fail-closed 400).
2. **Gate 2 — Supabase schema + owner user** (FOUNDERS steps 1–3): unlocks every data call; money-app `/health` still shows the same 7 `env_missing` keys (sre r26 + security r29 probes agree).
3. **Gate 4 — Pochi statement export** (steps 1–2 → Finance): the only path to a real cash number; no financial number may be stated until it lands.

Also in the doc: Gate 3 (Daraja C2B URLs, gated on step 0 + Gate 2), Gate 5 (push approval — standing; used by foreman r25 `8d85de5` and finance r27 `ef817be` this session). Sequencing per FOUNDERS: 1 and 2 parallel, 4 needs nothing, 3 needs 2 + step 0. **Do not duplicate the doc — read it.**

**Who is blocked on the founder right now:** finance (4, 2), dashboard (2), site lead-gen/newsletter (1). sre, security, foreman, chief: not blocked (foreman's env-key escalation folds into Gate 2).

---

## FOUNDERS.md accuracy pass — 2026-10-09T13:45 (one drift fixed)

Verified only paths + env key names, per mission:
- **Fixed (only edit):** Gate 2 step 1 claimed the strict-RLS + amount≤10M schema edits were **uncommitted** so "git/HEAD copy is stale" — foreman r25 committed them in **`8d85de5`** and the working tree is clean (`git diff HEAD -- supabase/dashboard-schema.sql` empty; HEAD contains the amount≤10M check). Parenthetical updated to say disk + HEAD are both current. No steps added or changed.
- `PUBLIC_TURNSTILE_SITE_KEY` still read at all four referenced sites: `src/components/Footer.astro:5`, `src/components/react/ContactForm.tsx:4`, `src/components/Comments.astro:56`, `src/layouts/Layout.astro:310` (script tag at :311). `TURNSTILE_SECRET_KEY` read only in `api/generate.mjs:1` + `api/supabase/submit.ts:7`, as claimed.
- `api/supabase/submit.ts:130` — missing-turnstile-token check → 400 path, as Gate 1 describes.
- `supabase/dashboard-schema.sql` exists; strict RLS (`is_owner`) + `amount <= 10000000` constraint present on disk and in HEAD.
- `.env.example` lists exactly the eight named keys (`PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `DARAJA_CONSUMER_KEY`, `DARAJA_CONSUMER_SECRET`, `TILL_SHOP_MAP`, `POCHI_SHOP_MAP`, `INGEST_SECRET`); `MPESA_CALLBACK_TOKEN` still absent from it (as claimed) and still used by `money-api/_lib/shop-ingest.js`, `money-api/mpesa/c2b/confirmation.js`, `money-app/server.mjs:33`.
- All seven referenced scripts exist under `scripts/`. Gate 3 refs (`money-api/`, `money-app/server.mjs`, `money-app/README.md`, `DARAJA-SETUP.md`, commit `1e7a6c4`) all real.

---

## Drift check — `git status --porcelain` @ 2026-10-09T13:44 (HEAD=`ef817be`)

**(a) crew/ours** — *empty this round.* Foreman r25 committed the previously-untracked crew/money-app backlog in `8d85de5` (crew/, `opencode.json`, `deal-log.csv/.md`, `money-app/{FOUNDERS,OPS,README}.md`, `install-service.ps1`, `watchdog.ps1`, `supabase/dashboard-schema.sql`). Tracked files are clean; no modified files anywhere.

**(b) untracked user work — must remain uncommitted:**
- `?? flick-output-2026-10-04-marketing/`, `?? flick-output-2026-10-04-reinstall/`, `?? hermes-exec/`, `?? scenes/`, `?? src/memory/`, `?? render-log.txt`, `?? unified_executive_brief.md`. (`shop-tracker/server.log` gitignored, not in porcelain; shop-tracker dir holds only index.html, README.md, serve-local.py, server.log, supabase.sql — no CSVs.)

**(c) needs owner decision:**
- `?? src/pages/dashboard.astro` — untracked **money page under `src/pages/`**; violates the standing off-domain rule (CONTEXT.md line 7) unless the founder explicitly asks for it back. Decision: remove it, or owner explicitly approves (then a deliberate commit — not a crew default). **(carried 4th round; foreman r25 re-escalated)**
- `?? money-app/start.cmd` — small money-app launcher, crew-created, **not** on the founder-approved commit list; foreman r25 deliberately left it uncommitted for the founder's call. Decision: commit as ops tooling, or ignore/delete. **(new this round, promoted from old (a) after the rest of money-app shipped)**

---

## Escalations (chief, 2026-10-09T13:46)

1. **Owner decisions:** `src/pages/dashboard.astro` (money page vs off-domain rule, 4th round) and `money-app/start.cmd` (commit or ignore, new) — both drift (c).
2. **L1 carried — loop.ps1 timeout path loses seat output** (5 historic timeouts, 0 logs; foreman's r25 success means no recurrence; watch-only).
3. **L2 watch — silent loop death** (no recurrence this session; watch-only).
4. **Resolved this cycle (no action needed):** foreman wedge (unwedged r25, shipped `8d85de5`); orphan `server.mjs` diff (`8a86b44`, prior cycle); `opencode.json` decision (committed in `8d85de5`); FOUNDERS schema-staleness drift (fixed this round); finance doc drift (`ef817be`).
