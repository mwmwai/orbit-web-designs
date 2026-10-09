# crew/STATUS.md — single source of truth (owner: chief seat)

Rebuilt 2026-10-09T14:51 local by chief, round=36 (loop session B, pid=3404, started 2026-10-09T07:16:31). Sources: `crew/logs/{loop,foreman,sre,finance,dashboard,security}.log` tails, `git status --porcelain`, `git log`, live probes (8390 `/health`, `money-app/watchdog.log`, `money-app/health.log`), `money-app/FOUNDERS.md` accuracy pass. Per-section timestamps below.

---

## Loop health — 2026-10-09T14:50

`crew/logs/loop.log` — session B still **advancing**: rounds 1→36, ~7.6h uptime, no silent death. Since last rebuild (r30):

| Round | Seat | Result |
|---|---|---|
| 30 | chief | Completed, 321s (13:49:28) — previous STATUS.md, commit `7e491d9` |
| 31 | foreman | **TIMEOUT after 2400s (14:29:43) — killed, rotating** |
| 32 | sre | Completed, 140s (14:32:13) — all checks green |
| 33 | finance | Completed, 229s (14:36:12) — fixtures green, zero repo changes |
| 34 | dashboard | Completed, 365s (14:42:33) — Retry-on-error-banner shipped `b834bcc` |
| 35 | security | Completed, 287s (14:47:31) — sweep + live gates clean |
| 36 | chief | start 14:47:41 (this round, in progress) |

**3-strike check: no seat wedged.** Session-B failure history: security timed out once (09:03:27, r5) then 5 straight clean rounds; foreman timed out 4 consecutive times (07:59:06, 10:16:09, 11:42:02, 12:43:10), **succeeded at r25**, then timed out again at **r31 (14:29:43) — current streak = 1 failure**. Zero seat has failed twice in a row, let alone 3×. Rounds are increasing, every seat except foreman has completed cleanly since r25.

**Escalations (report-only; loop.ps1 and other missions untouched):**
1. **Foreman r31 timeout — 1 strike, plus new L1 evidence.** The round wrote **zero lines** to `foreman.log` (file mtime still 13:29:39 = r25) before the 2400s kill. **Timeout path has now lost seat output 6× (0 lines logged).** Side-effect inferred from uptime math, not logs: `/health` reported `uptime_s=2142` at 14:31 (sre r32) and `uptime_s=3311` at 14:49 (chief probe) → listener start **≈13:53–13:56**, inside r31's window (13:49:38–14:29:43); `money-app/watchdog.log` shows **no down/restart event** around then (only `status=up` heartbeats 10:54:57Z / 11:04:59Z), so foreman r31 almost certainly restarted the money-app listener itself, then went silent until killed. Watch next foreman turn (r37): a success clears the strike; 2 more consecutive timeouts = a real wedge (3-strike → escalate loudly).
2. **L1 carried — loop.ps1 timeout path loses seat output** (now 6 historic timeouts, 0 log lines; report-only, no recurrence between r25 and r31).
3. **L2 (silent loop death) — no recurrence this session**; watch-only.
4. **Owner decisions carried:** `src/pages/dashboard.astro` (money page vs off-domain rule, **5th round**) and `money-app/start.cmd` (commit or ignore, 2nd round) — both drift (c).

---

## Seats

### foreman — 2026-10-09T14:51
- **Last round:** round=31 (session B), **TIMEOUT after 2400s** (13:49:38 → killed 14:29:43, rotated). **No output written** — `foreman.log` unchanged since r25's REPORT (13:29:39). Inferred (uptime math, see Loop health): it restarted the money-app listener ≈13:54 before wedging; not confirmable from logs because of the output loss.
- **State: RED — 1 strike** (single timeout; not wedged; seat rotated normally and the loop kept going).
- **Open items:** next turn **r37** — a clean round clears the strike; investigate why r31 exceeded 2400s (its last good round took 610s); 2 consecutive further timeouts = wedge → escalate.
- **Blocked on founder:** no — but escalates Gate 2 env keys (all 7 unset; endpoints correctly fail-closed 503) plus owner calls on `src/pages/dashboard.astro` and `money-app/start.cmd` (re-raised at r25).

### sre — 2026-10-09T14:32
- **Last round:** round=32 (session B), Completed 140s. All checks green, no changes: `/health` 200, `uptime_s=2142` → **first detector of the ≈13:56 listener restart**; scheduled tasks `OrbitMoneyAppWatchdog` + `OrbitCrew` both Running; watchdog heartbeat fresh; resilience review → one recommendation parked (`server.on('error')` for clean EADDRINUSE log — cosmetic, not worth an 8390 restart per idempotency).
- **State: GREEN.**
- **Open items:** parked diagnostics recommendation — no action required.
- **Blocked on founder:** no (7 `missing` env keys are the expected Gate 2 state).

