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
- Oct 3 SEO: www canonical correct but vercel.json has zero redirects, both hosts 200 splitting equity; fastest cash is WhatsApp 50% M-Pesa deposit + date-in-writing (254741992308), Business 39,999 bump target. [STALE re redirects — see Oct 4]
- DECISION NEEDED: care canonical 4,999/7,999/9,999 vs variants + confirm entry 28,999 canonical — do not guess.
- Oct 3 customers kit: WA canonical 254741992308 via config.ts whatsappLink() verified Hero:55 Floating:18 start:28 Pricing:146; autonomous kit ready (auto-reply + 3-msg close + Day1/Day3 follow-ups) — deposit rail LOCKED Pochi 0741992308 Send Money (no STK), 50% = 14,500/20,000/25,000.
- Oct 3 inbound sprint ready: GBP + IG + 2 WA statuses + calculator exit line all to wa.me/254741992308; high-ticket leak Pricing:147-150 SaaS/Agent/Dashboard detour internal vs direct WA.
- Oct 3 lead-loss #1: ContactForm.tsx:28-31 dead-ends when Turnstile key unset (text-only error, no WA button); failover spec = preserve inputs + Send-via-WhatsApp + Copy-details panel.
- Oct 3 verified autonomous: Layout:111 now 28999 fixed, packages:56 still 27999 stale, chat:245/249 27,999 stale, Pochi 0 hits not published; GO patch P0 packages+Pricing Master 9,999+chat+llms + P1 failover + P2 high-ticket WA ready, HOLD till tree clean + care confirm.
- Oct 3 SHIPPED 9e9bbdb: entry 28,999 + Care 4,999/7,999/9,999 live, Pochi 0741992308 published /contact+/start, ContactForm WA failover live, high-ticket direct WA live; build PASS 42 pages, pushed 49b9d03..9e9bbdb.
- Oct 3 SHIPPED bc9913b (SEO max): FAQPage+visible Q&As x6 posts, BlogPosting enrichment x12, homepage FAQPage+ItemList, Layout Offer 28999 + breadcrumb dupe removed + knowsAbout, Master Care fixes; build PASS 42 pages, IndexNow 200, live verified.
- Oct 3 SHIPPED cea97e8 (SEO max 2): FAQPage money pages x3 + cases x3 + start.astro, stale care prices (start card, mpesa-store card, care-blog, orbit-vs table), nested-article bug pattern on script inserts (restore close tag); build PASS 42 pages, IndexNow 200, live verified.
- Oct 3 SHIPPED: price truth final pass — index.astro SaaS 12,999→14,999, Design 7,999→9,999, Dashboard 3,999→4,999; AI toggle moved right + AI badge white; cookie banner centered; FloatingActions moved left; build PASS 42 pages, IndexNow 200.
- Oct 5 SHIPPED [last] 078dc71: homepage guides section removed (user request); OrbitAssistant.astro recovered from 6a7ba42 after working-tree corruption (whole-file write wiped it; voice/lang/nudge AI edits never committed — lost, re-apply as targeted edits if wanted); video agent group (4) committed; build PASS 42 pages, IndexNow 200, live verified.
- Oct 5 shop-tracker restyled → PROFESSIONAL light admin (Clipfolio/Databox): #f1f5f9 bg, white cards, indigo #4f46e5 primary, sidebar (Overview/Aggmart/Trade Star/Transactions/Import-Export, sticky → top-tabs on phone), topbar date + shopTabs, 4 KPI cards w/ icons, 14-day IN-indiringo/OUT-rose canvas + donut (new id donut/donutLegend) + cats bars kept, shopCompare progress rows + cards kept, table pills/shop-badge/TILL-POCHI kept; all 29 required IDs + duka_txns_v1 shape + tolerant CSV + offline (zero external) preserved; copies at shop-tracker/index.html + public/shop-tracker/index.html (verified identical, JS syntax ok).
- Oct 5 cloud dashboard built (uncommitted): supabase/dashboard-schema.sql (shop_transactions + profiles, authenticated-only RLS), api/_lib/shop-ingest.js + api/mpesa/c2b/validation.js + confirmation.js + api/ingest/sms.js + api/transactions.js (GET+POST, JWT-verified, service_role), src/pages/dashboard.astro (auth-gated, KPIs, compare, 14-day canvas, CSV, manual correction), DARAJA-SETUP.md, .env.example; APIs live in api/ NOT src/pages/api because astro.config is static with no adapter (repo convention); build PASS 43 pages.
- Oct 6 SHIPPED 2e6d0ab (app refined + first commit): api/transactions.js now returns uncapped summary/totals/latestBalance/total with rows stripped of raw jsonb (limit 1000, count exact, Cache-Control no-store, method+date validated); dashboard.astro fixes — KPIs from server summary (correct past row cap), balance no longer read from the OLDEST row, fresh session token per API call, 60s auto-refresh + tab-focus refresh, load/error banner + "N of M", date inputs actually trigger a reload, Nairobi UTC+3 day buckets for chart+table, CSV quoting + formula-injection escape, aria-pressed/role=img; shop-tracker both copies noindex; DARAJA-SETUP Step 0 added; build PASS 43 pages.
- P0 (founder, blocks dashboard): PUBLIC_SUPABASE_URL + PUBLIC_SUPABASE_ANON_KEY are EMPTY in local .env and UNVERIFIED in Vercel — Vite inlines them at build, so if unset the deployed /dashboard ships only the "not configured" message. Set both in Vercel → redeploy → run supabase/dashboard-schema.sql → create the owner user.

