import { createClient } from '@supabase/supabase-js';

const RATE_LIMIT = 10; // req per window
const WINDOW_MS = 60_000; // 1 minute
const ipStore = new Map<string, { count: number; reset: number }>();
const TURNSTILE_SECRET = process.env.TURNSTILE_SECRET_KEY;

function getClientIP(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return request.headers.get('x-real-ip') || 'unknown';
}

function checkRateLimit(ip: string): { allowed: boolean; remaining: number; reset: number } {
  const now = Date.now();
  const record = ipStore.get(ip);
  if (!record || now > record.reset) {
    ipStore.set(ip, { count: 1, reset: now + WINDOW_MS });
    return { allowed: true, remaining: RATE_LIMIT - 1, reset: now + WINDOW_MS };
  }
  if (record.count >= RATE_LIMIT) {
    return { allowed: false, remaining: 0, reset: record.reset };
  }
  record.count++;
  return { allowed: true, remaining: RATE_LIMIT - record.count, reset: record.reset };
}

async function verifyTurnstile(token: string, ip: string): Promise<boolean> {
  if (!TURNSTILE_SECRET) return true; // Skip verification if not configured
  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ secret: TURNSTILE_SECRET, response: token, remoteip: ip }),
    });
    const data = await res.json();
    return data.success === true;
  } catch {
    return false;
  }
}

export const config = {
  runtime: 'edge',
};

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const ip = getClientIP(request);
  const rateLimit = checkRateLimit(ip);

  if (!rateLimit.allowed) {
    return new Response(JSON.stringify({ error: 'Rate limit exceeded. Try again later.' }), {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': Math.ceil((rateLimit.reset - Date.now()) / 1000).toString(),
        'X-RateLimit-Limit': RATE_LIMIT.toString(),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': Math.ceil(rateLimit.reset / 1000).toString(),
      },
    });
  }

  const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return new Response(JSON.stringify({ error: 'Server misconfigured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await request.json();
    const { table, data } = body as { table: 'leads' | 'newsletter' | 'comments'; data: Record<string, unknown> };

    if (!['leads', 'newsletter', 'comments'].includes(table)) {
      return new Response(JSON.stringify({ error: 'Invalid table' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Verify Turnstile token if present
    const turnstileToken = data.turnstile_token as string | undefined;
    if (turnstileToken) {
      const valid = await verifyTurnstile(turnstileToken, ip);
      if (!valid) {
        return new Response(JSON.stringify({ error: 'Security check failed. Please try again.' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      // Remove token from data before inserting
      delete data.turnstile_token;
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { error } = await supabase.from(table).insert(data).select().single();

    if (error) {
      console.error('Supabase error:', error);
      // 23505 = unique violation (already subscribed)
      if ((error as any).code === '23505' && table === 'newsletter') {
        return new Response(JSON.stringify({ error: 'Already subscribed', duplicate: true }), {
          status: 409,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      return new Response(JSON.stringify({ error: 'Failed to submit' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Fire-and-forget welcome email for newsletter signups.
    if (table === 'newsletter' && data.email) {
      const resendKey = process.env.RESEND_API_KEY;
      const from = process.env.FROM_EMAIL || 'Orbit Web Designs <hello@orbitwebdesigns.co.ke>';
      if (resendKey) {
        const email = String(data.email);
        // Don't await — don't block the response.
        fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${resendKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from,
            to: email,
            subject: 'Welcome to Orbit — growth tips incoming',
            html: `<p>You're in — thanks for joining Orbit.</p><p>Every couple weeks we send one actionable tip on websites, M-Pesa, SEO, or WhatsApp sales — no spam.</p><p>Want a site in the meantime? Reply to this email or <a href="https://wa.me/254741992308?text=Hi%20Orbit!%20I%20joined%20the%20newsletter.">chat on WhatsApp</a>.</p><p>— Wanjohi, Orbit Web Designs & Marketing</p><p style="font-size:12px;color:#888">You're receiving this because you subscribed at orbitwebdesigns.co.ke. Reply STOP to unsubscribe.</p>`,
          }),
        }).catch((e) => console.error('Resend welcome failed:', e));
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'X-RateLimit-Limit': RATE_LIMIT.toString(),
        'X-RateLimit-Remaining': rateLimit.remaining.toString(),
        'X-RateLimit-Reset': Math.ceil(rateLimit.reset / 1000).toString(),
      },
    });
  } catch (err) {
    console.error('Proxy error:', err);
    return new Response(JSON.stringify({ error: 'Invalid request' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}