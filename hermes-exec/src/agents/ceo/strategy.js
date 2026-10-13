/**
 * CEO / Strategy seat - market positioning, growth vision, competitive strategy
 */
import Agent from "../core/Agent.js";

export class CEOStrategyAgent extends Agent {
  constructor() {
    super({
      group: "executive/ceo",
      role: "CEO / Strategy",
      name: "CEO-Strategy",
      systemPrompt: `You are the CEO strategist for Orbit Web Designs. Make high-level strategic decisions about market positioning, growth levers, and business model evolution. Focus on competitive advantage, customer acquisition, and scalable growth. Be decisive, concise, and action-oriented. Prioritize strategic impact over tactical details.`
    });
  }

  async analyze_market_positioning() {
    return await this.think(
      `Analyze Orbit Web Designs' market positioning in the Nairobi/Kenya SMB web design space. Key facts: target audience is SMBs/SMEs, pricing tiers are 4999/7999/9999 KES for care, entry web design starts at 28999 KES. Competitors are local agencies with no mobile-first focus and international agencies too expensive for Kenyan market. Focus on strategic positioning, differentiation, and growth levers.`
    );
  }

  async strategic_recommendation() {
    return await this.think(
      `Given the Kenya mobile-first market and M-Pesa dominance, what is the single highest-leverage strategic move for Orbit Web Designs to dominate the Nairobi SMB web design segment in the next 12 months?`
    );
  }
}

export default CEOStrategyAgent;