### finance — 2026-10-09T14:36
- **Last round:** round=33 (session B), Completed 229s. `node --check` ×3 green; TEMP fixtures (`%TEMP%\finance-fixtures`): reconcile MATCHED 1 / UNRECORDED 1 / GHOST 1 / AMOUNT MISMATCH 1 with Safaricom variant header, exit 0; P&L rev 12,500 / exp 1,500 / net 11,000 / margin 88.0% **on fixtures**, exit 0; missing-input → "no data yet" exit 0; deal-summary on header-only `deal-log.csv` → honest "no deals yet" exit 0. Doc-drift check on `scripts/RECONCILE.md` — no drift. **Zero repo changes, no commit** (synthetic numbers stayed in TEMP).
- **State: GREEN.**
- **Open items:** `deal-log.csv` + `deal-log.md` + `costs.csv` tracked and header-only — awaiting Gate 4 data.
- **Blocked on founder:** Gate 4 (Pochi CSV — no real statement data exists) and Gate 2 (schema run + env before any row can be written).

### dashboard — 2026-10-09T14:42
- **Last round:** round=34 (session B), Completed 365s. `/dashboard` 200, byte-identical to `money-app/dashboard.html`; `/api/transactions` 503 (expected); `/health` 200; static audit clean (0 external URLs, all 19 DOM ids present, CSV escaping + `node --check` OK). One improvement added: **error banners (netErr/401/503/404/unexpected) now offer Retry** alongside "Use sample data". Green build → committed **`b834bcc`** (explicit path `money-app/dashboard.html` only) and pushed.
- **State: GREEN.**
- **Open items:** none.
- **Blocked on founder:** Gate 2 (`/api/transactions` → 503, re-confirmed r34/r35).

### security — 2026-10-09T14:47
- **Last round:** round=35 (session B), Completed 287s — **5th consecutive clean round**. Secret sweep clean (all hits false positives: CSS `mask-` `sk-` match, doc examples, package-lock hashes, env-var *names*); hygiene confirmed (`.gitignore:42-46` covers `.env`, money-app logs, `crew/logs/*.log`, `shop-tracker/server.log`; `git check-ignore` ✓; nothing secret/log staged). Live gates on 8390 fail as designed: ingest/sms **401**, c2b/confirmation **200 ResultCode 0** (token unset = warn-once accept), transactions **503**. Both prior LOW fixes already landed in `71539ce` — zero diff, no build/commit.
- **State: GREEN.**
- **Open items:** none.
- **Blocked on founder:** no for its own work; Gates 2/3 remain the standing arming condition for money go-live.

### chief — 2026-10-09T14:51
- **Last round:** round=36 (session B), **this round, in progress** (start 14:47:41). Deliverables: STATUS.md rebuilt (foreman r31 timeout assessed, not wedged), drift re-classified post-`b834bcc`, FOUNDERS accuracy pass (one path drift fixed: `public/shop-tracker/` → `shop-tracker/`), loop health assessed.
- **State: IN PROGRESS** → green on build + commit + REPORT line.
- **Open items:** see Escalations.
- **Blocked on founder:** no.

---

## Founder gates (top-3 mirror — full doc: [`money-app/FOUNDERS.md`](../money-app/FOUNDERS.md)) — 2026-10-09T14:51

1. **Gate 1 — Turnstile sitekey** (`PUBLIC_TURNSTILE_SITE_KEY` → Vercel → redeploy): restores live inbound — contact-form leads + newsletter (currently fail-closed 400).
2. **Gate 2 — Supabase schema + owner user** (FOUNDERS steps 1–3): unlocks every data call; money-app `/health` still reports the same 7 `env_missing` keys (sre r32 + chief r36 probe agree).
3. **Gate 4 — Pochi statement export** (steps 1–2 → Finance): the only path to a real cash number; no financial number may be stated until it lands.

Also in the doc: Gate 3 (Daraja C2B URLs, gated on step 0 + Gate 2), Gate 5 (push approval — standing; used by dashboard r34 `b834bcc` this cycle). Sequencing per FOUNDERS: 1 and 2 parallel, 4 needs nothing, 3 needs 2 + step 0. **Do not duplicate the doc — read it.**

**Who is blocked on the founder right now:** finance (4, 2), dashboard (2), site lead-gen/newsletter (1). sre, security, chief: not blocked; foreman: not blocked for its own work (its env-key escalation folds into Gate 2, plus the two owner decisions).

---

## FOUNDERS.md accuracy pass — 2026-10-09T14:51 (one drift fixed)

