// POST /api/mpesa/c2b/confirmation — Safaricom Daraja C2B confirmation URL.
// Records Till sales automatically: IN / Sales / Till Number, deduped on
// TransID (mpesa_code). Shortcode -> shop via TILL_SHOP_MAP env JSON.
//
// SECURITY: Daraja C2B callbacks carry NO signature, so any POST that guesses
// the URL could otherwise ingest a fake "sale" row (money-integrity risk).
// Fail-safe gate: when MPESA_CALLBACK_TOKEN is set, the callback must present
// it — ?token=... on the Confirmation URL registered in the Safaricom portal,
// or an x-callback-token header — otherwise 401 and NOTHING is written.
// When the env is UNSET we keep accepting (Safaricom sends no custom headers,
// so the token can only ride as a query param on the registered URL) and log a
// warning on every callback: set the token.
//
// Status contract (Safaricom retries non-2xx):
//   200 + ResultCode 0 -> received; also used for malformed bodies (ack, no retry)
//   401                -> MPESA_CALLBACK_TOKEN set, request token missing/invalid
//   503                -> server env missing (SUPABASE keys) — retryable, visible
//   never 500.

import { parseShopMap, insertDeduped, parseTransTime, callbackTokenStatus, maskPhone } from '../../_lib/shop-ingest.js';

// M-Pesa caps a single transaction at KES 250,000. 1,000,000 leaves headroom
// for any legit invoice yet stops absurd forged amounts wrecking dashboard KPIs.
const MAX_AMOUNT = 1000000;

let warnedNoToken = false;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ ResultCode: 1, ResultDesc: 'Rejected' });
    return;
  }

  const gate = callbackTokenStatus(req);
  if (gate.required && !gate.ok) {
    console.warn('[mpesa-c2b] confirmation REJECTED: MPESA_CALLBACK_TOKEN is set but the request token is missing/invalid. Add ?token=... to the Confirmation URL in the Safaricom portal.');
    res.status(401).json({ ResultCode: 1, ResultDesc: 'Rejected: invalid callback token' });
    return;
  }
  if (!gate.required && !warnedNoToken) {
    warnedNoToken = true; // once per instance — enough to surface in Vercel logs
    console.warn('[mpesa-c2b] MPESA_CALLBACK_TOKEN is NOT set — confirmation accepts any POST (Daraja sends no signature). Set the env and add ?token=... to both Safaricom URLs.');
  }

  let body = {};
  try {
    body = await readJson(req);
  } catch {
    body = {};
  }
  if (!body || typeof body !== 'object' || Array.isArray(body)) body = {};

  try {
    const code = String(body.TransID || '').trim().toUpperCase();
    const amount = parseAmount(body.TransAmount);
    if (!code || !Number.isFinite(amount) || amount <= 0) {
      // Malformed callback: acknowledge so Safaricom stops retrying.
      res.status(200).json({ ResultCode: 0, ResultDesc: 'Success' });
      return;
    }
    if (amount > MAX_AMOUNT) {
      // Implausible for M-Pesa: ack (no retry loop) but do not record.
      console.warn('[mpesa-c2b] confirmation: implausible amount', amount, 'for TransID', code, '- acknowledged, NOT recorded');
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
      // Payer phone masked in the visible note; full MSISDN stays in raw.
      note: [name || 'Till sale', msisdn ? `(${maskPhone(msisdn)})` : '', body.BillRefNumber ? `ref:${body.BillRefNumber}` : ''].filter(Boolean).join(' ').slice(0, 200),
      mpesa_code: code,
      raw: { ...body, _unmappedShortcode: mapped ? undefined : shortcode || true },
    });

    res.status(200).json({ ResultCode: 0, ResultDesc: 'Success', deduped: result.deduped || undefined });
  } catch (e) {
    if (e?.name === 'ConfigError') {
      // Missing SUPABASE env: 503 is honest and retryable — better than
      // silently acking a payment we failed to record.
      console.error('c2b confirmation not recorded:', e.message);
      res.status(503).json({ ResultCode: 1, ResultDesc: 'Service unavailable: server misconfigured' });
      return;
    }
    console.error('c2b confirmation failed:', e?.message || e);
    // Acknowledge anyway — never trap Safaricom in a retry storm.
    res.status(200).json({ ResultCode: 0, ResultDesc: 'Success' });
  }
}

// Daraja sends TransAmount as a JSON number (KES, usually an integer).
// Tolerate strings with separators ("1,500") instead of parsing them as 1.
function parseAmount(v) {
  if (typeof v === 'number') return v;
  return parseFloat(String(v ?? '').replace(/,/g, '').trim());
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
