// Shared helpers for the money-dashboard ingest routes (Vercel serverless, ESM).
// Never imported by Astro pages — api/ only. No secrets here; routes read
// process.env (SUPABASE_SERVICE_ROLE_KEY etc.) and never expose them.

export const SHOPS = ['Aggmart', 'Trade Star Shop'];
export const METHODS = ['Till Number', 'Pochi la Biashara', 'M-Pesa Personal', 'Cash', 'Manual', 'Bank'];

// Parse {"till":"shop"} / {"phone":"shop"} env maps. Returns {} on bad JSON.
export function parseShopMap(raw) {
  try {
    const obj = JSON.parse(raw || '{}');
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return {};
    const out = {};
    for (const [k, v] of Object.entries(obj)) {
      if (SHOPS.includes(v)) out[String(k).trim()] = v;
    }
    return out;
  } catch {
    return {};
  }
}

let serviceClient = null;
export async function getServiceClient() {
  const url = process.env.PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Server misconfigured (supabase env missing)');
  if (!serviceClient) {
    const { createClient } = await import('@supabase/supabase-js');
    serviceClient = createClient(url, key, { auth: { persistSession: false } });
  }
  return serviceClient;
}

// Verify a Supabase Auth JWT server-side. Returns user or null.
export async function getAuthUser(token) {
  try {
    if (!token) return null;
    const url = process.env.PUBLIC_SUPABASE_URL;
    const anon = process.env.PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !anon) return null;
    const { createClient } = await import('@supabase/supabase-js');
    const sb = createClient(url, anon, { auth: { persistSession: false } });
    const { data, error } = await sb.auth.getUser(token);
    if (error || !data?.user) return null;
    return data.user;
  } catch {
    return null;
  }
}

export function bearerToken(req) {
  const h = req.headers?.authorization || req.headers?.Authorization || '';
  const m = String(h).match(/^Bearer\s+(.+)$/i);
  return m ? m[1].trim() : null;
}

// Insert with mpesa_code dedupe. Returns { inserted, id, deduped }.
// Unique-violation (23505) or pre-check hit => deduped:true.
export async function insertDeduped(row) {
  const sb = await getServiceClient();
  if (row.mpesa_code) {
    const { data: existing } = await sb
      .from('shop_transactions')
      .select('id')
      .eq('mpesa_code', row.mpesa_code)
      .maybeSingle();
    if (existing) return { inserted: false, id: existing.id, deduped: true };
  }
  const { data, error } = await sb.from('shop_transactions').insert(row).select('id').single();
  if (error) {
    if (error.code === '23505') return { inserted: false, id: null, deduped: true };
    throw error;
  }
  return { inserted: true, id: data.id, deduped: false };
}

// Daraja TransTime YYYYMMDDHHmmss (Africa/Nairobi, UTC+3) -> ISO string.
export function parseTransTime(tt) {
  try {
    const s = String(tt || '');
    const m = s.match(/^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})$/);
    if (!m) return new Date().toISOString();
    const [, Y, Mo, D, H, Mi, S] = m.map(Number);
    return new Date(Date.UTC(Y, Mo - 1, D, H - 3, Mi, S)).toISOString();
  } catch {
    return new Date().toISOString();
  }
}

// Safaricom SMS datetime "5/10/26 at 10:30 AM" (D/M/YY, Nairobi) -> ISO.
export function parseSmsDateTime(datePart, timePart) {
  try {
    const dm = String(datePart).split('/');
    if (dm.length !== 3) return null;
    let [d, mo, y] = dm.map((x) => parseInt(x, 10));
    if (y < 100) y += 2000;
    const tm = String(timePart).match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (!tm) return null;
    let h = parseInt(tm[1], 10);
    const mi = parseInt(tm[2], 10);
    const ap = tm[3].toUpperCase();
    if (ap === 'PM' && h < 12) h += 12;
    if (ap === 'AM' && h === 12) h = 0;
    return new Date(Date.UTC(y, mo - 1, d, h - 3, mi)).toISOString();
  } catch {
    return null;
  }
}

const num = (s) => parseFloat(String(s).replace(/,/g, ''));

// Parse standard Safaricom M-Pesa SMS text. Returns parsed obj or { error }.
export function parseMpesaSms(text) {
  const t = String(text || '');
  const codeM = t.match(/^\s*([A-Z0-9]{10})\s+Confirmed/i);
  if (!codeM) return { error: 'No M-Pesa confirmation code found' };
  const code = codeM[1].toUpperCase();

  let m = t.match(/You have received\s+Ksh\s?([\d,]+\.\d{2})\s+from\s+(.+?)\s+(\d{10,15})\s+on\s+(\d{1,2}\/\d{1,2}\/\d{2,4})\s+at\s+(\d{1,2}:\d{2}\s*(?:AM|PM))/i);
  if (m) {
    return finish({ code, t, amount: num(m[1]), counterparty: `${m[2].trim()} ${m[3]}`.slice(0, 120), direction: 'in', date: parseSmsDateTime(m[4], m[5]) });
  }
  m = t.match(/Ksh\s?([\d,]+\.\d{2})\s+sent to\s+(.+?)\s+(\d{10,15})\s+on\s+(\d{1,2}\/\d{1,2}\/\d{2,4})\s+at\s+(\d{1,2}:\d{2}\s*(?:AM|PM))/i);
  if (m) {
    return finish({ code, t, amount: num(m[1]), counterparty: `${m[2].trim()} ${m[3]}`.slice(0, 120), direction: 'out', date: parseSmsDateTime(m[4], m[5]) });
  }
  m = t.match(/Ksh\s?([\d,]+\.\d{2})\s+paid to\s+(.+?)\s+on\s+(\d{1,2}\/\d{1,2}\/\d{2,4})\s+at\s+(\d{1,2}:\d{2}\s*(?:AM|PM))/i);
  if (m) {
    return finish({ code, t, amount: num(m[1]), counterparty: m[2].trim().slice(0, 120), direction: 'out', date: parseSmsDateTime(m[3], m[4]) });
  }
  return { error: 'Unrecognized M-Pesa SMS format' };
}

function finish({ code, t, amount, counterparty, direction, date }) {
  if (!Number.isFinite(amount) || amount <= 0) return { error: 'Bad amount' };
  const balM = t.match(/New M-?PESA balance is\s+Ksh\s?([\d,]+\.\d{2})/i);
  const balance = balM ? num(balM[1]) : null;
  const isTill = /till|buy goods|merchant/i.test(t);
  const isPochi = /pochi/i.test(t);
  return {
    code, amount, balance, counterparty,
    direction,
    kind: isTill ? 'till' : isPochi ? 'pochi' : direction === 'in' ? 'personal-in' : 'personal-out',
    date: date || new Date().toISOString(),
  };
}