## Executive seats (standing arrangement)

- User wants the Boss to run Orbit as the exec team: CEO=Strategy, CFO=Money, CMO=Growth. Boss merges to one voice; user makes founder calls only.
- Seat mapping: CEO → specialized/business-strategist, CFO → finance/lead, CMO → marketing/lead. Run in parallel, ≤250 words each, read-only, evidence = file paths/URLs.

## Oct 4 exec standup (CEO+CFO+CMO merged)

- P0 (all three seats): Vercel prod env keys TURNSTILE_SECRET_KEY + PUBLIC_TURNSTILE_SITE_KEY still UNVERIFIED — unset = every submit path 503s, inbound silently dead. Founder must check dashboard + send one test enquiry.
- GA live: G-FWPQVVQ668 verified firing on homepage (CMO, live check) — CEO's code-read concern reduced to: confirm whatsapp_click event in GA4 Realtime + cookie-consent gating. No traffic/conversion numbers pulled yet; first sheet = clicks → sessions → WA starts.
- Redirects: apex→www now 308 (verified live; line-47 claim about both-hosts-200 is stale), but vercel.json itself still has no redirects block AND /packages + /packages/ both 200 (trailing-slash dupes, 42 pages) — ship non-slash→slash 308s + IndexNow resubmit.
- Pricing tree verified clean Oct 4: entry 28,999 (Pricing.astro:13, packages.astro:56, Layout.astro:112, llms.txt:16, chat.ts:245), Care 4,999/7,999/9,999 (care.astro:125/138/150). Remaining 27,999 hits = legitimate Responder/Dashboard SKUs (automation.astro:46). CEO flags chat.ts:66-111 six hardcoded prices — verify what SKUs those are before calling it drift.
- Founder decision (CEO): ratify + FREEZE canonical list — 28,999 / 39,999 / Care 4,999-7,999-9,999 — else drift recurs (it has 3x).
- CFO controls to build: deal log (date/tier/quote/deposit/balance/M-Pesa ref) — no P&L data exists anywhere; weekly number = cash collected KES split deposit vs balance from M-Pesa stmt 0741992308; pre-deploy grep rejecting 27,999/33,999 on website-SKU lines. generate.mjs gate re-verified fail-closed (Turnstile :41, allowlist :57, 10/hr cap :4) but rate-limit Map resets on serverless cold start (residual).
- CMO growth call: double down on local organic — Nairobi SERP competitors quote 49,999-129,999; Orbit's published 28,999 is the only sub-30K number = the moat. GBP routine: 3 posts/week + seeded Q&A → wa.me/254741992308. davidesabwa.com mirrors Orbit layout/copy structure (competitor to watch).

## Oct 6 evening ops (CEO+CFO+CMO standup, evidence live-checked)

