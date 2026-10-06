// POST /api/mpesa/c2b/validation — Safaricom Daraja C2B validation URL.
// Contract: always answer fast with ResultCode 0 (Accepted) so Safaricom
// proceeds to the confirmation callback, where the money is actually recorded.
// Writes NOTHING (validation may fire without a completed payment).
//
// Token gate is LOG-ONLY here on purpose: validation has nothing to protect
// (no row is written), and a hard rejection would make Safaricom REFUSE real
// customer payments whenever MPESA_CALLBACK_TOKEN is set before the portal URL
// carries ?token= — an outage with zero security upside. confirmation.js, the
// route that actually writes rows, hard-blocks on the same check.
// Never 500: any failure still answers 200 / ResultCode 0.

import { callbackTokenStatus } from '../../_lib/shop-ingest.js';

let warnedNoToken = false;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ ResultCode: 1, ResultDesc: 'Rejected' });
    return;
  }
  try {
    const gate = callbackTokenStatus(req);
    if (gate.required && !gate.ok) {
      console.warn('[mpesa-c2b] validation: MPESA_CALLBACK_TOKEN set but request token missing/invalid — accepted anyway (nothing written). Add ?token=... to the Validation URL in the Safaricom portal.');
    } else if (!gate.required && !warnedNoToken) {
      warnedNoToken = true; // once per instance
      console.warn('[mpesa-c2b] MPESA_CALLBACK_TOKEN is NOT set — validation accepts any POST. Set the env and add ?token=... to both Safaricom URLs.');
    }
    // Drain body (needed on some runtimes); validation ignores content.
    await readJson(req);
  } catch {
    // fall through — still accept
  }
  res.status(200).json({ ResultCode: 0, ResultDesc: 'Accepted' });
}

function readJson(req) {
  return new Promise((resolve) => {
    if (req.body !== undefined) {
      resolve(typeof req.body === 'string' ? safeParse(req.body) : req.body);
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
