// POST /api/ingest/sms — Pochi la Biashara + fallback SMS forwarder ingest.
// Body: { secret, text, phone }. secret must equal INGEST_SECRET — fail-closed:
// if INGEST_SECRET is unset in the env, EVERY request is rejected (401).
// Parses standard Safaricom M-Pesa SMS (received / sent / paid variants),
// maps forwarding phone -> shop via POCHI_SHOP_MAP env JSON, dedupes on
// mpesa_code. Owner does nothing: phone auto-forwards SMS to this endpoint.
// Payer phone is masked in the visible note; the full SMS stays in raw.

import { parseShopMap, insertDeduped, parseMpesaSms, maskPhone } from '../_lib/shop-ingest.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'POST only' });
    return;
  }

  let body;
  try {
    body = await readJson(req);
  } catch {
    res.status(400).json({ ok: false, error: 'Bad request body' });
    return;
  }
  if (!body || typeof body !== 'object' || Array.isArray(body)) body = {};

  const secret = String(body.secret || '');
  const expected = process.env.INGEST_SECRET || '';
  if (!expected || secret !== expected) {
    res.status(401).json({ ok: false, error: 'Unauthorized' });
    return;
  }

  let parsed;
  try {
    parsed = parseMpesaSms(body.text);
  } catch {
    parsed = { error: 'Unrecognized M-Pesa SMS format' };
  }
  if (parsed.error) {
    res.status(400).json({ ok: false, error: parsed.error });
    return;
  }

  try {
    const pochiMap = parseShopMap(process.env.POCHI_SHOP_MAP);
    const phone = String(body.phone || '').replace(/[\s-]/g, '');
    const mapped = pochiMap[phone];
    const shop = mapped || 'Aggmart'; // fallback; flagged in raw when unmapped

    const method =
      parsed.kind === 'till' ? 'Till Number'
      : parsed.kind === 'pochi' || (!!mapped && parsed.kind !== 'till') ? 'Pochi la Biashara'
      : 'M-Pesa Personal';

    const result = await insertDeduped({
      shop,
      type: parsed.direction,
      amount: Math.round(parsed.amount * 100) / 100,
      category: parsed.direction === 'in' ? 'Sales' : 'Expense',
      method,
      date: parsed.date || new Date().toISOString(),
      // Mask any 9+ digit number (the payer/counterparty phone) in the note.
      note: String(parsed.counterparty || '').replace(/\d{9,}/g, (m) => maskPhone(m)).slice(0, 200),
      mpesa_code: parsed.code,
      raw: { sms: String(body.text).slice(0, 500), balance: parsed.balance, phone, _unmappedPhone: mapped ? undefined : phone || true },
    });

    res.status(200).json({ ok: true, ...result, shop, method });
  } catch (e) {
    if (e?.name === 'ConfigError') {
      console.error('sms ingest not recorded:', e.message);
      res.status(503).json({ ok: false, error: 'Server not configured (supabase env missing)' });
      return;
    }
    console.error('sms ingest failed:', e?.message || e);
    res.status(500).json({ ok: false, error: 'Store failed' });
  }
}

function readJson(req) {
  return new Promise((resolve) => {
    if (req.body !== undefined) {
      resolve(typeof req.body === 'string' ? safeParse(req.body) : req.body || {});
      return;
    }
    let data = '';
    req.on('data', (c) => { data += c; });
    req.on('end', () => resolve(safeParse(data)));
  });
}

function safeParse(s) {
  try { return JSON.parse(s || '{}'); } catch { return {}; }
}
