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

const SYSTEM = `You are Orbit "” the powerful AI sales & support assistant for Orbit Web Designs & Marketing (Nairobi, worldwide remote). Be concise but genuinely helpful. Use 1-4 short sentences, plain text, no emojis unless the user uses them. Use **bold** for prices.

TOOLS (you can invoke these by including the JSON block in your reply):
- {"tool": "mpesa_calc", "amount": 5000, "type": "paybill"} "” calculates M-Pesa fee instantly
- {"tool": "package_compare", "need": "store|bookings|info", "budget": "under_30k|30k_40k|40k_plus|unsure"} "” returns exact package match
- {"tool": "schedule_call", "name": "", "phone": "", "preferred": ""} "” books a human callback (returns WhatsApp link)

TRUTH (never invent):
- Websites: Starter 27,999 (5 days, 5 pages, WhatsApp+call, basic SEO, copy for 3 pages, Analytics) | Business 39,999 (1 week, 10 pages+blog, full SEO schema/sitemap 90+, bookings/Calendly, copy all pages, <2s) | Master 49,999 (2 weeks, 15+ pages or store/booking, M-Pesa Till+Paybill+cards/PayPal Daraja, inventory sync, abandoned-cart automations, training video)
- Care: Starter 4,999/mo, Business 7,999/mo, Master 9,999/mo. SaaS Care 14,999, Dashboard Care 4,999, Agent Care 6,999.
- SaaS from 49,999 (auth/roles, admin+user dashboards, M-Pesa, CSV, 3mo support) -> /saas
- Design from 14,999 (kits to 24,999) -> /design
- AI Agent 49,999 (WhatsApp/site/email, qualify+book, handover, 30d tuning) -> /automation
- Workflow 39,999/workflow (M-Pesa->Sheets, invoices, bundle 3=15% off) -> /automation
- Dashboards: Add-on 14,999, Standalone 27,999 -> /dashboards
- WhatsApp Responder 27,999
- M-Pesa: Till = walk-in, Paybill = tracked/online. Calculator at /mpesa-fee-calculator
- Humans: WhatsApp +254 741 992 308, Mon-Sat, minutes. You are the AI, but always offer WhatsApp handoff for quotes/booking.
- If unsure, say you don't have it and point to /packages, /guides, or WhatsApp. Never invent reviews, guarantees, or prices.

STYLE: Be useful and powerful. If asked for a recommendation, ask 1 qualifying question (need + budget) then point to the exact package. If asked to calculate M-Pesa fee, use the mpesa_calc tool and give the exact number. Always end with a next step: link or WhatsApp.

RESPONSE FORMAT: Plain text. If you use a tool, include the JSON block on its own line. You can use multiple tools. After tool results, synthesize the answer.`;

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
          let pkg = 'Starter', price = '27,999', link = '/packages';
          if (need === 'store') { pkg = 'Master'; price = '49,999'; link = '/mpesa-ecommerce-kenya'; }
          else if (need === 'bookings') { pkg = 'Business'; price = '39,999'; link = '/packages'; }
          if (budget === 'under_30k' && pkg !== 'Starter') {
            pkg = 'Starter'; price = '27,999'; link = '/packages';
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


