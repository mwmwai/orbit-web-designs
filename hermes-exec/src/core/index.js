/**
 * Hermes - Autonomous Executive Agent System
 * CEO, CFO, CMO, COO seats running in parallel with shared memory
 */
import CEOStrategyAgent from "../agents/ceo/strategy.js";
import CFOFinanceAgent from "../agents/cfo/finance.js";
import CMOMarketingAgent from "../agents/cmo/marketing.js";
import COOOperationsAgent from "../agents/coo/operations.js";
import { createWriteStream, appendFileSync, existsSync, mkdirSync } from "node:fs";

const SESSION_DIR = "src/memory";
const MERGED_LOG = `${SESSION_DIR}/merged-outputs.log`;
const MEMORY_FILE = `${SESSION_DIR}/MEMORY.md`;

const SEATS = [
  { name: "CEO-Strategy", agent: CEOStrategyAgent, analysis: "analyze_market_positioning", role: "Market positioning, growth vision, strategic differentiation" },
  { name: "CFO-Finance", agent: CFOFinanceAgent, analysis: "calculate_unit_economics", role: "Unit economics, pricing, revenue risk" },
  { name: "CMO-Marketing", agent: CMOMarketingAgent, analysis: "identify_growth_levers", role: "Growth levers, lead gen, conversion" },
  { name: "COO-Operations", agent: COOOperationsAgent, analysis: "audit_delivery_quality", role: "Delivery pipeline, execution quality" }
];

// Initialize session memory
if (!existsSync(SESSION_DIR)) {
  mkdirSync(SESSION_DIR);
  appendFileSync(MEMORY_FILE, "# Hermes Exec Session Memory\n\nShared context for autonomous exec agents.\n");
}
if (!existsSync(MERGED_LOG)) {
  createWriteStream(MERGED_LOG);
}

// Inject shared memory into each agent's brief
function buildBrief(seat) {
  const memoryContext = existsSync(MEMORY_FILE)
    ? `Current system memory:\n${require("fs").readFileSync(MEMORY_FILE, "utf8")}\n\n`
    : "";
  return `
You are the ${seat.name} seat of the Hermes autonomous executive system.
Role: ${seat.role}
Task: Run your core analysis function (${seat.analysis}) now for Orbit Web Designs.
Context: Nairobi/Sanban SMB market, mobile-first, M-Pesa native, care tiers at 4999/7999/9999 KES, entry web at 28999 KES.
Constraint: Be decisive and action-oriented. Output clear recommendations.
Definition of done: Complete analysis with 3-5 prioritized recommendations.
${memoryContext}
Run your analysis now.
`;
}

async function runSeat(seat) {
  try {
    const agent = new seat.agent();
    const brief = buildBrief(seat);
    const result = await agent.think(brief, {
      temperature: 0.3,
      max_tokens: 800
    });
    return {
      name: seat.name,
      role: seat.role,
      output: result,
      status: "complete",
      snapshot: agent.snapshot()
    };
  } catch (error) {
    return { name: seat.name, status: "failed", error: error.message };
  }
}

async function mergeResults(results) {
  const merged = results.map((r) => `
## [${r.name}] ${r.status}
${r.output || "FAILED: " + r.error}
`).join("\n");
  return merged;
}

async function updateMemory(mergedResults) {
  const timestamp = new Date().toISOString();
  appendFileSync(MEMORY_FILE, `\n\n### ${timestamp} - Exec Session Output\n${mergedResults}\n`);
}

async function main() {
  console.log("🚀 Hermes Exec System Starting...\n");

  const seatPromises = SEATS.map((seat) => runSeat(seat));
  const results = await Promise.all(seatPromises);

  console.log("\n=== EXECUTION RESULTS ===\n");
  for (const result of results) {
    if (result.status === "complete") {
      console.log(`\n[${result.name}] - ${result.role}\n${result.output}\n`);
    } else {
      console.log(`\n[${result.name}] FAILED: ${result.error}\n`);
    }
  }

  const mergedResults = await mergeResults(results);

  appendFileSync(MERGED_LOG, `\n\n=== ${new Date().toISOString()} ===\n${JSON.stringify(results, null, 2)}`);
  await updateMemory(mergedResults);

  console.log("\n📁 Outputs logged to:");
  console.log(`   - ${MERGED_LOG}`);
  console.log(`   - ${MEMORY_FILE}`);
  console.log("\n🚀 Hermes Exec System Complete\n");

  return results;
}

if (import.meta.url.endsWith(process.argv[1])) {
  main().catch(console.error);
}

export { SEATS, runSeat, mergeResults, MERGED_LOG, MEMORY_FILE };
