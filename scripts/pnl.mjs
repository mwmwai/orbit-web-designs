#!/usr/bin/env node
/**
 * pnl.mjs — monthly P&L from the Supabase ledger + costs.csv.
 * Zero dependencies, Windows-safe, works from any cwd.
 *
 * Usage:
 *   node scripts/pnl.mjs --ledger <csv> [--costs costs.csv] [--month YYYY-MM]
 *
 * Output (stdout, markdown):
 *   revenue by shop (ledger rows with type=in), expenses grouped by category
 *   from costs.csv, net and margin. One section per month when --month is
 *   omitted, an ALL MONTHS total at the end.
 *
 * Missing inputs (no file, header-only, no rows for the month) print a
 * friendly "no data yet ..." and exit 0. Always exits 0.
 */
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));

const COST_CATEGORIES = ['Hosting', 'Domain', 'Software', 'Airtime', 'Data', 'Transport', 'Other'];
const OUT_TYPES = new Set(['out', 'o', 'debit', 'dr', 'withdrawal', 'withdraw', 'payment', 'payout', 'sent', 'transfer', 'expense']);

// ------------------------------------------------------------- arg parsing
function usage() {
  console.log([
    'pnl — monthly P&L (ledger revenue + costs.csv expenses)',
    '',
    '  node scripts/pnl.mjs --ledger <csv> [--costs costs.csv] [--month YYYY-MM]',
    '',
    '  --ledger  shop_transactions CSV export (dashboard "Export CSV")',
    '  --costs   costs CSV (default: costs.csv at repo root)',
    '  --month   only this month, e.g. 2026-10 (default: every month found)',
    '  --help    this message',
    '',
    'Markdown P&L prints to stdout. Always exits 0.',
  ].join('\n'));
}

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith('--')) continue;
    const eq = a.indexOf('=');
    if (eq > 0) { args[a.slice(2, eq)] = a.slice(eq + 1); continue; }
    const key = a.slice(2);
    const next = argv[i + 1];
    if (next !== undefined && !next.startsWith('--')) { args[key] = next; i++; }
    else args[key] = true;
  }
  return args;
}

const str = (v) => (typeof v === 'string' ? v.trim() : '');

// ------------------------------------------------------------- CSV parsing
// Same tolerant parser as deal-summary.mjs (quotes, CRLF, BOM).
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  text = text.replace(/^\uFEFF/, '');
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; } else { inQuotes = false; }
      } else { field += c; }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ',') {
      row.push(field); field = '';
    } else if (c === '\n') {
      row.push(field); rows.push(row); row = []; field = '';
    } else if (c === '\r') {
      // ignore CR (handles CRLF on Windows)
    } else {
      field += c;
    }
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row); }
  return rows;
}

// ------------------------------------------------------------- value utils
const norm = (s) => String(s ?? '').replace(/^\uFEFF/, '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '');

function toNumber(value) {
  const s = String(value ?? '').trim();
  if (!s) return NaN;
  const neg = /^\(.*\)$/.test(s);
  const n = Number(s.replace(/[^0-9.]/g, ''));
  if (!Number.isFinite(n)) return NaN;
  return neg ? -n : n;
}

const round2 = (n) => Math.round(n * 100) / 100;
const kes = (n) => round2(n).toLocaleString('en-US', { maximumFractionDigits: 2 });

// ------------------------------------------------------------ date parsing
// Nairobi (UTC+3) day/month extraction — same rules as reconcile-pochi.mjs.
const MONTHS = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 };
const NAIROBI_MS = 3 * 60 * 60 * 1000;
const neDay = (ts) => new Date(ts + NAIROBI_MS).toISOString().slice(0, 10);
const pad2 = (n) => String(n).padStart(2, '0');

function normZone(z) {
  if (z === 'Z' || z === 'z') return 'Z';
  const body = z.slice(1).replace(':', '');
  if (body.length === 2) return z[0] + body + ':00';
  if (body.length === 4) return z[0] + body.slice(0, 2) + ':' + body.slice(2);
  return null;
}

