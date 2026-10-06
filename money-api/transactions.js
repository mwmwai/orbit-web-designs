// /api/transactions — owner-only ledger access (Supabase Auth JWT required).
//   GET  ?shop=&from=&to=&limit=  -> { rows, summary, totals, latestBalance, total }
//   POST { shop, type, amount, category?, method?, date?, note?, reason }
//        -> manual add / void-with-reason (append-only ledger, reason required)
// Reads + writes use SUPABASE_SERVICE_ROLE_KEY server-side (never exposed).
//
// shape:
//   rows          limited row list (raw jsonb stripped — payload stays small)
//   summary       per-shop in/out/profit/count over the FULL range, both shops
//   totals        in/out/profit/count for the selected shop + range (uncapped)
//   total         how many rows match the filters (before the limit)
//   latestBalance newest M-Pesa balance seen anywhere in the range

import { getServiceClient, getAuthUser, bearerToken, authEnvMissing, SHOPS, METHODS } from './_lib/shop-ingest.js';

const TYPES = ['in', 'out'];
const MAX_LIMIT = 1000;

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  const user = await getAuthUser(bearerToken(req));
  if (!user) {
    // Distinguish a real "not logged in" (401) from a broken deploy (503) so
    // the dashboard shows the truth instead of "Login required".
    const authGap = authEnvMissing();
    if (authGap.length) return send503(res, `missing env ${authGap.join(', ')}`, 'transactions auth');
    res.status(401).json({ ok: false, error: 'Login required' });
    return;
  }

  if (req.method === 'GET') return handleGet(req, res);
  if (req.method === 'POST') return handlePost(req, res, user);
  res.status(405).json({ ok: false, error: 'Method not allowed' });
}

async function handleGet(req, res) {
  try {
    const q = req.query || {};
    const shop = String(q.shop || 'Both');
    const from = String(q.from || '');
    const to = String(q.to || '');
    const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(q.limit || '200', 10) || 200));

    const range = {};
    if (from) {
      const d = new Date(from);
      if (Number.isNaN(d.getTime())) return res.status(400).json({ ok: false, error: 'Bad from date' });
      range.from = d.toISOString();
    }
    if (to) {
      const end = new Date(to);
      if (Number.isNaN(end.getTime())) return res.status(400).json({ ok: false, error: 'Bad to date' });
      end.setDate(end.getDate() + 1);
      range.to = end.toISOString();
    }
    const scoped = shop === 'Aggmart' || shop === 'Trade Star Shop';

    const sb = await getServiceClient();

    // --- row list (columns only, no raw jsonb) ---
    let list = sb
      .from('shop_transactions')
      .select('id,shop,type,amount,category,method,date,note,mpesa_code', { count: 'exact' })
      .order('date', { ascending: false })
      .limit(limit);
    if (scoped) list = list.eq('shop', shop);
    if (range.from) list = list.gte('date', range.from);
    if (range.to) list = list.lt('date', range.to);
    const { data, error, count } = await list;
    if (error) throw error;
    const rows = data || [];

    // --- one aggregate over the full range, BOTH shops, uncapped ---
    // summary comes straight from it; totals are derived for the selected shop.
    let agg = sb.from('shop_transactions').select('shop,type,amount');
    if (range.from) agg = agg.gte('date', range.from);
    if (range.to) agg = agg.lt('date', range.to);
    const { data: aggRows, error: aggErr } = await agg;
    if (aggErr) throw aggErr;

    const summary = {};
    for (const s of SHOPS) summary[s] = { in: 0, out: 0, profit: 0, count: 0 };
    for (const r of aggRows || []) {
      const amt = Number(r.amount) || 0;
      if (!summary[r.shop]) summary[r.shop] = { in: 0, out: 0, profit: 0, count: 0 };
      if (r.type === 'out') summary[r.shop].out += amt; else summary[r.shop].in += amt;
      summary[r.shop].count += 1;
    }
    for (const t of Object.values(summary)) {
      t.in = Math.round(t.in * 100) / 100;
      t.out = Math.round(t.out * 100) / 100;
      t.profit = Math.round((t.in - t.out) * 100) / 100;
    }

    const source = scoped ? [summary[shop]] : Object.values(summary);
    const totals = { in: 0, out: 0, profit: 0, count: 0 };
    for (const t of source) {
      totals.in += t.in; totals.out += t.out; totals.count += t.count;
    }
    totals.in = Math.round(totals.in * 100) / 100;
    totals.out = Math.round(totals.out * 100) / 100;
    totals.profit = Math.round((totals.in - totals.out) * 100) / 100;

    // --- newest recorded M-Pesa balance in range (raw lives on few rows) ---
    let bal = sb.from('shop_transactions').select('raw,date').not('raw', 'is', null).order('date', { ascending: false }).limit(50);
    if (range.from) bal = bal.gte('date', range.from);
    if (range.to) bal = bal.lt('date', range.to);
    const { data: balRows } = await bal;
    let latestBalance = null;
    for (const r of balRows || []) {
      const b = r.raw?.balance;
      if (b !== undefined && b !== null && b !== '') { latestBalance = Number(b); break; }
    }

    res.status(200).json({
      ok: true,
      rows,
      summary,
      totals,
      latestBalance,
      total: count ?? rows.length,
      limit,
    });
  } catch (e) {
    if (e?.name === 'ConfigError') return send503(res, e.message, 'GET');
    console.error('transactions GET failed:', e?.message || e);
    res.status(500).json({ ok: false, error: 'Fetch failed' });
  }
}