Verified only paths + env key names, per mission:
- **Fixed (only edit):** Gate 5 step 3 referenced **`public/shop-tracker/`** — that directory no longer exists (removed at commit `1e7a6c4`, the same commit FOUNDERS cites). Corrected to the live path **`shop-tracker/`** (tracked: `index.html`, `README.md`, `serve-local.py`, `supabase.sql`; `server.log` gitignored at `.gitignore:46`). No steps added or changed.
- `PUBLIC_TURNSTILE_SITE_KEY` spelling intact and read at all four referenced sites: `src/components/Footer.astro:5`, `src/components/react/ContactForm.tsx:4`, `src/components/Comments.astro:56`, `src/layouts/Layout.astro:310` (script tag :311). `TURNSTILE_SECRET_KEY` read only in `api/generate.mjs:1` + `api/supabase/submit.ts:7`, as claimed.
- `api/supabase/submit.ts:130` — missing-turnstile-token check → 400, as Gate 1 describes.
- `supabase/dashboard-schema.sql` exists; strict RLS (`is_owner` policies :70-71) + `check (amount > 0 and amount <= 10000000)` (:84) present on disk and in HEAD.
- `.env.example` lists exactly the eight named keys (`PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `DARAJA_CONSUMER_KEY`, `DARAJA_CONSUMER_SECRET`, `TILL_SHOP_MAP`, `POCHI_SHOP_MAP`, `INGEST_SECRET`); `MPESA_CALLBACK_TOKEN` still absent from it (as claimed) and still read by `money-api/_lib/shop-ingest.js:48`, `money-api/mpesa/c2b/{validation,confirmation}.js`, `money-app/server.mjs:33`.
- All seven scripts named in Gate 4 exist under `scripts/`. Gate 3 refs (`money-api/`, `money-app/server.mjs`, `money-app/README.md`, `DARAJA-SETUP.md`, `money-app/health.log`, `deal-log.md`, commits `1e7a6c4` + `998f404`, and the recoverable blob `git show 1e7a6c4^:src/pages/dashboard.astro`) all resolve.

---

## Drift check — `git status --porcelain` @ 2026-10-09T14:50 (HEAD=`b834bcc`)

**(a) crew/ours** — only this round's own edits: `M crew/STATUS.md` (this file) and `M money-app/FOUNDERS.md` (the one-path fix above). Everything else tracked is clean; no other modified files.

**(b) untracked user work — must remain uncommitted:**
- `?? flick-output-2026-10-04-marketing/`, `?? flick-output-2026-10-04-reinstall/`, `?? hermes-exec/`, `?? scenes/`, `?? src/memory/`, `?? render-log.txt`, `?? unified_executive_brief.md`.
- `shop-tracker/server.log` is gitignored (`.gitignore:46`), so it never appears in porcelain; the `shop-tracker/` dir holds **no CSVs** (only `index.html`, `README.md`, `serve-local.py`, `server.log`, `supabase.sql`). Tracked CSVs `costs.csv` / `deal-log.csv` are header-only, committed, clean.

**(c) needs owner decision:**
- `?? src/pages/dashboard.astro` — untracked **money page under `src/pages/`**; violates the standing off-domain rule (CONTEXT.md line 7) unless the founder explicitly asks for it back. Decision: remove it, or owner explicitly approves (then a deliberate commit — not a crew default). **(carried 5th round; foreman r25 re-escalated)**
- `?? money-app/start.cmd` — small money-app launcher, crew-created, **not** on the founder-approved commit list; foreman r25 deliberately left it uncommitted for the founder's call. Decision: commit as ops tooling, or ignore/delete. **(carried 2nd round)**

---

## Escalations (chief, 2026-10-09T14:51)

1. **Owner decisions:** `src/pages/dashboard.astro` (money page vs off-domain rule, 5th round) and `money-app/start.cmd` (commit or ignore, 2nd round) — both drift (c).
2. **Foreman r31 timeout (1 strike) + L1 recurrence:** 2400s kill at 14:29:43, zero log lines, unlogged listener restart ≈13:54. Watch r37; 2 more consecutive timeouts = wedge. loop.ps1/missions not touched (report-only).
3. **L1 carried — loop.ps1 timeout path loses seat output** (now 6 timeouts, 0 seat-log lines; watch-only).
4. **L2 watch — silent loop death** (no recurrence this session; watch-only).
5. **Resolved/closed, no action:** foreman wedge r25 (`8d85de5`); `opencode.json` decision (`8d85de5`); FOUNDERS schema-staleness note (r30, `7e491d9`); finance doc drift (`ef817be`); FOUNDERS `public/shop-tracker/` path (fixed this round); dashboard Retry ships `b834bcc`.