function parseWhen(value) {
  const s = String(value ?? '').trim();
  if (!s) return null;
  let m = /^(\d{4})-(\d{1,2})-(\d{1,2})(?:[T ](\d{1,2}):(\d{2})(?::(\d{2}))?(?:\.\d+)?)?\s*(Z|[+-]\d{1,2}(?::?\d{2})?)?$/i.exec(s);
  if (m) {
    const [, y, mo, d, hh, mm, ss, zone] = m;
    const hasTime = hh !== undefined;
    if (zone && hasTime) {
      const z = normZone(zone);
      if (!z) return null;
      const ts = Date.parse(`${y}-${pad2(mo)}-${pad2(d)}T${pad2(hh)}:${pad2(mm)}:${pad2(ss || '0')}${z}`);
      return Number.isFinite(ts) ? { ts, day: neDay(ts) } : null;
    }
    if (zone && !hasTime) return { ts: Date.UTC(+y, +mo - 1, +d), day: neDay(Date.UTC(+y, +mo - 1, +d)) };
    const ts = Date.UTC(+y, +mo - 1, +d, (hasTime ? +hh : 0) - 3, +(mm || 0), +(ss || 0));
    return { ts, day: neDay(ts) };
  }
  m = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})(?:[ ,]+(\d{1,2}):(\d{2})(?::(\d{2}))?\s*([AaPp][Mm])?)?/.exec(s);
  if (m) {
    let a = +m[1], b = +m[2], y = +m[3];
    if (y < 100) y += 2000;
    let day, mon;
    if (a > 12) { day = a; mon = b; } else if (b > 12) { mon = a; day = b; } else { day = a; mon = b; }
    if (mon < 1 || mon > 12 || day < 1 || day > 31) return null;
    const ts = Date.UTC(y, mon - 1, day, 0, 0, 0);
    return { ts, day: neDay(ts) };
  }
  m = /^(\d{1,2})[ \-/]([A-Za-z]{3,9})[ \-/](\d{4})/.exec(s);
  if (m) {
    const mon = MONTHS[norm(m[2]).slice(0, 3)];
    if (!mon) return null;
    const ts = Date.UTC(+m[3], mon - 1, +m[1]);
    return { ts, day: neDay(ts) };
  }
  const t = Date.parse(s);
  if (Number.isFinite(t)) return { ts: t, day: neDay(t) };
  return null;
}

const monthOf = (when) => (when ? when.day.slice(0, 7) : null);

// --------------------------------------------------------- header matching
function detectCol(header, candidates) {
  const h = header.map(norm);
  for (const c of candidates) { const i = h.indexOf(c); if (i >= 0) return i; }
  for (const c of candidates) { const i = h.findIndex((x) => x && x.includes(c)); if (i >= 0) return i; }
  return -1;
}

// ------------------------------------------------------------ ledger read
// Returns { rows: [{month, shop, amount}], skippedOut, blank } or { error }.
function readLedger(file) {
  const raw = parseCsv(readFileSync(file, 'utf8'));
  if (!raw.length) return { error: `${file} is empty.` };
  const header = raw[0].map((h) => String(h ?? '').trim());
  const idx = {
    date: detectCol(header, ['date', 'transactiondate', 'createdat', 'timestamp', 'time', 'completedat']),
    shop: detectCol(header, ['shop', 'store', 'outlet', 'business']),
    type: detectCol(header, ['type', 'direction', 'side']),
    amount: detectCol(header, ['amount', 'amountkes', 'value']),
    note: detectCol(header, ['note', 'notes', 'description', 'memo']),
    code: detectCol(header, ['mpesacode', 'mpesaref', 'code', 'receipt', 'transid', 'reference', 'ref']),
  };
  if (idx.amount < 0) return { error: `${file} has no amount column (header: ${header.join(', ') || 'empty'}).` };

  const rows = [];
  const outByMonth = {};
  let blank = 0;
  let undated = 0;
  for (const r of raw.slice(1)) {
    if (!r.some((v) => String(v).trim() !== '')) continue;
    const get = (i) => (i >= 0 && i < r.length ? String(r[i] ?? '').trim() : '');
    const amount = toNumber(get(idx.amount));
    if (!Number.isFinite(amount)) { blank++; continue; }
    const when = parseWhen(get(idx.date));
    const mo = monthOf(when);
    const type = norm(get(idx.type));
    if (type && OUT_TYPES.has(type)) {
      const key = mo || 'undated';
      outByMonth[key] = (outByMonth[key] || 0) + 1;
      continue;
    }
    if (!when) undated++;
    rows.push({
      month: mo,
      shop: get(idx.shop) || '(no shop)',
      amount: round2(Math.abs(amount)),
      undated: !when,
    });
  }
  const skippedOut = Object.values(outByMonth).reduce((t, n) => t + n, 0);
  return { rows, outByMonth, skippedOut, blank, undated };
}