async function handlePost(req, res, user) {
  try {
    const body = await readJson(req);
    const shop = String(body.shop || '');
    const type = String(body.type || '');
    const method = String(body.method || 'Manual');
    const amount = Number(String(body.amount ?? '').replace(/,/g, ''));
    const reason = String(body.reason || '').trim();

    if (!SHOPS.includes(shop)) return res.status(400).json({ ok: false, error: 'Pick a shop (Aggmart or Trade Star Shop)' });
    if (!TYPES.includes(type)) return res.status(400).json({ ok: false, error: 'Type must be in or out' });
    if (!METHODS.includes(method)) return res.status(400).json({ ok: false, error: 'Unknown method' });
    if (!Number.isFinite(amount) || amount <= 0) return res.status(400).json({ ok: false, error: 'Amount must be > 0' });
    if (!reason) return res.status(400).json({ ok: false, error: 'Reason is required (audit trail)' });

    let date = new Date().toISOString();
    if (body.date) {
      const d = new Date(body.date);
      if (Number.isNaN(d.getTime())) return res.status(400).json({ ok: false, error: 'Bad date' });
      date = d.toISOString();
    }
    // To VOID a transaction: post the opposite type with note "Void <M-Pesa code>" + reason.

    const sb = await getServiceClient();
    const row = {
      shop,
      type,
      amount: Math.round(amount * 100) / 100,
      category: String(body.category || (type === 'in' ? 'Sales' : 'Expense')).slice(0, 60),
      method,
      date,
      note: String(body.note || '').slice(0, 200) || null,
      mpesa_code: body.mpesa_code ? String(body.mpesa_code).toUpperCase().slice(0, 20) : null,
      raw: { manual: true, reason: reason.slice(0, 300), by: user.id },
    };
    const { data, error } = await sb.from('shop_transactions').insert(row).select('id').single();
    if (error) {
      if (error.code === '23505') return res.status(409).json({ ok: false, error: 'That M-Pesa code is already recorded' });
      throw error;
    }
    res.status(200).json({ ok: true, id: data.id });
  } catch (e) {
    if (e?.name === 'ConfigError') return send503(res, e.message, 'POST');
    console.error('transactions POST failed:', e?.message || e);
    res.status(500).json({ ok: false, error: 'Save failed' });
  }
}

// Missing env is a deploy problem: say so plainly (503 JSON), never a 500.
function send503(res, detail, where) {
  console.error(`[transactions] ${where} 503:`, detail);
  res.status(503).json({ ok: false, error: 'Server not configured (supabase env missing)' });
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
