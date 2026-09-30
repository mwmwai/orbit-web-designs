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