// ------------------------------------------------------------- costs read
function readCosts(file) {
  const raw = parseCsv(readFileSync(file, 'utf8'));
  if (!raw.length) return { error: `${file} is empty.` };
  const header = raw[0].map((h) => String(h ?? '').trim());
  const idx = {
    date: detectCol(header, ['date', 'month', 'when']),
    category: detectCol(header, ['category', 'cat', 'type']),
    amount: detectCol(header, ['amountkes', 'amount', 'kes', 'value']),
    vendor: detectCol(header, ['vendor', 'supplier', 'payee', 'merchant']),
    notes: detectCol(header, ['notes', 'note', 'description', 'memo']),
  };
  if (idx.amount < 0) return { error: `${file} has no amount_kes column (header: ${header.join(', ') || 'empty'}).` };

  const rows = [];
  const unknownCats = new Set();
  let undated = 0;
  for (const r of raw.slice(1)) {
    if (!r.some((v) => String(v).trim() !== '')) continue;
    const get = (i) => (i >= 0 && i < r.length ? String(r[i] ?? '').trim() : '');
    const amount = toNumber(get(idx.amount));
    if (!Number.isFinite(amount) || amount <= 0) continue;
    const when = parseWhen(get(idx.date));
    if (!when) undated++;
    const category = get(idx.category) || 'Other';
    if (idx.category >= 0 && !COST_CATEGORIES.includes(titleCase(category))) unknownCats.add(category);
    rows.push({
      month: monthOf(when),
      category: titleCase(category),
      amount: round2(Math.abs(amount)),
      vendor: get(idx.vendor),
      undated: !when,
    });
  }
  return { rows, undated, unknownCats: [...unknownCats] };
}

function titleCase(s) {
  return String(s).replace(/\s+/g, ' ').trim().replace(/\b[a-z]/g, (c) => c.toUpperCase());
}

// --------------------------------------------------------------- sections
function table(headers, rows) {
  const out = ['| ' + headers.join(' | ') + ' |', '|' + headers.map(() => '---').join('|') + '|'];
  for (const r of rows) out.push('| ' + r.join(' | ') + ' |');
  return out.join('\n');
}

function pnlSection(label, revenueRows, costRows, memoOut) {
  const L = [];
  L.push(`## ${label}`);
  L.push('');

  // revenue by shop
  const byShop = new Map();
  for (const r of revenueRows) {
    const cur = byShop.get(r.shop) || { rows: 0, total: 0 };
    cur.rows++;
    cur.total = round2(cur.total + r.amount);
    byShop.set(r.shop, cur);
  }
  const shops = [...byShop.entries()].sort((a, b) => b[1].total - a[1].total);
  const revenue = round2(revenueRows.reduce((t, r) => t + r.amount, 0));
  L.push('### Revenue by shop (ledger type=in)');
  L.push('');
  if (!shops.length) L.push('_No revenue rows._');
  else {
    L.push(table(
      ['Shop', 'Rows', 'Revenue KES'],
      shops.map(([shop, v]) => [shop, String(v.rows), kes(v.total)]),
    ));
    L.push('');
    L.push(`**Total revenue:** KES ${kes(revenue)} (${revenueRows.length} row${revenueRows.length === 1 ? '' : 's'})`);
  }
  L.push('');

  // expenses from costs.csv
  const byCat = new Map();
  for (const c of costRows) {
    const cur = byCat.get(c.category) || { rows: 0, total: 0 };
    cur.rows++;
    cur.total = round2(cur.total + c.amount);
    byCat.set(c.category, cur);
  }
  const cats = COST_CATEGORIES
    .filter((c) => byCat.has(c))
    .concat([...byCat.keys()].filter((c) => !COST_CATEGORIES.includes(c)).sort());
  const expenses = round2(costRows.reduce((t, c) => t + c.amount, 0));
  L.push('### Expenses (costs.csv)');
  L.push('');
  if (!cats.length) L.push('_No cost rows._');
  else {
    L.push(table(
      ['Category', 'Rows', 'KES'],
      cats.map((cat) => [cat, String(byCat.get(cat).rows), kes(byCat.get(cat).total)]),
    ));
    L.push('');
    L.push(`**Total expenses:** KES ${kes(expenses)} (${costRows.length} row${costRows.length === 1 ? '' : 's'})`);
  }
  L.push('');

  // net + margin
  const net = round2(revenue - expenses);
  const margin = revenue > 0 ? `${((net / revenue) * 100).toFixed(1)}%` : 'n/a (no revenue)';
  L.push('### Net');
  L.push('');
  L.push(table(
    ['Line', 'KES'],
    [
      ['Revenue', kes(revenue)],
      ['Expenses', kes(expenses)],
      ['**Net**', `**${kes(net)}**`],
    ],
  ));
  L.push('');
  L.push(`**Margin:** ${margin} (net ÷ revenue)`);
  if (memoOut) { L.push(''); L.push(`_Memo: ${memoOut}_`); }
  L.push('');
  return L.join('\n');
}

