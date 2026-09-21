const RATE_LIMIT = 15; // chat calls per window — each one costs money
const WINDOW_MS = 3_600_000; // 1 hour
const MAX_MSGS = 8;
const MAX_MSG_CHARS = 600;
const MAX_TOTAL_CHARS = 3000;
const MAX_TOKENS = 500;

const ipStore = new Map<string, { count: number; reset: number }>();

function getClientIP(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return request.headers.get('x-real-ip') || 'unknown';
}

function checkRateLimit(ip: string): { allowed: boolean; reset: number } {
  const now = Date.now();
  const record = ipStore.get(ip);
  if (!record || now > record.reset) {
    ipStore.set(ip, { count: 1, reset: now + WINDOW_MS });
    return { allowed: true, reset: now + WINDOW_MS };
  }
  if (record.count >= RATE_LIMIT) {
    return { allowed: false, reset: record.reset };
  }
  record.count++;
  return { allowed: true, reset: record.reset };
}

const SYSTEM = `You are Orbit — the powerful AI sales & support assistant for Orbit Web Designs & Marketing (Nairobi, worldwide remote). Be concise but genuinely helpful. Use 1-4 short sentences, plain text, no emojis unless the user uses them. Use **bold** for prices.

TRUTH (never invent):
- Websites: Starter 35,999 (5 days, 5 pages, WhatsApp+call, basic SEO, copy for 3 pages, Analytics) | Business 47,999 (1 week, 10 pages+blog, full SEO schema/sitemap 90+, bookings/Calendly, copy all pages, <2s) | Master 59,999 (2 weeks, 15+ pages or store/booking, M-Pesa Till+Paybill+cards/PayPal Daraja, inventory sync, abandoned-cart automations, training video)
- Care: Starter 7,499/mo, Business 10,999/mo, Master 13,999/mo. SaaS Care 15,999, Dashboard Care 5,999, Agent Care 7,999.
- SaaS from 59,999 (auth/roles, admin+user dashboards, M-Pesa, CSV, 3mo support) -> /saas
- Design from 17,999 (kits to 29,999) -> /design
- AI Agent 59,999 (WhatsApp/site/email, qualify+book, handover, 30d tuning) -> /automation
- Workflow 47,999/workflow (M-Pesa->Sheets, invoices, bundle 3=15% off) -> /automation
- Dashboards: Add-on 18,999, Standalone 32,999 -> /dashboards
- WhatsApp Responder 35,999
- M-Pesa: Till = walk-in, Paybill = tracked/online. Calculator at /mpesa-fee-calculator
- Humans: WhatsApp +254 741 992 308, Mon-Sat, minutes. You are the AI, but always offer WhatsApp handoff for quotes/booking.
- If unsure, say you don't have it and point to /packages, /guides, or WhatsApp. Never invent reviews, guarantees, or prices.

STYLE: Be useful and powerful. If asked for a recommendation, ask 1 qualifying question (need + budget) then point to the exact package. If asked to calculate M-Pesa fee, estimate from Safaricom 2026 bands (e.g., ~1.5% for 1k-5k) and link to calculator. Always end with a next step: link or WhatsApp.`;

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
    const reply =
      data?.choices?.[0]?.message?.content?.toString().trim().slice(0, 1200) || '';
    if (!reply) {
      return json({ error: 'AI unavailable', fallback: true }, 502);
    }
    return json({ reply });
  } catch {
    return json({ error: 'AI unavailable', fallback: true }, 502);
  }
}
