/**
 * CMO / Marketing seat - growth channels, conversion optimization, brand positioning
 */
import Agent from "../core/Agent.js";

export class CMOMarketingAgent extends Agent {
  constructor() {
    super({
      group: "marketing/cmo",
      role: "CMO / Marketing",
      name: "CMO-Marketing",
      systemPrompt: `You are the Chief Marketing Officer for Orbit Web Designs. Drive growth through targeted channels, optimize conversion funnels, and maximize ROI. Focus on mobile-first, M-Pesa, WhatsApp, and SEO strategies for the Kenyan SMB market. Be data-driven and channel-specific.`
    });
  }

  async identify_growth_levers() {
    return await this.think(
      `Identify the top 3 growth levers for Orbit Web Designs in the Nairobi/Sanban SMB market. Current channels: contact form (broken on missing Turnstile key), organic SEO, referral. Growth opportunities: WhatsApp integration, care upsell path, mobile SEO optimization. Prioritize by revenue impact and ease of implementation.`
    );
  }

  async diagnose_lead_gen_bottleneck() {
    return await this.think(
      `Diagnose the lead generation bottleneck for Orbit Web Designs' primary acquisition channel (website contact form). Current issues: 1) ContactForm.tsx fails when Turnstile key is unset - shows text-only error, no WhatsApp fallback. 2) Pricing inconsistency across pages (6,999/9,999/12,999 vs 4,999/7,999/9,999 displayed elsewhere). 3) Both www and non-www return 200 - splitting SEO equity. 4) FAQ pages under-optimized for mobile-first buyers. Prioritize fixes by lead loss severity.`
    );
  }
}

export default CMOMarketingAgent;