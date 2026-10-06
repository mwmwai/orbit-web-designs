// POST /api/ingest/sms — Pochi la Biashara + fallback SMS forwarder ingest.
// Body: { secret, text, phone }. secret must equal INGEST_SECRET.
// Parses standard Safaricom M-Pesa SMS (received / sent / paid variants),
// maps forwarding phone -> shop via POCHI_SHOP_MAP env JSON, dedupes on
// mpesa_code. Owner does nothing: phone auto-forwards SMS to this endpoint.

import { parseShopMap, insertDeduped, parseMpesaSms } from '../_lib/shop-ingest.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'POST only' });
    return;
  }
  const body = await readJson(req);
  const secret = String(body.secret || '');
  const expected = process.env.INGEST_SECRET || '';
  if (!expected || secret !== expected) {
    res.status(401).json({ ok: false, error: 'Unauthorized' });
    return;
  }

  const parsed = parseMpesaSms(body.text);
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
      date: parsed.date,
      note: parsed.counterparty.slice(0, 200),
      mpesa_code: parsed.code,
      raw: { sms: String(body.text).slice(0, 500), balance: parsed.balance, phone, _unmappedPhone: mapped ? undefined : phone || true },
    });

    res.status(200).json({ ok: true, ...result, shop, method });
  } catch (e) {
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
