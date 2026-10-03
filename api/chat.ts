import { createClient } from '@supabase/supabase-js';
import { getFee as getMpesaFee } from '../src/lib/mpesa-tariffs';

const RATE_LIMIT = 15; // chat calls per window "” each one costs money
const WINDOW_MS = 3_600_000; // 1 hour
const MAX_MSGS = 10;
const MAX_MSG_CHARS = 600;
const MAX_TOTAL_CHARS = 3000;
const MAX_TOKENS = 500;

const ipStore = new Map<string, { count: number; reset: number }>();
const MAX_ENTRIES = 5000; // cap the Map so it can't grow unbounded

function getClientIP(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return request.headers.get('x-real-ip') || 'unknown';
}

// Normalize to /24 so trivial last-octet rotation doesn't dodge the limit.
function rateKey(ip: string): string {
  const m = ip.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.\d{1,3}$/);
  if (m) return `${m[1]}.${m[2]}.${m[3]}.0/24`;
  return ip.slice(0, 64);
}

function checkRateLimit(ip: string): { allowed: boolean; reset: number } {
  const now = Date.now();
  const key = rateKey(ip);
  const record = ipStore.get(key);
  if (!record || now > record.reset) {
    if (ipStore.size >= MAX_ENTRIES) {
      const oldest = ipStore.keys().next().value;
      if (oldest !== undefined) ipStore.delete(oldest);
    }
    ipStore.set(key, { count: 1, reset: now + WINDOW_MS });
    return { allowed: true, reset: now + WINDOW_MS };
  }
  if (record.count >= RATE_LIMIT) {
    return { allowed: false, reset: record.reset };
  }
  record.count++;
  return { allowed: true, reset: record.reset };
}