// ------------------------------------------------------------------ main
function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || args.h) { usage(); return; }

  const ledgerPath = str(args.ledger);
  if (!ledgerPath) {
    console.log('no data yet — pass --ledger <ledger-export.csv> (see scripts/RECONCILE.md for the Friday export steps).\n');
    usage();
    return;
  }
  if (!existsSync(ledgerPath)) {
    console.log(`no data yet — ledger CSV not found: ${ledgerPath} (see scripts/RECONCILE.md for the Friday export steps).`);
    return;
  }

  const month = str(args.month);
  if (month && !/^\d{4}-\d{2}$/.test(month)) {
    console.log(`no data yet — --month expects YYYY-MM (got "${month}").`);
    return;
  }

  // costs: --costs path, else repo-root costs.csv, else ./costs.csv
  let costsPath = str(args.costs);
  if (costsPath && !existsSync(costsPath)) {
    console.log(`no data yet — costs CSV not found: ${costsPath}`);
    return;
  }
  if (!costsPath) {
    const candidates = [path.join(scriptDir, '..', 'costs.csv'), path.join(process.cwd(), 'costs.csv')];
    costsPath = candidates.find((p) => existsSync(p)) || '';
  }

  const led = readLedger(ledgerPath);
  if (led.error) { console.log(`no data yet — ${led.error}`); return; }

  let costs = { rows: [], outByMonth: {}, undated: 0, unknownCats: [] };
  if (costsPath) {
    const c = readCosts(costsPath);
    if (c.error) { console.log(`no data yet — ${c.error}`); return; }
    costs = c;
  }

  // filter by month
  let revenueRows = led.rows;
  let costRows = costs.rows;
  if (month) {
    revenueRows = led.rows.filter((r) => r.month === month);
    costRows = costs.rows.filter((r) => r.month === month);
    if (!revenueRows.length && !costRows.length) {
      console.log(`no data yet — no ledger or cost rows for ${month}.`);
      return;
    }
  }

  if (!led.rows.length && !costs.rows.length) {
    console.log(`no data yet — ${ledgerPath} and ${costsPath || 'costs.csv'} have no rows.`);
    return;
  }

  // months to render
  const hasUndated = (costs.undated || 0) + (led.undated || 0);
  const months = month
    ? [month]
    : [...new Set([...led.rows.map((r) => r.month), ...costs.rows.map((r) => r.month)])]
      .filter(Boolean)
      .sort();
  if (!months.length && !hasUndated) {
    console.log('no data yet — no dated rows in the ledger or costs.');
    return;
  }

  const L = [];
  L.push('# P&L — Orbit Web Designs');
  L.push('');
  L.push(`- Ledger: \`${ledgerPath}\` — ${led.rows.length} row(s)` +
    (led.skippedOut ? `, ${led.skippedOut} out-row(s) skipped (not revenue)` : '') +
    (led.undated ? `, ${led.undated} undated` : ''));
  L.push(`- Costs: ${costsPath ? `\`${costsPath}\` — ${costs.rows.length} row(s)` : '_no costs.csv yet — expenses are 0_ (add --costs <file> or create costs.csv at repo root)'}`);
  L.push(`- Scope: ${month ? month : 'every month found (' + months.join(', ') + ')'}`);
  L.push('');

  const outMemo = (n) => (n ? `${n} ledger out-row(s) excluded — M-Pesa spend belongs in costs.csv, not revenue.` : '');
  for (const mo of months) {
    const rev = led.rows.filter((r) => r.month === mo);
    const cst = costRows.filter((c) => c.month === mo);
    L.push(pnlSection(mo, rev, cst, outMemo(led.outByMonth[mo] || 0)));
  }

  if (!month && (months.length > 1 || hasUndated)) {
    L.push(pnlSection('ALL MONTHS', led.rows, costs.rows, outMemo(led.skippedOut)));
  }

  if (costs.unknownCats.length) {
    L.push(`> note: category "${costs.unknownCats.join('", "')}" is outside the allowed set (${COST_CATEGORIES.join('/')}) — fix costs.csv.`);
    L.push('');
  }
  if (!month && hasUndated) {
    L.push(`> note: ${hasUndated} row(s) have no readable date — counted in ALL MONTHS only.`);
    L.push('');
  }

  console.log(L.join('\n').trimEnd());
}

try {
  main();
} catch (e) {
  console.log(`pnl: unexpected error: ${e?.message || e}`);
}
process.exit(0);
