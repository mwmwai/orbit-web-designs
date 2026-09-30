---
description: Usage guide for the 233 installed subagents — documentation only, do not invoke
mode: subagent
hidden: true
---

# OpenCode Subagents — Usage Guide

217 specialized agents live in this folder, organized in 16 group subfolders (`engineering/`, `marketing/`, `research/`, ...), plus one **Lead** per group (the strongest agent in the group — it assigns work to its members, e.g. `engineering/lead`). Each agent's ID is its **folder path** (drop the `.md`, e.g. `engineering/code-reviewer`). Full list with descriptions: [../INVENTORY.md](../INVENTORY.md).

Want one throat to choke? Use **`@boss`** — the command agent. It recruits the right specialists, runs them in parallel, and reports back with a debrief.

## Three ways to use them

1. **`@`-mention (manual, explicit)** — type `@` in the prompt and pick the agent. They sit in group folders — type the group plus `/` to filter (`@engineering/`, `@marketing/`, ...):
   ```
   @boss refactor the hero section of src/pages/index.astro
   @engineering/code-reviewer review the last commit for bugs and a11y issues
   @marketing/seo-specialist audit orbitwebdesigns.co.ke for technical SEO problems
   @testing/accessibility-auditor check the contact form against WCAG 2.2 AA
   ```
2. **Ask naturally (auto-dispatch)** — just describe the job; the primary agent matches it to an agent's `description` and runs it via the task tool: *"have the performance benchmarker measure the homepage LCP"*.
3. **Tab** cycles the **primary** agents: Build, Plan, and **Boss**. The other 233 are `mode: subagent`, so they're reached via `@` or by dispatch, never by Tab.

Check what's loaded any time: `opencode agent list`.

## Which agent for which job

| Job | Agent |
| --- | --- |
| Command the whole roster, multi-step jobs | `boss` |
| Whole-group job (Lead picks the crew) | `<group>/lead`, e.g. `engineering/lead` |
| Build UI / front-end code | `engineering/frontend-developer` |
| APIs, services, cloud infra | `engineering/backend-architect` |
| System design, DDD, trade-offs | `engineering/software-architect` |
| Hands-on implementation (CSS, Three.js) | `engineering/senior-developer` |
| Review a diff or PR | `engineering/code-reviewer` |
| CI/CD and infra automation | `engineering/devops-automator` |
| Docs, READMEs, API references | `engineering/technical-writer` |
| Fast MVP / proof of concept | `engineering/rapid-prototyper` |
| Visual design, design systems | `design/ui-designer` |
| Implementable UX & CSS architecture | `design/ux-architect` |
| User research, usability testing | `design/ux-researcher` |
| Brand consistency check | `design/brand-guardian` |
| WCAG / accessibility audit | `testing/accessibility-auditor` |
| API validation & test coverage | `testing/api-tester` |
| Load/perf measurement | `testing/performance-benchmarker` |
| Authorized security testing | `security/penetration-tester` |
| Technical SEO audit | `marketing/seo-specialist` |
| Editorial calendars & copy | `marketing/content-creator` |
| Cross-platform social campaigns | `marketing/social-media-strategist` |
| Lifecycle email & CRM flows | `marketing/email-marketing/strategist` |
| Acquisition experiments | `marketing/growth-hacker` |
| Roadmap & product strategy | `product/manager` |
| Sprint planning & prioritization | `product/sprint-prioritizer` |
| Spec → task breakdown | `project/senior-project/manager` |
| Evidence-based reality check on work | `testing/reality-checker` |
| Deep multi-source investigation | `research/deep-researcher` |
| Verify a claim with graded verdict | `research/fact-checker` |

Everything else (game dev, spatial computing, finance, sales, paid media, China-market channels, etc.) is in [../INVENTORY.md](../INVENTORY.md).

## Adding or removing agents

- **Project-only:** drop a `.md` file in `.opencode/agents/` (this folder).
- **Global (all projects):** drop it in `~/.config/opencode/agents/`.
- **Keep the grouping:** new agents go in a group subfolder as `<group>/<slug>.md`, with the `name:` frontmatter set to `<Group> · <Name>` in the group's color (see INVENTORY.md for the 16 groups and their colors).
- To remove: delete the file. Disable without deleting: add `disable: true` to its frontmatter.
- **Restart OpenCode after adding or removing** — agent config is not hot-reloaded; new files won't appear until a fresh session.

Note: `boss.md` is `mode: all` (a primary agent, Tab-reachable) and `.opencode/opencode.json` sets `subagent_depth: 2` so the Boss can launch subagents even when it's invoked as a subagent itself. Don't lower that value or the Boss loses its crew.

Each file needs frontmatter with at least `description:` (required) and `mode: subagent`:

```markdown
---
description: Reviews code for bugs and accessibility issues
mode: subagent
---
You are a code reviewer...
```

## Maintenance

The **source of truth is the Agency Agents corpus**, not these files:
`C:\Users\mwmwa\AppData\Local\Agency Agents\resources\corpus-baseline\` (15 category folders, 209 agents).

After editing agents there, regenerate with:

```
scripts/convert.sh --tool opencode
```

then copy the output from `integrations/opencode/agents/` into `.opencode/agents/`. Afterwards, re-apply the local layers that regen wipes: regroup into folders + group names (see `regroup.ps1` flow), then run `.opencode/memory/reapply-memory-protocol.ps1` to restore the shared-memory block on all agents. Never hand-edit files in this folder without re-running those steps — they'll be overwritten on the next conversion.
