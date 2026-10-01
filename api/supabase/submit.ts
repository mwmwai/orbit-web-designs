import { createClient } from '@supabase/supabase-js';

const RATE_LIMIT = 10; // req per window
const WINDOW_MS = 60_000; // 1 minute
const MAX_ENTRIES = 5000; // cap the Map so it can't grow unbounded
const ipStore = new Map<string, { count: number; reset: number }>();
const TURNSTILE_SECRET = process.env.TURNSTILE_SECRET_KEY;

// Every slug with a <Comments slug="…"> embed. Comment inserts for any other
// slug are rejected — keeps the comments table free of spam namespaces.
const KNOWN_COMMENT_SLUGS = new Set([
  'best-web-designer-kenya',
  'mpesa-till-vs-paybill',
  'ecommerce-kenya-guide',
  'whatsapp-business-kenya',
  'choose-web-designer-kenya',
  'website-cost-kenya',
  'seo-small-business-kenya',
  'website-care-kenya',
  'orbit-vs-competitors',
  'web-design-kenya-guide',
]);

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

function checkRateLimit(ip: string): { allowed: boolean; remaining: number; reset: number } {
  const now = Date.now();
  const key = rateKey(ip);
  const record = ipStore.get(key);
  if (!record || now > record.reset) {
    if (ipStore.size >= MAX_ENTRIES) {
      const oldest = ipStore.keys().next().value;
      if (oldest !== undefined) ipStore.delete(oldest);
    }
    ipStore.set(key, { count: 1, reset: now + WINDOW_MS });
    return { allowed: true, remaining: RATE_LIMIT - 1, reset: now + WINDOW_MS };
  }
  if (record.count >= RATE_LIMIT) {
    return { allowed: false, remaining: 0, reset: record.reset };
  }
  record.count++;
  return { allowed: true, remaining: RATE_LIMIT - record.count, reset: record.reset };
}

async function verifyTurnstile(token: string, ip: string): Promise<boolean> {
  if (!TURNSTILE_SECRET) return false; // Fail CLOSED — never skip verification.
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
    const { table, data: rawData } = body as { table: 'leads' | 'newsletter' | 'comments'; data: Record<string, unknown> };
    const data = (rawData && typeof rawData === 'object' ? rawData : {}) as Record<string, unknown>;

    if (!['leads', 'newsletter', 'comments'].includes(table)) {
      return new Response(JSON.stringify({ error: 'Invalid table' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Turnstile is REQUIRED for every table (incl. newsletter) and fails CLOSED:
    // missing token, failed verification, or unset secret all reject the request.
    if (!TURNSTILE_SECRET) {
      return new Response(JSON.stringify({ error: 'Security verification unavailable. Try again later.' }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    const turnstileToken = data.turnstile_token;
    if (typeof turnstileToken !== 'string' || !turnstileToken) {
      return new Response(JSON.stringify({ error: 'Security check required. Please try again.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    const valid = await verifyTurnstile(turnstileToken, ip);
    if (!valid) {
      return new Response(JSON.stringify({ error: 'Security check failed. Please try again.' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Strip unknown columns and validate per table — never insert raw client data.
    // (PostgREST would reject unknown columns, but allowlisting also blocks
    //  attempts to set privileged fields like `approved` on comments.)
    const bad = (msg: string) =>
      new Response(JSON.stringify({ error: msg }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    const str = (v: unknown, max: number): string | null => {
      if (typeof v !== 'string') return null;
      const s = v.trim();
      if (!s) return null;
      return s.slice(0, max);
    };
    let row: Record<string, unknown>;
    if (table === 'leads') {
      const name = str(data.name, 80);
      if (!name) return bad('Name is required.');
      const email = str(data.email, 120);
      const phone = str(data.phone, 20);
      const details = str(data.details, 800);
      const source = str(data.source, 40) || 'contact-form';
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return bad('Invalid email.');
      row = { name, email: email || null, phone: phone || null, details: details || null, source };
    } else if (table === 'newsletter') {
      const email = str(data.email, 160);
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return bad('Valid email is required.');
      const name = str(data.name, 80);
      row = { email, name: name || null };
    } else {
      // comments — slug must match a real blog page (arbitrary slugs rejected).
      const slug = str(data.slug, 80);
      if (!slug || !/^[a-z0-9-]{1,80}$/.test(slug) || !KNOWN_COMMENT_SLUGS.has(slug)) {
        return bad('Invalid article.');
      }
      const name = str(data.name, 60);
      const text = str(data.text, 1000);
      if (!name || !text) return bad('Name and comment are required.');
      row = { slug, name, text };
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { error } = await supabase.from(table).insert(row).select().single();

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
    if (table === 'newsletter' && row.email) {
      const resendKey = process.env.RESEND_API_KEY;
      const from = process.env.FROM_EMAIL || 'Orbit Web Designs <hello@orbitwebdesigns.co.ke>';
      if (resendKey) {
        const email = String(row.email);
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