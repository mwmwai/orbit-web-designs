/**
 * Mock LLM - simulates AI responses for demo/offline mode
 * Returns realistic executive-level outputs without API calls
 */

const STRATEGY_RESPONSES = [
  {
    insight: "Market Positioning",
    finding: "Orbit occupies the sweet spot between budget freelancers (KES 15-20K) and premium agencies (KES 80K+). The mobile-first, M-Pesa-native angle is underserved.",
    recommendation: "Double down on WhatsApp + M-Pesa integration as core differentiator. Position as 'the Kenyan agency that thinks mobile-first'."
  },
  {
    insight: "Growth Lever",
    finding: "Care tiers (4,999 → 7,999 → 9,999) create natural upsell path. Starter web at 28,999 is entry point; Business at 39,999 is the profit sweet spot.",
    recommendation: "Target Business tier for new acquisitions. Use Starter as loss-leader for care upsell. Master for enterprise clients."
  },
  {
    insight: "Competitive Moat",
    finding: "Local competitors lack mobile-first focus. International competitors are too expensive for Kenyan SMBs.",
    recommendation: "Own the 'mobile-first Kenyan web design' niche. Build content around M-Pesa integration guides and WhatsApp business setup."
  }
];

const CFO_RESPONSES = [
  {
    insight: "Unit Economics",
    finding: "Starter web at 28,999 KES with 35% margin = ~10,149 KES gross per unit. Break-even at ~10 units/month with fixed costs ~100K.",
    recommendation: "Prioritize Business tier (39,999 KES) for margin. Care upsell adds ~7K average revenue per client."
  },
  {
    insight: "Revenue at Risk",
    finding: "Unauthenticated /api/generate.mjs endpoint could burn unlimited credits if Turnstile fails. Estimated exposure: High.",
    recommendation: "Enable Turnstile auth immediately. Implement rate limiting (10 req/min per IP). Restrict to approved models only."
  },
  {
    insight: "Cash Flow",
    finding: "50% M-Pesa deposit upfront = positive cash flow on delivery. 30-day balance payment creates 30-day working capital gap.",
    recommendation: "Shorten balance payment to 14 days. Maintain 2-month operating reserve (~200K KES)."
  }
];

const CMO_RESPONSES = [
  {
    insight: "Lead Gen Bottleneck",
    finding: "ContactForm.tsx fails silently when Turnstile key is unset - shows text-only error, no WhatsApp fallback. Estimated lead loss: 30-50%.",
    recommendation: "Add WhatsApp fallback button on form error. Enable Turnstile in production. Test end-to-end flow."
  },
  {
    insight: "Growth Channel",
    finding: "WhatsApp direct sales has highest conversion potential. Pochi 0741992308 link is active but pricing inconsistency causes friction.",
    recommendation: "Standardize pricing across all pages. Add WhatsApp CTA on every page. Track WhatsApp-originated deals separately."
  },
  {
    insight: "SEO Opportunity",
    finding: "Both www and non-www return 200 - splitting SEO equity. FAQ pages under-optimized for mobile-first Kenyan buyers.",
    recommendation: "Add 301 redirect non-www → www. Optimize FAQPage structured data on money pages. Target 'web design Nairobi' keywords."
  }
];

const COO_RESPONSES = [
  {
    insight: "Delivery Pipeline",
    finding: "Build pipeline timed out at 120s. Vercel deployment failing on sitemap serialization. Memory harvesting not automated.",
    recommendation: "Optimize Astro assets, use incremental builds, cache node_modules. Fix sitemap serialization in production config."
  },
  {
    insight: "Agent Coordination",
    finding: "4 exec seats running but no merge strategy. Results dumped separately with no unified brief.",
    recommendation: "Implement parallel execution with PriorityQueue merge. CEO voice leads, others support. Single output to user."
  },
  {
    insight: "Quality Control",
    finding: "No audit step before results reach user. Agent disagreements not resolved.",
    recommendation: "Add audit layer: verify each result against brief definition of done. Break ties with CEO vote."
  }
];

export class MockLLM {
  constructor() {
    this.callCount = 0;
    this.responseSets = {
      strategy: STRATEGY_RESPONSES,
      finance: CFO_RESPONSES,
      marketing: CMO_RESPONSES,
      operations: COO_RESPONSES
    };
  }

  async think(input, options = {}) {
    this.callCount++;
    
    // Determine which response set based on input content
    const lowerInput = input.toLowerCase();
    let key = 'strategy';
    if (lowerInput.includes('economics') || lowerInput.includes('revenue') || lowerInput.includes('cash')) key = 'finance';
    else if (lowerInput.includes('growth') || lowerInput.includes('lead') || lowerInput.includes('channel') || lowerInput.includes('seo')) key = 'marketing';
    else if (lowerInput.includes('delivery') || lowerInput.includes('pipeline') || lowerInput.includes('coordination') || lowerInput.includes('quality')) key = 'operations';
    
    const responses = this.responseSets[key];
    const idx = Math.min(Math.floor(this.callCount / 4), responses.length - 1);
    const response = responses[idx];
    
    // Simulate streaming delay
    await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 300));
    
    return `## ${response.insight}\n\n${response.finding}\n\n**Action:** ${response.recommendation}`;
  }

  reset() {
    this.callCount = 0;
  }
}

export default MockLLM;