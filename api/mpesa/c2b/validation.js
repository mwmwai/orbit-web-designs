// POST /api/mpesa/c2b/validation — Safaricom Daraja C2B validation URL.
// Contract: always answer fast with ResultCode 0 (Accepted) so Safaricom
// proceeds to the confirmation callback, where the money is actually recorded.
// Writes NOTHING (validation may fire without a completed payment).

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ ResultCode: 1, ResultDesc: 'Rejected' });
    return;
  }
  try {
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
