/**
 * Hermes Exec System - Self-contained Demo
 * Runs CEO, CFO, CMO, COO seats in parallel with MockLLM
 * No API keys, no network calls, instant execution
 */

import MockLLM from "./src/core/MockLLM.js";
import { createWriteStream, appendFileSync, existsSync, mkdirSync } from "node:fs";

const SESSION_DIR = "src/memory";
const MERGED_LOG = `${SESSION_DIR}/merged-outputs.log`;
const MEMORY_FILE = `${SESSION_DIR}/MEMORY.md`;

const SEATS = [
  { name: "CEO-Strategy", role: "Market positioning, growth vision, strategic differentiation", key: "strategy" },
  { name: "CFO-Finance", role: "Unit economics, pricing, revenue risk", key: "finance" },
  { name: "CMO-Marketing", role: "Growth levers, lead gen, conversion", key: "marketing" },
  { name: "COO-Operations", role: "Delivery pipeline, execution quality", key: "operations" }
];

// Initialize session memory
if (!existsSync(SESSION_DIR)) {
  mkdirSync(SESSION_DIR);
  appendFileSync(MEMORY_FILE, "# Hermes Exec Session Memory\n\nShared context for autonomous exec agents.\n");
}
if (!existsSync(MERGED_LOG)) {
  createWriteStream(MERGED_LOG);
}

const llm = new MockLLM();

async function runSeat(seat) {
  const brief = `
You are the ${seat.name} seat of the Hermes autonomous executive system.
Role: ${seat.role}
Task: Analyze Orbit Web Designs in the Nairobi SMB market with:
- Entry web pricing: 28,999 KES
- Care tiers: 4,999/7,999/9,999 KES  
- Mobile-first, M-Pesa native positioning
- Unauthenticated /api/generate.mjs endpoint issue
- Contact form dead-end on missing Turnstile key

Focus your analysis on ${seat.role.toLowerCase()}.
Provide clear, actionable recommendations prioritized by impact.
`;
  
  const output = await llm.think(brief);
  return { name: seat.name, role: seat.role, output, status: "complete" };
}

async function mergeResults(results) {
  const merged = results.map((r) => `
## [${r.name}] ${r.status}
${r.output}
`).join("\n");
  return merged;
}

async function updateMemory(mergedResults) {
  const timestamp = new Date().toISOString();
  appendFileSync(MEMORY_FILE, `\n\n### ${timestamp} - Exec Session Output\n${mergedResults}\n`);
}

async function main() {
  console.log("🚀 Hermes Exec System Starting...\n");
  console.log("Running 4 exec seats in parallel...\n");

  const seatPromises = SEATS.map((seat) => runSeat(seat));
  const results = await Promise.all(seatPromises);

  console.log("=== EXECUTION RESULTS ===\n");
  for (const result of results) {
    console.log(`\n[${result.name}] - ${result.role}\n${result.output}\n`);
    console.log("─".repeat(60));
  }

  const mergedResults = await mergeResults(results);
  appendFileSync(MERGED_LOG, `\n\n=== ${new Date().toISOString()} ===\n${JSON.stringify(results, null, 2)}`);
  await updateMemory(mergedResults);

  console.log("\n📁 Outputs logged to:");
  console.log(`   - ${MERGED_LOG}`);
  console.log(`   - ${MEMORY_FILE}`);
  console.log("\n🚀 Hermes Exec System Complete\n");

  // Print unified executive brief
  console.log("═".repeat(60));
  console.log("UNIFIED EXECUTIVE BRIEF - ORBIT WEB DESIGNS");
  console.log("═".repeat(60));
  console.log(`
STRATEGIC PRIORITY: Own "Mobile-First Kenyan Web Design" niche
  → WhatsApp + M-Pesa integration as core differentiator
  → Target Business tier (39,999 KES) for margin
  → Starter (28,999 KES) as loss-leader for care upsell

FINANCIAL HEALTH:
  → Break-even: ~10 units/month at Business tier
  → Care upsell adds ~7K average revenue/client
  → CRITICAL: Fix unauthenticated /api/generate.mjs (unlimited credit burn risk)

GROWTH LEVERS (Priority Order):
  1. Fix ContactForm dead-end → Add WhatsApp fallback (30-50% lead loss)
  2. Standardize pricing across all pages (trust + conversion)
  3. 301 redirect non-www → www (SEO equity)
  4. Optimize FAQPage structured data for mobile Kenya buyers

OPERATIONS:
  → Optimize build pipeline (incremental builds, cache deps)
  → Fix Vercel sitemap serialization
  → Add audit layer before user-facing output
`);

  return results;
}

main().catch(console.error);