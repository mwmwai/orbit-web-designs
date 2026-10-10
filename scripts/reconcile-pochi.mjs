#!/usr/bin/env node
/**
 * reconcile-pochi.mjs — Friday reconciliation for M-Pesa Pochi till 0741992308.
 *
 * Matches an M-Pesa statement export (CSV) against the Supabase
 * shop_transactions ledger export (CSV). Zero dependencies, Windows-safe,
 * works from any cwd.
 *
 * Usage:
 *   node scripts/reconcile-pochi.mjs --statement <m-pesa-export.csv> \
 *                                     --ledger <ledger-export.csv> \
 *                                     [--out report.md]
 *
 * Matching order:
 *   1. M-Pesa code (Trans ID) — full match, or >=4-char suffix match so a
 *      deal-log style mpesa_ref ("last 4-6 chars") still ties back.
 *   2. Same amount + within ±10 minutes. If either side has no time-of-day,
 *      same Nairobi calendar day + amount instead.
 * Buckets:
 *   MATCHED         statement line and ledger row agree
 *   UNRECORDED      statement only  -> money received, NOT booked (lost revenue)
 *   GHOST           ledger only     -> booked, no statement line (verify/void)
 *   AMOUNT MISMATCH same M-Pesa code, different KES
 *
 * Tolerant to Safaricom CSV header variants (case-insensitive detection).
 * ALWAYS exits 0; prints a summary on stdout. Markdown report goes to --out
 * (or to stdout after the summary when --out is omitted).
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const WINDOW_MS = 10 * 60 * 1000;        // ±10 minutes
const NAIROBI_MS = 3 * 60 * 60 * 1000;   // UTC+3, Kenya has no DST

// ------------------------------------------------------------- arg parsing
function usage() {
  console.log([
    'reconcile-pochi — M-Pesa statement vs Supabase ledger',
    '',
    '  node scripts/reconcile-pochi.mjs --statement <m-pesa-export.csv> --ledger <ledger-export.csv> [--out report.md]',
    '',
    '  --statement  Safaricom M-Pesa CSV export for Pochi 0741992308',
    '  --ledger     shop_transactions CSV export (dashboard "Export CSV")',
    '  --out        write the markdown report to this file (default: stdout)',
    '  --help       this message',
    '',
    'Always exits 0. Summary is printed on stdout.',
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
const sameAmount = (a, b) => Math.round(a * 100) === Math.round(b * 100);
const kes = (n) => round2(n).toLocaleString('en-US', { maximumFractionDigits: 2 });

function codeNorm(v) { return String(v ?? '').replace(/\s+/g, '').toUpperCase(); }
function codeMatch(a, b) {
  if (!a || !b) return false;
  if (a === b) return true;
  return a.length >= 4 && b.length >= 4 && (a.endsWith(b) || b.endsWith(a));
}

// ------------------------------------------------------------ date parsing
// Returns { ts, day, hasTime } or null. Naive timestamps are read as
// Africa/Nairobi (UTC+3, no DST) so Safaricom local times compare correctly
// against Supabase ISO-8601 timestamptz values.
const MONTHS = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 };
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
      return Number.isFinite(ts) ? { ts, day: neDay(ts), hasTime } : null;
    }
    if (zone && !hasTime) {
      const ts = Date.UTC(+y, +mo - 1, +d);
      return { ts, day: neDay(ts), hasTime };
    }
    // naive -> Nairobi local
    const ts = Date.UTC(+y, +mo - 1, +d, (hasTime ? +hh : 0) - 3, +(mm || 0), +(ss || 0));
    return { ts, day: neDay(ts), hasTime };
  }

  // d/M/y (Kenya day-first) or M/d/y, optional time + AM/PM
  m = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})(?:[ ,]+(\d{1,2}):(\d{2})(?::(\d{2}))?\s*([AaPp][Mm])?)?/.exec(s);
  if (m) {
    let a = +m[1], b = +m[2], y = +m[3];
    if (y < 100) y += 2000;
    let day, mon;
    if (a > 12) { day = a; mon = b; } else if (b > 12) { mon = a; day = b; } else { day = a; mon = b; }
    if (mon < 1 || mon > 12 || day < 1 || day > 31) return null;
    let hh = m[4] !== undefined ? +m[4] : 0;
    const ap = m[7] ? m[7][0].toLowerCase() : null;
    if (ap === 'p' && hh < 12) hh += 12;
    if (ap === 'a' && hh === 12) hh = 0;
    const ts = Date.UTC(y, mon - 1, day, hh - 3, +(m[5] || 0), +(m[6] || 0));
    return { ts, day: neDay(ts), hasTime: m[4] !== undefined };
  }

  // dd-Mon-yyyy / Mon dd, yyyy
  m = /^(\d{1,2})[ \-/]([A-Za-z]{3,9})[ \-/](\d{4})(?:[ ,]+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/.exec(s);
  if (!m) m = /^([A-Za-z]{3,9})[ \-]+(\d{1,2}),?[ \-]+(\d{4})(?:[ ,]+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/.exec(s);
  if (m) {
    const monA = MONTHS[norm(m[2]) ? norm(m[2]).slice(0, 3) : ''];
    const isDayFirst = /^\d/.test(m[1]);
    const day = isDayFirst ? +m[1] : +m[2];
    const mon = isDayFirst ? monA : MONTHS[norm(m[1]).slice(0, 3)];
    if (!mon || day < 1 || day > 31) return null;
    const hh = m[4] !== undefined ? +m[4] : 0;
    const ts = Date.UTC(+m[3], mon - 1, day, hh - 3, +(m[5] || 0), +(m[6] || 0));
    return { ts, day: neDay(ts), hasTime: m[4] !== undefined };
  }

  const t = Date.parse(s);
  if (Number.isFinite(t)) return { ts: t, day: neDay(t), hasTime: /\d{1,2}:\d{2}/.test(s) };
  return null;
}

// --------------------------------------------------- tolerant header match
function detectCol(header, candidates) {
  const h = header.map(norm);
  for (const c of candidates) { const i = h.indexOf(c); if (i >= 0) return i; }
  for (const c of candidates) { const i = h.findIndex((x) => x && x.includes(c)); if (i >= 0) return i; }
  return -1;
}

const CODE_COLS = ['transid', 'transactionid', 'receipt', 'receiptnumber', 'mpesacode', 'mpesareceipt', 'mpesaref', 'reference', 'ref', 'transactionreference', 'code'];
const AMOUNT_COLS = ['amount', 'amountkes', 'transamount', 'paidin', 'credit', 'value', 'payment'];
const DATE_COLS = ['completiontime', 'date', 'transactiondate', 'transactiontime', 'datetime', 'completedat', 'postedon', 'createdat', 'time', 'timestamp'];
const PARTY_COLS = ['paybill', 'till', 'tillnumber', 'from', 'party', 'partyname', 'sender', 'name', 'account', 'details', 'reason', 'completedtransaction'];
const STATUS_COLS = ['status', 'transactionstatus', 'result', 'transactionresult'];
const DIR_COLS = ['transactiontype', 'direction', 'drcr', 'type'];
const SHOP_COLS = ['shop', 'store', 'outlet', 'business'];
const TYPE_COLS = ['type', 'direction', 'side'];
const NOTE_COLS = ['note', 'notes', 'description', 'memo', 'comment', 'details'];

const OUT_TYPES = new Set(['out', 'o', 'debit', 'dr', 'withdrawal', 'withdraw', 'payment', 'payout', 'sent', 'transfer', 'expense']);
const FAIL_STATUS = new Set(['failed', 'fail', 'cancelled', 'canceled', 'rejected', 'void', 'voided', 'reversed', 'reversal', 'declined', 'expired', 'pending', 'processing', 'incomplete', 'notcompleted']);

function findHeader(rows, colsFor) {
  for (let r = 0; r < Math.min(rows.length, 12); r++) {
    const row = rows[r];
    if (!row || row.length < 2) continue;
    const cols = colsFor(row);
    if (cols) return { rowIndex: r, cols };
  }
  return null;
}

// -------------------------------------------------------- statement reader
function readStatement(file) {
  const rows = parseCsv(readFileSync(file, 'utf8'));
  if (!rows.length) return { error: `${file} is empty.` };

  const found = findHeader(rows, (row) => {
    const amount = detectCol(row, AMOUNT_COLS);
    const date = detectCol(row, DATE_COLS);
    const code = detectCol(row, CODE_COLS);
    if (amount < 0 || (date < 0 && code < 0)) return null;
    return { code, amount, date, party: detectCol(row, PARTY_COLS), status: detectCol(row, STATUS_COLS), dir: detectCol(row, DIR_COLS) };
  });
  if (!found) return { error: `no recognisable header in ${file} (looked for Amount/Paid In + Date/Completion Time/Trans ID). Expected a Safaricom CSV export.` };

  const { cols } = found;
  const records = [];
  let ignored = 0;
  for (const row of rows.slice(found.rowIndex + 1)) {
    if (!row.some((v) => String(v).trim() !== '')) continue;
    const get = (i) => (i >= 0 && i < row.length ? String(row[i] ?? '').trim() : '');

    const status = norm(get(cols.status));
    if (status && FAIL_STATUS.has(status)) { ignored++; continue; }
    const dir = norm(get(cols.dir));
    if (dir && OUT_TYPES.has(dir)) { ignored++; continue; }

    const amount = toNumber(get(cols.amount));
    if (!Number.isFinite(amount) || amount <= 0) { ignored++; continue; } // withdrawals / blanks

    const when = cols.date >= 0 ? parseWhen(get(cols.date)) : null;
    records.push({
      code: codeNorm(get(cols.code)),
      amount: round2(amount),
      ts: when ? when.ts : null,
      day: when ? when.day : null,
      hasTime: when ? when.hasTime : false,
      party: get(cols.party),
      rawWhen: get(cols.date),
    });
  }
  return { records, ignored, headerRow: found.rowIndex + 1 };
}

// ----------------------------------------------------------- ledger reader
function readLedger(file) {
  const rows = parseCsv(readFileSync(file, 'utf8'));
  if (!rows.length) return { error: `${file} is empty.` };

  const found = findHeader(rows, (row) => {
    const amount = detectCol(row, AMOUNT_COLS);
    if (amount < 0) return null;
    const date = detectCol(row, DATE_COLS);
    if (date < 0) return null;
    return { date, amount, code: detectCol(row, CODE_COLS), shop: detectCol(row, SHOP_COLS), type: detectCol(row, TYPE_COLS), note: detectCol(row, NOTE_COLS) };
  });
  if (!found) return { error: `no recognisable header in ${file} (looked for date + amount, e.g. the dashboard export "date,shop,type,amount,...,mpesa_code").` };

  const { cols } = found;
  const records = [];
  let skippedOut = 0;
  let skippedBlank = 0;
  for (const row of rows.slice(found.rowIndex + 1)) {
    if (!row.some((v) => String(v).trim() !== '')) continue;
    const get = (i) => (i >= 0 && i < row.length ? String(row[i] ?? '').trim() : '');

    const type = norm(get(cols.type));
    if (type && OUT_TYPES.has(type)) { skippedOut++; continue; } // spend -> costs.csv, not statement credits

    const amount = toNumber(get(cols.amount));
    if (!Number.isFinite(amount) || amount <= 0) { skippedBlank++; continue; }

    const when = parseWhen(get(cols.date));
    records.push({
      code: codeNorm(get(cols.code)),
      amount: round2(amount),
      ts: when ? when.ts : null,
      day: when ? when.day : null,
      hasTime: when ? when.hasTime : false,
      shop: get(cols.shop) || '(no shop)',
      note: get(cols.note),
      rawWhen: get(cols.date),
    });
  }
  return { records, skippedOut, skippedBlank, headerRow: found.rowIndex + 1 };
}

// ---------------------------------------------------------- reconciliation
function timeFit(a, b) {
  // Full timestamps on both sides -> strict ±10 min window (nearest wins).
  if (a.hasTime && b.hasTime && a.ts != null && b.ts != null) {
    const diff = Math.abs(a.ts - b.ts);
    return { ok: diff <= WINDOW_MS, score: diff };
  }
  // Either side is date-only -> same Nairobi calendar day + amount.
  if (a.day && b.day) return { ok: a.day === b.day, score: WINDOW_MS };
  return { ok: false, score: Infinity };
}

function reconcile(stmt, ledger) {
  const matched = [];
  const mismatch = [];
  const unrec = [];
  const pool = ledger.slice();
  const usedS = new Set();
  const take = (l) => { const i = pool.indexOf(l); if (i >= 0) pool.splice(i, 1); };

  // pass 1 — M-Pesa code
  for (const s of stmt) {
    if (!s.code) continue;
    const l = pool.find((x) => codeMatch(s.code, x.code));
    if (!l) continue;
    take(l);
    usedS.add(s);
    if (sameAmount(s.amount, l.amount)) matched.push({ s, l, via: 'code' });
    else mismatch.push({ s, l });
  }

  // pass 2 — amount + ±10 min (nearest wins)
  for (const s of stmt) {
    if (usedS.has(s)) continue;
    let best = null;
    let bestScore = Infinity;
    for (const l of pool) {
      if (!sameAmount(s.amount, l.amount)) continue;
      const fit = timeFit(s, l);
      if (!fit.ok) continue;
      if (fit.score < bestScore) { bestScore = fit.score; best = l; }
    }
    if (best) {
      take(best);
      usedS.add(s);
      matched.push({ s, l: best, via: 'amount+time' });
    }
  }

  for (const s of stmt) if (!usedS.has(s)) unrec.push(s);
  return { matched, mismatch, unrec, ghost: pool };
}

// ---------------------------------------------------------------- report
function table(headers, rows) {
  const out = ['| ' + headers.join(' | ') + ' |', '|' + headers.map(() => '---').join('|') + '|'];
  for (const r of rows) out.push('| ' + r.join(' | ') + ' |');
  return out.join('\n');
}

function buildReport({ statementPath, ledgerPath, st, lg, res }) {
  const { matched, mismatch, unrec, ghost } = res;
  const stmt = st.records;
  const led = lg.records;
  const sum = (arr) => arr.reduce((t, x) => t + (typeof x === 'number' ? x : (x.amount ?? 0)), 0);
  const matchedKes = sum(matched.map((m) => ({ amount: m.s.amount })));
  const unrecKes = sum(unrec);
  const ghostKes = sum(ghost);
  const stmtTotal = sum(stmt);
  const ledTotal = sum(led);
  const viaCode = matched.filter((m) => m.via === 'code').length;

  const L = [];
  L.push('# Pochi reconciliation — statement vs ledger');
  L.push('');
  L.push(`- Generated: ${new Date().toISOString()}`);
  L.push(`- Statement: \`${statementPath}\` — ${stmt.length} credit line(s) considered` + (st.ignored ? `, ${st.ignored} ignored (withdrawals/failed/blank)` : ''));
  L.push(`- Ledger: \`${ledgerPath}\` — ${led.length} in-row(s) considered` + (lg.skippedOut ? `, ${lg.skippedOut} out-row(s) skipped` : ''));
  L.push('- Match rule: M-Pesa code first (full or ≥4-char suffix), then same amount within ±10 min (same Nairobi day when one side has no time-of-day).');
  L.push('');
  L.push('## Totals per bucket');
  L.push('');
  L.push(table(
    ['Bucket', 'Count', 'KES'],
    [
      ['**MATCHED** (statement ↔ ledger agree)', String(matched.length), kes(matchedKes)],
      ['**UNRECORDED** (statement only — lost revenue)', String(unrec.length), kes(unrecKes)],
      ['**GHOST** (ledger only)', String(ghost.length), kes(ghostKes)],
      ['**AMOUNT MISMATCH** (same code, different KES)', String(mismatch.length), `stmt ${mismatch.length ? kes(sum(mismatch.map((m) => m.s.amount))) : '0'} / ledger ${mismatch.length ? kes(sum(mismatch.map((m) => m.l.amount))) : '0'}`],
    ],
  ));
  L.push('');
  L.push(`Statement credits **KES ${kes(stmtTotal)}** · Ledger in **KES ${kes(ledTotal)}** · Gap (statement − ledger) **KES ${kes(stmtTotal - ledTotal)}**`);
  L.push('');

  L.push('## UNRECORDED — money received, not in the ledger (append these rows)');
  L.push('');
  if (!unrec.length) L.push('_None._');
  else L.push(table(
    ['When (Nairobi)', 'M-Pesa code', 'KES', 'Paid in / details'],
    unrec.sort((a, b) => (a.ts ?? 0) - (b.ts ?? 0)).map((s) => [s.rawWhen || s.day || '?', s.code || '—', kes(s.amount), s.party || '—']),
  ));
  L.push('');

  L.push('## GHOST — in the ledger, no statement line (verify or void)');
  L.push('');
  if (!ghost.length) L.push('_None._');
  else L.push(table(
    ['When', 'M-Pesa code', 'Shop', 'KES', 'Note'],
    ghost.sort((a, b) => (a.ts ?? 0) - (b.ts ?? 0)).map((l) => [l.rawWhen || l.day || '?', l.code || '—', l.shop, kes(l.amount), l.note || '—']),
  ));
  L.push('');

  L.push('## AMOUNT MISMATCH — same M-Pesa code, different KES');
  L.push('');
  if (!mismatch.length) L.push('_None._');
  else L.push(table(
    ['M-Pesa code', 'Statement KES', 'Ledger KES', 'Delta', 'Statement when', 'Ledger when'],
    mismatch.map((m) => [m.s.code || m.l.code || '—', kes(m.s.amount), kes(m.l.amount), kes(m.s.amount - m.l.amount), m.s.rawWhen || m.s.day || '?', m.l.rawWhen || m.l.day || '?']),
  ));
  L.push('');

  L.push(`## MATCHED (${matched.length})`);
  L.push('');
  if (!matched.length) L.push('_None._');
  else L.push(table(
    ['When (Nairobi)', 'M-Pesa code', 'KES', 'Shop', 'Via'],
    matched
      .sort((a, b) => (a.s.ts ?? 0) - (b.s.ts ?? 0))
      .map((m) => [m.s.rawWhen || m.s.day || m.l.rawWhen || '?', m.s.code || m.l.code || '—', kes(m.s.amount), m.l.shop, m.via]),
  ));
  L.push('');
  L.push(`_Matched by code: ${viaCode} · by amount+time: ${matched.length - viaCode}._`);
  L.push('');
  return L.join('\n');
}

function summary({ statementPath, ledgerPath, st, lg, res }) {
  const { matched, mismatch, unrec, ghost } = res;
  const stmt = st.records;
  const led = lg.records;
  const sum = (arr) => arr.reduce((t, x) => t + (typeof x === 'number' ? x : (x.amount ?? 0)), 0);
  const mismatchStmt = sum(mismatch.map((m) => m.s.amount));
  const mismatchLed = sum(mismatch.map((m) => m.l.amount));
  const lines = [
    'reconcile-pochi — statement vs ledger',
    `  statement   ${statementPath}`,
    `  ledger      ${ledgerPath}`,
    `  considered  ${stmt.length} statement credit(s)${st.ignored ? ` (${st.ignored} ignored)` : ''} · ${led.length} ledger in-row(s)${lg.skippedOut ? ` (${lg.skippedOut} out skipped)` : ''}`,
    `  MATCHED          ${String(matched.length).padStart(4)}   KES ${kes(sum(matched.map((m) => m.s.amount)))}`,
    `  UNRECORDED       ${String(unrec.length).padStart(4)}   KES ${kes(sum(unrec))}   <- money received, NOT booked (lost revenue)`,
    `  GHOST            ${String(ghost.length).padStart(4)}   KES ${kes(sum(ghost))}   <- booked, no statement line`,
    `  AMOUNT MISMATCH  ${String(mismatch.length).padStart(4)}   statement KES ${kes(mismatchStmt)} vs ledger KES ${kes(mismatchLed)}`,
  ];
  return lines.join('\n');
}

// ---------------------------------------------------------------- main
function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || args.h) { usage(); return; }

  const statementPath = str(args.statement);
  const ledgerPath = str(args.ledger);
  if (!statementPath || !ledgerPath) {
    console.log('reconcile-pochi: missing input.\n');
    usage();
    return;
  }
  if (!existsSync(statementPath)) { console.log(`no data yet — statement CSV not found: ${statementPath}`); return; }
  if (!existsSync(ledgerPath)) { console.log(`no data yet — ledger CSV not found: ${ledgerPath}`); return; }

  const st = readStatement(statementPath);
  if (st.error) { console.log(`reconcile-pochi: ${st.error}`); return; }
  const lg = readLedger(ledgerPath);
  if (lg.error) { console.log(`reconcile-pochi: ${lg.error}`); return; }

  const res = reconcile(st.records, lg.records);
  const report = buildReport({ statementPath, ledgerPath, st, lg, res });

  const out = str(args.out);
  if (out) {
    try {
      writeFileSync(out, report, 'utf8');
    } catch (e) {
      console.log(`could not write report to ${out}: ${e.message} — printing to stdout instead.`);
    }
  }

  console.log(summary({ statementPath, ledgerPath, st, lg, res }));
  if (out && existsSync(out)) {
    console.log(`  report       ${out}`);
  } else {
    console.log('  report       (stdout below — pass --out report.md to write a file)');
    console.log('');
    console.log(report);
  }
}

try {
  main();
} catch (e) {
  console.log(`reconcile-pochi: unexpected error: ${e?.message || e}`);
}
process.exit(0);
