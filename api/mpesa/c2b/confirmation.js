// POST /api/mpesa/c2b/confirmation — Safaricom Daraja C2B confirmation URL.
// Records Till sales automatically: IN / Sales / Till Number, deduped on
// TransID (mpesa_code). Shortcode -> shop via TILL_SHOP_MAP env JSON.
// Always answers ResultCode 0 so Safaricom never retries in a loop.

import { parseShopMap, insertDeduped, parseTransTime } from '../../../_lib/shop-ingest.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ ResultCode: 1, ResultDesc: 'Rejected' });
    return;
  }
  const body = await readJson(req);
  try {
    const code = String(body.TransID || '').trim().toUpperCase();
    const amount = parseFloat(body.TransAmount);
    if (!code || !Number.isFinite(amount) || amount <= 0) {
      // Malformed callback: acknowledge so Safaricom stops retrying.
      res.status(200).json({ ResultCode: 0, ResultDesc: 'Success' });
      return;
    }

    const tillMap = parseShopMap(process.env.TILL_SHOP_MAP);
    const shortcode = String(body.BusinessShortCode || '').trim();
    const mapped = tillMap[shortcode];
    const shop = mapped || 'Aggmart'; // fallback; flagged in raw when unmapped
    const name = [body.FirstName, body.MiddleName, body.LastName].filter(Boolean).join(' ').trim().slice(0, 80);
    const msisdn = String(body.MSISDN || '').trim();

    const result = await insertDeduped({
      shop,
      type: 'in',
      amount: Math.round(amount * 100) / 100,
      category: 'Sales',
      method: 'Till Number',
      date: body.TransTime ? parseTransTime(body.TransTime) : new Date().toISOString(),
      note: [name || 'Till sale', msisdn ? `(${msisdn})` : '', body.BillRefNumber ? `ref:${body.BillRefNumber}` : ''].filter(Boolean).join(' ').slice(0, 200),
      mpesa_code: code,
      raw: { ...body, _unmappedShortcode: mapped ? undefined : shortcode || true },
    });

    res.status(200).json({ ResultCode: 0, ResultDesc: 'Success', deduped: result.deduped || undefined });
  } catch (e) {
    console.error('c2b confirmation failed:', e?.message || e);
    // Acknowledge anyway — never trap Safaricom in a retry storm.
    res.status(200).json({ ResultCode: 0, ResultDesc: 'Success' });
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