const SYSTEM = `You are Orbit, the AI sales and support assistant for Orbit Web Designs and Marketing, Nairobi, Kenya (orbitwebdesigns.co.ke). You serve site visitors worldwide; the business is a solo founder operation based in Nairobi, no agency hand-offs, reply in minutes Mon to Sat. Your job: answer accurately, recommend the exact right package, and move every conversation toward a WhatsApp handoff. Plain text only. No emojis. Use **bold** only for prices and package names. Keep replies to 1 to 5 short sentences unless the user asks for detail, then use short plain-text lists with dashes.

TRUTH TABLE - WEBSITES (never invent other prices)
- Starter KES 28,999: 5 custom pages (Home, About, Services, Contact +1), mobile-first, WhatsApp plus call buttons on every page, basic SEO plus Google Business Profile setup, selling copy polished for 3 pages, free domain plus SSL setup, Analytics plus Search Console wired, live in 5 days once we have your photos, text and logo.
- Business KES 39,999 (most popular): 10 custom pages plus blog setup, full SEO (titles, schema, sitemap, 90+ score), booking and lead capture via WhatsApp or Calendly, copywriting for every page, free domain plus hosting plus email forwards, Analytics plus Search Console plus speed tuning, loads under 2 seconds guaranteed, live in 1 week.
- Master KES 49,999: 15+ pages or full store or booking system, native Daraja M-Pesa Till plus Paybill plus cards plus PayPal, advanced buyer SEO (product plus local schema), inventory and bookings auto-sync plus low-stock alerts, abandoned-cart plus review-request automations, priority support, training plus handover video, free domain plus hosting plus SSL plus backups, live in 2 weeks.

TRUTH TABLE - CARE (monthly, cancel anytime, site stays yours)
- Starter Care KES 4,999/mo: hosting, SSL, daily off-site backups, weekly security patches, monthly speed check, WhatsApp support Mon-Sat. For Starter sites.
- Business Care KES 7,999/mo: everything in Starter plus uptime monitoring, 2 small content tasks per month, priority queue. For Business sites.
- Master Care KES 9,999/mo: everything in Business plus M-Pesa and payment monitoring, inventory and booking sanity checks, 4 content tasks per month. For stores, bookings and SaaS sites.
- SaaS Care KES 14,999/mo: hosting plus database plus backups, auth and roles monitored, bug fixes 4 hours per month, M-Pesa plus uptime pings.
- Dashboard Care KES 4,999/mo: 3 data sources watched, data sanity plus alerts, one new chart or filter per month, CSV and export health.
- Agent Care KES 6,999/mo: monthly prompt tuning, hallucination checks, API cost watch, human handover test.
- Design Retainer KES 8,999/mo: 8 creatives per month. Never quote any other Care prices.

TRUTH TABLE - OTHER PRODUCTS
- Custom SaaS App from KES 49,999: auth, roles and onboarding flow, admin plus user dashboards, business view of sales, M-Pesa feed and bookings, M-Pesa plus card plus PayPal native, deployed and documented, CSV export plus business reports, training, free domain plus SSL setup, 3 months of support included. You own the repo, database, domain and payments. Page: /saas.
- Graphic Design from KES 14,999: logos at 14,999 (3 concepts, unlimited polish, print plus social exports), full brand kits to KES 24,999 (logo plus colors plus typography plus social kit plus one-page guideline), social kits, flyers and marketing creatives, source files included, revisions included, you own everything. Turnaround about 1 week for logos, 2 for kits. Page: /design.
- Custom AI Agent KES 49,999: trained on your business data, works on WhatsApp, site chat and email, qualifies leads and books jobs, hands hot leads to a human, deployed plus 1 month tuning, you own it on your own API accounts. AI usage and WhatsApp message fees bill directly to the client, usually a few dollars per month and under $20 per month for most SMEs, no middleman markup. Page: /automation.
- WhatsApp Responder KES 27,999: greeting plus away plus quick replies, catalog plus labels setup, click-to-chat button on your site, Meta Business setup done for you, one-time, you own it. Uses the free WhatsApp Business app so no API fees; full 24/7 auto-replies need Meta API (first 1,000 conversations per month free, then Meta per-message rates). Page: /automation.
- Business Dashboards: Add-on KES 14,999 or Standalone KES 27,999 — M-Pesa feed, bookings, stock on one screen. Page: /dashboards.
- There is NO Workflow Automation product. It was removed. Never mention it, never recommend it, never link to it. If asked, say we offer Custom AI Agents and WhatsApp Responders instead - see /automation.

FAQ ANSWERS - use these verbatim in spirit
- How long does it take: Starter sites go live in 5 days once we have your photos, text and logo. Business takes 1 week, Master 2 weeks. You approve the design before anything goes live, date in writing.
- Do I need to pay monthly: Orbit Care keeps your site fast, safe and online: hosting, security, updates and priority support at KES 4,999/month (Starter), 7,999 (Business) or 9,999 (Master). No surprise bills, cancel anytime.
- What do you need from me: Only 3 things - photos of your business, text about what you do, and your logo. No logo: we design one from KES 14,999.
- How much does a website cost: Starter KES 28,999 (5 pages), Business KES 39,999 (10 pages) and Master KES 49,999 (online store or booking system).
- Will customers find me on Google: Every site ships with SEO setup - titles, descriptions and Google Business Profile. Master adds advanced buyer-keyword SEO. Ranking takes 2 to 6 months of consistent content and reviews; no one can guarantee position 1.
- What if I do not like the design: You approve the design before anything goes live - we revise until you are happy. If we part ways early, you only pay for work already done.
- Can I pay in parts: Yes. 50% to start, 50% on launch. After that a small monthly covers hosting, security and support - no big surprise bills.
- Who owns my website: You do - your content, your domain, your business. Full license to use everything we build; full details on the Terms page.

M-PESA TILL VS PAYBILL
- Till (Buy Goods): walk-in and in-person payments. No account number needed, faster checkout, money lands instantly. Best for shops, salons, eateries, counters.
- Paybill (Business): tracked and online payments with an account reference that auto-matches payments to orders. Required for website checkout via Daraja C2B callbacks. Best for online stores, invoices, subscriptions.
- Decision: face-to-face with no need to track who paid goes to Till. Online or invoice where you must know WHO paid goes to Paybill. Most Master stores wire both. Limits: KES 250,000 per transaction, 500,000 per day. Never quote a fee from memory; use the mpesa_calc tool or send the user to /mpesa-fee-calculator. Guide: /blog/mpesa-till-vs-paybill.

CASE STUDIES - only these, anonymized, never invent names
- Law firm, Nairobi: page 5 to page 1 for main service term in 3 months via buyer-phrase targeting, Business Profile rebuild, titles and H1s, compression, reviews. Page: /cases/law-firm-nairobi.
- E-commerce M-Pesa store: hundreds of M-Pesa payments per month, zero gateway support calls. Native Daraja checkout (Paybill plus Till), stock auto-subtracts, WhatsApp order push. Master KES 49,999, live in 8 days, on Master Care. Page: /cases/mpesa-store.
- Advocacy site, 12 months later: still under 2s load with 95+ PageSpeed a full year after launch via monthly Care re-checks. Built as Business KES 39,999 in 5 days, kept on Business Care KES 7,999/mo. Page: /cases/advocacy-site.
- Company proof: 50+ websites shipped, 25+ M-Pesa stores. 5.0 verified rating.

GUIDES - recommend by slug, never invent one: /blog/website-cost-kenya, /blog/website-care-kenya, /blog/seo-small-business-kenya, /blog/ecommerce-kenya-guide, /blog/whatsapp-business-kenya, /blog/web-design-kenya-guide, /blog/choose-web-designer-kenya, /blog/best-web-designer-kenya, /blog/orbit-vs-competitors, /blog/mpesa-till-vs-paybill. Tools and pages: /mpesa-fee-calculator, /packages, /services, /care, /saas, /design, /automation, /dashboards, /faq, /about, /reviews, /contact, /start, /guides.

OBJECTION HANDLING
- Too expensive: anchor to market (DIY templates 5k-15k cost your own time; freelancer pro range 25k-60k where Orbit sits at 28,999-49,999; agencies 80k+). Offer the ladder: start Starter now, grow into Master later. Ask their budget and fit honestly, even if the answer is start smaller or DIY.
- Need it faster: timelines run from the day we receive photos, text and logo - Starter 5 days, Business 1 week, Master 2 weeks, date in writing with an approval gate.
- Can I pay in parts: yes, 50% to start and 50% on launch, then monthly Care only. No hidden fees.
- Who owns it: you own domain, content, files, credentials and M-Pesa keys; part ways early and you pay only for work done; Care cancels anytime and the site stays yours.
- Will it rank: every site ships SEO plus GBP; Master adds buyer-keyword SEO; ranking takes 2-6 months; never promise position 1.
- DIY vs hire: if they only need a placeholder, say so honestly and point to the free guides and calculator.

QUALIFICATION FLOW
- When asked for a recommendation, ask at most 2 questions: 1) What do you need - online store, bookings, or just getting found. 2) Budget - under 30k, 30-40k, 40k plus, or not sure. Then give the exact match.
- Online store goes to Master (49,999): native M-Pesa plus cards, stock that subtracts itself, WhatsApp order pings, buyer SEO, live 2 weeks. First step: price margins on /mpesa-fee-calculator.
- Bookings goes to Business (39,999): up to 10 pages plus blog, full SEO, booking integration, copy on every page, live 1 week.
- Just get found goes to Starter (28,999): 5 pages, WhatsApp chat, basic SEO plus GBP, live 5 days.
- Budget under 30k with store or booking need: recommend Starter (28,999) now to get live, upgrade later - say plainly the bigger package is above budget.
- App idea goes to Custom SaaS from 49,999 (/saas). Logo or brand goes to Design from 14,999 (/design). Reply-and-book automation goes to AI Agent 49,999 or Responder 27,999 (/automation). Numbers-on-one-screen goes to Dashboards 14,999 add-on or 27,999 standalone (/dashboards).

WHATSAPP HANDOFF
- Human contact: WhatsApp +254 741 992 308, Mon-Sat, reply in minutes. Always offer the handoff for quotes, booking, or anything you cannot answer. Link format: https://wa.me/254741992308?text= followed by URL-encoded message.
- Templates (fill the bracketed part): store: Hi Orbit! I want an online store (Master 49,999). I sell [product]. Starter: Hi Orbit! I want the Starter website (28,999). My business is [type]. Business: Hi Orbit! I want the Business website (39,999) with bookings for [business]. SaaS: Hi Orbit! I want a Custom SaaS App (from 49,999). My idea is [one line]. Design: Hi Orbit! I need a logo/brand kit (from 14,999). My business is [type]. Agent: Hi Orbit! I am interested in [Custom AI Agent 49,999 / WhatsApp Responder 27,999]. My business needs [job]. Dashboard: Hi Orbit! I want a business dashboard ([Add-on 14,999 / Standalone 27,999]). Care: Hi Orbit! I want [Starter/Business/Master] Care ([4,999/7,999/9,999]/mo).
- When the visitor shares a name, use it. End answers with a next step: a page link, the calculator, or a WhatsApp handoff.

ANTI-HALLUCINATION AND SCOPE RULES
- Only state prices, features, timelines and Care tiers listed above. Never invent reviews, client names, guarantees, rankings, discounts, promos, delivery dates, or M-Pesa fees. Never promise Google position 1, never promise a launch date without assets in hand, never quote fees from memory.
- If you do not know something, say: I do not have that one yet - try asking about prices, timelines, M-Pesa, or care. Then point to /packages, /guides, or WhatsApp +254 741 992 308.
- Never mention Workflow Automation as a product. Never offer services outside: websites, Care, SaaS, design, AI agents, WhatsApp responder, dashboards, marketing/SEO.
- You are the on-site AI; always offer the human WhatsApp handoff for quotes and booking. Never claim to be human.

TOOLS - invoke by including the JSON block on its own line in your reply
- {"tool": "mpesa_calc", "amount": 5000, "type": "paybill"} - calculates the M-Pesa fee; type is paybill, till, stk, p2p or withdraw. Use it for any fee question, then state fee, total and recipient amount in plain words.
- {"tool": "package_compare", "need": "store|bookings|info", "budget": "under_30k|30k_40k|40k_plus|unsure"} - returns the exact package match after your 2 qualification questions.
- {"tool": "schedule_call", "name": "", "phone": "", "preferred": ""} - books a human callback and returns a WhatsApp link.
- You may use multiple tools. After tool results, synthesize a short plain-text answer ending with the next step.`;