- SHIPPED ae5d51b: sitewide 308 non-slash→slash in vercel.json (`/:path((?!api(?:/|$))(?!_vercel/)(?!.*\..*)(?!.*\/$).+)`); build PASS 43p, live verified (pages 308, robots/llms/sitemap/_astro/api = 200 untouched), IndexNow 200. This closes the Oct-4 trailing-slash dupe item.
- P0 RESOLVED + P0 FOUND: TURNSTILE_SECRET_KEY IS set in Vercel prod (dummy-token → 403, not 503) — Oct-4 half-question closed. BUT PUBLIC_TURNSTILE_SITE_KEY missing from build (no 0x sitekey in /contact HTML or its 2 bundles) ⇒ contact form = WhatsApp-failover only (no Supabase leads rows), newsletter 100% dead (widget never renders → server 400). Founder fix = add key + redeploy + 1 test enquiry.
- Founder escalations (both seats agreed): (1) set PUBLIC_TURNSTILE_SITE_KEY; (2) M-Pesa statement access for 0741992308 — no cash-collected number can exist without it; (3) review+ship the 18-file Oct-5 payments/dashboard layer (api/mpesa/*, transactions.js, dashboard.astro) — currently uncommitted = single-disk risk.
- CEO decision tonight: deal log (date/tier/quote/deposit/balance/M-Pesa-ref) ships before any forecast; hold all forecasting until statement access lands. CMO move: publish the ready-but-unpublished WhatsApp 3-msg close + Day1/Day3 follow-ups. GA G-FWPQVVQ668 fires but ZERO metrics ever pulled — no lead/conversion/CAC number exists; don't invent one.
- Site health all green: home 200/0.6s, apex→www 308, full security headers, sitemap 39 URLs www-only, pricing consistent (28,999/39,999/49,999 + legit 27,999 SKUs).

## Oct 6 night — money dashboard shipped (closes the "18-file uncommitted" escalation)

- SHIPPED 2e6d0ab + 9682856 + e5cd690 (pushed, Vercel live): the Oct-5 payments/dashboard layer is no longer single-disk risk. api/transactions.js now returns uncapped summary/totals/latestBalance/total with raw jsonb stripped from rows (limit 1000, count exact, Cache-Control no-store, method+date validated); dashboard.astro fixed — KPIs from server summary (correct past row cap), balance read from the NEWEST row (was reading the oldest), fresh session token per API call, 60s auto-refresh + refresh-on-tab-focus, load/error banner + "N of M", date inputs actually trigger a reload, Nairobi UTC+3 day buckets for chart+table, CSV quoting + formula-injection escape, aria-pressed/role=img; shop-tracker copies noindex; DARAJA-SETUP Step 0 added.
- ROOT CAUSE of the 500s (probed live): all three _lib consumers had ONE TOO MANY ../ in their import (api/transactions.js, api/ingest/sms.js, api/mpesa/c2b/confirmation.js). stro build never sees api/ so it passed; Vercel shipped dead functions that answered 500 with an empty body. validation.js worked only because it imports nothing. Fixed + scripts/check-api-imports.mjs chained into 
pm run build (negative-tested: broken import exits 1).
- LIVE VERIFIED post-deploy: /dashboard 200 + full 224KB bundle (signInWithPassword present ⇒ PUBLIC_SUPABASE_URL/ANON_KEY ARE set in Vercel, Oct-5 "not configured" fear closed); validation/confirmation 200, sms 401, transactions 401 without token (all correct auth behavior).
- STILL UNVERIFIED (founder, no token = can't test from outside): SUPABASE_SERVICE_ROLE_KEY, INGEST_SECRET, TILL_SHOP_MAP, POCHI_SHOP_MAP in Vercel; supabase/dashboard-schema.sql run + owner user created. Until then the dashboard renders but every data call fails.
- Left untouched (parallel-session work): hermes-exec/, scenes/, flick-output-2026-10-04-*/, unified_executive_brief.md, render-log.txt, src/memory/, shop-tracker/server.log.
- Oct 6 [owner OVERRIDE] money app pulled OFF the site: src/pages/dashboard.astro + public/shop-tracker/ deleted (42 pages, both gone from dist). Kept in repo, not served: api/* ingest routes, supabase schema, DARAJA-SETUP.md, shop-tracker/ local copy. Do not re-add the public dashboard pages without asking.
- Oct 6 [owner OVERRIDE, part 2] money API pulled off the domain: api/{transactions.js,ingest/,mpesa/,_lib/} -> money-api/ (998f404), so api/ now serves ONLY chat.ts + generate.mjs + supabase/submit.ts; check-api-imports.mjs now scans api/ AND money-api/ (5 imports green, build 42p). DARAJA-SETUP.md rewritten as a status doc: nothing money-related is served from the domain, recovery = git mv money-api/* api/ + git show 1e7a6c4^:src/pages/dashboard.astro. NOT committed (parallel-session in-flight): supabase/dashboard-schema.sql strict-RLS + amount<=10M check.
