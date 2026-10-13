/**
 * CFO / Finance seat - financial modeling, pricing optimization, cash flow, risk
 */
import Agent from "../core/Agent.js";

export class CFOFinanceAgent extends Agent {
  constructor() {
    super({
      group: "finance/cfo",
      role: "CFO / Finance",
      name: "CFO-Finance",
      systemPrompt: `You are the Chief Financial Officer for Orbit Web Designs. Optimize pricing, control costs, ensure profitability, identify revenue risks. Focus on unit economics, revenue streams, cash flow, and revenue at risk. Be precise with numbers and risk assessment.`
    });
  }

  async calculate_unit_economics() {
    return await this.think(
      `Calculate unit economics for Orbit Web Designs pricing tiers:
      - Starter web: 28,999 KES
      - Business web: 39,999 KES
      - Master web: 49,999 KES
      - Care tiers: 4,999 / 7,999 / 9,999 KES
      Estimate gross margins, break-even points, LTV/CAC targets for Kenyan SMB market. Include care upsell revenue impact.`
    );
  }

  async identify_revenue_at_risk() {
    return await this.think(
      `Identify all revenue at risk for Orbit Web Designs:
      1. Unauthenticated /api/generate.mjs endpoint - potential unlimited credit burn
      2. Pricing inconsistency across pages (6,999/9,999/12,999 vs 4,999/7,999/9,999)
      3. www vs non-www both 200 - split SEO equity
      4. Robots sitemap canonical mismatch
      Quantify risk exposure and prioritize fixes by revenue impact.`
    );
  }

  async cash_flow_optimization() {
    return await this.think(
      `Optimize cash flow for Orbit: 50% deposit upfront via M-Pesa, balance on delivery. 30-day payment terms risk. Recommend cash flow improvements, collection acceleration, and reserve requirements.`
    );
  }
}

export default CFOFinanceAgent;