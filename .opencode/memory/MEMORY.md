# Shared Memory - The Boss's Brain

Curated by the Boss. Readable by the whole crew. Small, sharp, current.
If this file grows past 100 lines, the Boss compresses it: keep decisions, drop episodes.

## User

- Name: mwmwa (GitHub: mwmwai)
- Wants maximum leverage from the 233-agent roster via the Boss.
- Prefers action over questions: full permission granted to navigate, access, and run. Do the job, report back.
- Communication: short, direct. No fluff.

## Project (Default Project)

- Astro 7 + Tailwind v4 site. Repo: mwmwai/orbit-web-designs (branch: main).
- Live at orbitwebdesigns.co.ke via Vercel auto-deploy on push.
- After every site change: `npm run build`, then commit and push. Use full paths for git/gh on Windows.
- Dev server: `astro dev --background`; manage with `astro dev stop|status|logs`.
- Agent roster: `.opencode/agents/` (16 group folders, 217 specialists + 16 group Leads + Boss). Inventory: `.opencode/INVENTORY.md`. The same roster is also installed globally at `~/.config/opencode/agents/` so every project gets the crew; project copies win on conflict.
- Chain of command: user -> Boss -> group Lead (`<group>/lead`) -> specialists. Boss delegates group-scoped work to Leads by default.
- Source of truth for agents: Agency Agents corpus at `C:\Users\mwmwa\AppData\Local\Agency Agents\resources\corpus-baseline\`.

## Crew notes

- OpenCode config is NOT hot-reloaded: any agent/config change requires a full restart before it takes effect.
- Agent IDs are folder paths: `<group>/<slug>` (e.g. `engineering/code-reviewer`). Call with `@group/slug`.
- 9 global skill-agents in `~/.agents/skills/` duplicate 9 roster agents (pre-existing, leave alone).
- `subagent_depth: 2` in `.opencode/opencode.json` lets the Boss launch subagents even when invoked as one. Never lower it.

## Lessons learned

- Orbit entry price KES 33,999 sits in the gap between budget (15-45K) and premium custom (78K+); published fixed pricing itself is the differentiator in Nairobi.
- Kenya buyer-decision stack: mobile-first + M-Pesa + WhatsApp + on-page SEO/GBP bundled at entry, not upsold.
- Sourced 2026 KES bands: landing 15-60K, SME 20-85K, e-com 25-130K+, corporate/custom 130-400K+.
- Orbit api/generate.mjs is an unauthenticated paid-credit burn surface; needs Turnstile + rate limit + model allowlist (open item, Sep 30).
- Orbit Turnstile is fail-open when secret unset and newsletter path lacks it; fix to fail-closed (open item, Sep 30).
- Orbit SEO gaps: robots sitemap URL non-www vs www canonicals; llms.txt pricing stale vs live (27,999/39,999/49,999) (open item, Sep 30).
- Audit claims need verification before action: the Sep-30 audit's "duplicate organizationLd build-breaker" was false (single declaration at index.astro:28).
- User runs live editing sessions in parallel: expect in-flight syntax breakage (Layout.astro llms.txt typo + breadcrumbLd TDZ + blog quote escaping all fixed Sep 30, left uncommitted in their tree).
- PowerShell `>` redirect writes UTF-16: restore repo files with Start-Process -RedirectStandardOutput or cmd, never bare `>`.
- 10/10 mission (Oct 1): shipped chat tool-args fix + numeric toolRegex, shared mpesa-tariffs module, esc() entity map, assistant escape-then-format, generate.mjs gate (Turnstile fail-closed + allowlist + caps), newsletter Turnstile widget, slug allowlist via submit.ts, COEP credentialless + CSP scoping, WebP wiring, Layout llms/breadcrumb fixes, astro.config serialize() fix (sitemap was silently not generating), OrbitAssistant quote-mojibake purge.
- OPEN ITEMS Oct 1 (need user): care pricing inconsistent across pages (care.astro cards 6,999/9,999/12,999 vs 4,999/7,999/9,999 everywhere else) — pricing decision, do not guess; confirm TURNSTILE_SECRET_KEY + PUBLIC_TURNSTILE_SITE_KEY in Vercel prod env or all submit paths 503; double-opt-in newsletter deferred; Supabase-backed rate limits deferred (needs migration).
- User edits the tree live in parallel sessions: verify-before-fix always, expect shifting files, never commit their in-flight work.
- Oct 3 money audit: live entry is 28,999 not 33,999 (grep 33,999=0 hits); llms.txt + llms-full.txt stale 27,999; Layout:111 + packages:56 schema 27999 stale; Pricing Master Care 7,999 vs care 9,999 (2K underquote).
- Oct 3 dirty tree 16 files, workflow 39,999 removal half-propagated (chat.ts:59 + llms.txt still sell it); npm run build timed out 120s, dist sitemap 14:08 proves serialize fix works when build completes.
- Oct 3 submit risk: all paths fail-closed 503 without Turnstile secret, local .env lacks keys — check Vercel TURNSTILE_SECRET_KEY + PUBLIC_TURNSTILE_SITE_KEY before deploy.
- Oct 3 SEO: www canonical correct but vercel.json has zero redirects, both hosts 200 splitting equity; fastest cash is WhatsApp 50% M-Pesa deposit + date-in-writing (254741992308), Business 39,999 bump target.
- DECISION NEEDED: care canonical 4,999/7,999/9,999 vs variants + confirm entry 28,999 canonical — do not guess.
- Oct 3 customers kit: WA canonical 254741992308 via config.ts whatsappLink() verified Hero:55 Floating:18 start:28 Pricing:146; autonomous kit ready (auto-reply + 3-msg close + Day1/Day3 follow-ups) — deposit rail LOCKED Pochi 0741992308 Send Money (no STK), 50% = 14,500/20,000/25,000.
- Oct 3 inbound sprint ready: GBP + IG + 2 WA statuses + calculator exit line all to wa.me/254741992308; high-ticket leak Pricing:147-150 SaaS/Agent/Dashboard detour internal vs direct WA.
- Oct 3 lead-loss #1: ContactForm.tsx:28-31 dead-ends when Turnstile key unset (text-only error, no WA button); failover spec = preserve inputs + Send-via-WhatsApp + Copy-details panel.
- Oct 3 verified autonomous: Layout:111 now 28999 fixed, packages:56 still 27999 stale, chat:245/249 27,999 stale, Pochi 0 hits not published; GO patch P0 packages+Pricing Master 9,999+chat+llms + P1 failover + P2 high-ticket WA ready, HOLD till tree clean + care confirm.
- Oct 3 SHIPPED 9e9bbdb: entry 28,999 + Care 4,999/7,999/9,999 live, Pochi 0741992308 published /contact+/start, ContactForm WA failover live, high-ticket direct WA live; build PASS 42 pages, pushed 49b9d03..9e9bbdb.
