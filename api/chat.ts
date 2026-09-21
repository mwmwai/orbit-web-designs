const RATE_LIMIT = 15; // chat calls per window — each one costs money
const WINDOW_MS = 3_600_000; // 1 hour
const MAX_MSGS = 8;
const MAX_MSG_CHARS = 600;
const MAX_TOTAL_CHARS = 3000;
const MAX_TOKENS = 300;

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

const SYSTEM = `You are Orbit, the chat sales assistant for Orbit Web Designs & Marketing, a Nairobi-based web studio serving clients worldwide. Reply in 1-3 short sentences, plain text, no markdown, no emojis. Facts you may use — prices in KES: Starter website 29,999 (3-5 days: up to 3 pages, WhatsApp chat, basic SEO); Business 39,999 (1-2 weeks: up to 7 pages, full SEO, bookings); Master 49,999 (2-3 weeks: store or booking system, M-Pesa plus cards, automations); custom SaaS from 49,999; design from 14,999; AI agent 49,999; workflow automation 39,999; dashboard add-on 19,999, standalone 35,999; monthly Care 6,500 Starter, 9,599 Business, 11,999 Master. M-Pesa Till and Paybill wired natively. Humans reply on WhatsApp +254 741 992 308, Mon-Sat, in minutes. If asked for a quote or anything you are unsure of, invite them to continue on WhatsApp. Never invent prices, timelines, reviews, or guarantees.`;

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