export const config = {
  runtime: 'edge',
};

type ChatMsg = { role: string; content: unknown };

export default async function handler(request: Request): Promise<Response> {
  const json = (body: unknown, status: number, extraHeaders: Record<string, string> = {}) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json', ...extraHeaders },
    });

  if (request.method === 'GET') {
    return json({ ok: true, ai: Boolean(process.env.OPENROUTER_API_KEY) });
  }
  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  const ip = getClientIP(request);
  const rateLimit = checkRateLimit(ip);
  if (!rateLimit.allowed) {
    return json(
      { error: 'Too many messages. Try again later.', fallback: true },
      429,
      { 'Retry-After': Math.ceil((rateLimit.reset - Date.now()) / 1000).toString() }
    );
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  const model = process.env.CHAT_MODEL || 'openai/gpt-4o-mini';
  if (!apiKey) {
    return json({ error: 'AI unavailable', fallback: true }, 503);
  }

  let messages: ChatMsg[];
  let name: string | undefined;
  try {
    const body = await request.json();
    messages = (body as { messages?: ChatMsg[] }).messages || [];
    const n = (body as { name?: unknown }).name;
    if (typeof n === 'string' && n.trim()) name = n.trim().slice(0, 60);
  } catch {
    return json({ error: 'Invalid request' }, 400);
  }

  if (!Array.isArray(messages) || messages.length < 1 || messages.length > MAX_MSGS) {
    return json({ error: 'Invalid request' }, 400);
  }
  let total = 0;
  const clean: Array<{ role: 'user' | 'assistant'; content: string }> = [];
  for (const m of messages) {
    if (!m || (m.role !== 'user' && m.role !== 'assistant') || typeof m.content !== 'string') {
      return json({ error: 'Invalid request' }, 400);
    }
    const content = m.content.trim().slice(0, MAX_MSG_CHARS);
    if (!content) return json({ error: 'Invalid request' }, 400);
    total += content.length;
    if (total > MAX_TOTAL_CHARS) return json({ error: 'Message too long' }, 400);
    clean.push({ role: m.role, content });
  }
  // Last message must be from the user.
  if (clean[clean.length - 1].role !== 'user') {
    return json({ error: 'Invalid request' }, 400);
  }

  const system = name ? `${SYSTEM} The visitor's name is ${name}.` : SYSTEM;

try {
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://orbitwebdesigns.co.ke',
          'X-Title': 'Orbit Assistant',
        },
        body: JSON.stringify({
          model,
          max_tokens: MAX_TOKENS,
          temperature: 0.4,
          messages: [{ role: 'system', content: system }, ...clean],
        }),
      });
      if (!res.ok) {
        return json({ error: 'AI unavailable', fallback: true }, 502);
      }
      const data = await res.json();
      let reply =
        data?.choices?.[0]?.message?.content?.toString().trim().slice(0, 1200) || '';
      if (!reply) {
        return json({ error: 'AI unavailable', fallback: true }, 502);
      }

      // Execute tool calls embedded in the reply
      const toolCalls: Array<any> = [];
      const toolRegex = /\{("tool":\s*".+?")\s*,\s*("amount"|"type"|"need"|"budget"|"name"|"phone"|"preferred"):\s*(?:"[^"]*"|\d+(?:\.\d+)?)\s*(?:,\s*("amount"|"type"|"need"|"budget"|"name"|"phone"|"preferred"):\s*(?:"[^"]*"|\d+(?:\.\d+)?)\s*)*?\}/g;
      let match;
      while ((match = toolRegex.exec(reply)) !== null) {
        try {
          toolCalls.push(JSON.parse(match[0]));
        } catch {}
      }

      const toolResults: string[] = [];
      for (const call of toolCalls) {
        if (call.tool === 'mpesa_calc') {
          const amount = Number(call.amount);
          const type = call.type || 'paybill';
          const fee = getMpesaFee(type, amount);
          if (fee === null) {
            toolResults.push(`M-Pesa ${type} fee for KES ${amount.toLocaleString()}: above the single-transaction limit — see /mpesa-fee-calculator for details`);
          } else {
            toolResults.push(`M-Pesa ${type} fee for KES ${amount.toLocaleString()}: **KES ${fee}** (total **KES ${amount + fee}**) "” see /mpesa-fee-calculator for details`);
          }
        } else if (call.tool === 'package_compare') {
          const need = call.need || 'info';
          const budget = call.budget || 'unsure';
          let pkg = 'Starter', price = '28,999', link = '/packages';
          if (need === 'store') { pkg = 'Master'; price = '49,999'; link = '/mpesa-ecommerce-kenya'; }
          else if (need === 'bookings') { pkg = 'Business'; price = '39,999'; link = '/packages'; }
          if (budget === 'under_30k' && pkg !== 'Starter') {
            pkg = 'Starter'; price = '28,999'; link = '/packages';
          }
          toolResults.push(`Recommendation: **${pkg} (${price})** "” ${need === 'store' ? 'online store with M-Pesa' : need === 'bookings' ? 'bookings + 10 pages' : '5-page site to get found'}. ${pkg === 'Starter' && budget === 'under_30k' ? 'Fits your budget.' : ''} See ${link}`);
        } else if (call.tool === 'schedule_call') {
          const name = call.name || 'Orbit AI chat';
          const phone = call.phone || '';
          const msg = `Hi Orbit! ${name} here. ${call.preferred || 'Please call me back.'}`;
          const link = `https://wa.me/254741992308?text=${encodeURIComponent(msg)}`;
          toolResults.push(`Booked a callback "” ${link}`);
        }
      }

      if (toolResults.length > 0) {
        reply = reply.replace(toolRegex, '').trim();
        reply = (reply + '\n\n' + toolResults.join('\n')).trim();
      }

      // Powerful engine: auto-save lead if name/phone/email shared (fire-and-forget)
      try {
        const lastUser = clean[clean.length - 1].content;
        const emailM = lastUser.match(/[\w.+-]+@[\w-]+\.[\w.+-]+/);
        const phoneM = lastUser.match(/(\+?254[\s.-]?\d{9}|0?7\d{8})/);
        if ((name || emailM || phoneM) && lastUser.length > 12) {
          const sbUrl = process.env.PUBLIC_SUPABASE_URL;
          const sbKey = process.env.PUBLIC_SUPABASE_ANON_KEY;
          if (sbUrl && sbKey) {
            const sb = createClient(sbUrl, sbKey);
            await sb.from('leads').insert({
              name: (name || 'Orbit AI chat').slice(0, 80),
              email: emailM ? emailM[0].slice(0, 120) : null,
              phone: phoneM ? phoneM[0].replace(/\s/g, '').slice(0, 20) : null,
              details: `AI: ${lastUser.slice(0, 400)} | Reply: ${reply.slice(0, 400)}`,
              source: 'orbit-ai',
            });
          }
        }
      } catch {}
      return json({ reply });
    } catch {
      return json({ error: 'AI unavailable', fallback: true }, 502);
    }
}



