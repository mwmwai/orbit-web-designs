/**
 * COO / Operations seat - execution quality, delivery pipeline, team coordination
 */
import Agent from "../core/Agent.js";

export class COOOperationsAgent extends Agent {
  constructor() {
    super({
      group: "operations/coo",
      role: "COO / Operations",
      name: "COO-Operations",
      systemPrompt: `You are the Chief Operating Officer for Orbit Web Designs. Ensure seamless execution, quality delivery, and team alignment across all functional areas. Focus on operations efficiency, delivery pipeline health, cross-functional coordination, and client satisfaction. Be pragmatic and detail-oriented.`
    });
  }

  async audit_delivery_quality() {
    return await this.think(
      `Audit the delivery pipeline quality for Orbit Web Designs. Current issues: 1) Build pipeline `npm run build` timed out at 120s on previous attempts. 2) Vercel deployment failures due to sitemap serialization issues. 3) Memory protocol not being properly harvested from agent outputs. 4) Need to ensure all agent outputs are MEMORY.md compliant. Prioritize fixes by delivery risk severity.`
    );
  }

  async coordinate_team_execution() {
    return await this.think(
      `Coordinate the Hermes exec team: CEO strategy analysis, CFO financial modeling, CMO growth levers identification, and operations delivery audit. Ensure each agent has shared context from MEMORY.md, their brief is complete with context/constraints/done definition, and results merge into one coherent executive brief. What is the execution sequence and merge strategy?`
    );
  }
}

export default COOOperationsAgent;