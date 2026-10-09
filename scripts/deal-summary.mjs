#!/usr/bin/env node
/**
 * deal-summary.mjs — Orbit Web Designs Deal Log summariser.
 * Zero dependencies, Windows-safe (no bash-isms), works from any cwd.
 *
 * Usage:  node scripts/deal-summary.mjs
 * Reads:  deal-log.csv (repo root)
 * Prints: weekly + monthly totals — deals by outcome, cash collected
 *         (deposit + balance), split deposit vs balance, by tier,
 *         pipeline value of 'quoted' rows, win rate and DSO.
 */
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const candidates = [
  path.join(scriptDir, '..', 'deal-log.csv'),
  path.join(process.cwd(), 'deal-log.csv'),
];

const COLUMNS = [
  'date', 'client', 'tier', 'quote_kes', 'deposit_kes',
  'balance_kes', 'mpesa_ref', 'source', 'outcome', 'notes',
];
const KNOWN_OUTCOMES = ['quoted', 'deposit_paid', 'delivered', 'balance_paid', 'lost'];
const CASH_OUTCOMES = new Set(['deposit_paid', 'delivered', 'balance_paid']);

// ---------------------------------------------------------------- CSV parsing
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

function toNumber(value) {
  if (value == null) return 0;
  const n = Number(String(value).replace(/[^0-9.\-]/g, ''));
  return Number.isFinite(n) ? n : 0;
}

function parseDate(value) {
  const s = String(value || '').trim();
  let m = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(s);
  if (m) return makeDate(+m[1], +m[2], +m[3]);
  m = /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})/.exec(s); // day-first fallback
  if (m) return makeDate(+m[3], +m[2], +m[1]);
  return null;
}

function makeDate(y, mo, d) {
  const dt = new Date(Date.UTC(y, mo - 1, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== mo - 1 || dt.getUTCDate() !== d) return null;
  return dt;
}

const isoDate = (dt) => dt.toISOString().slice(0, 10);

function mondayOf(dt) {
  const d = new Date(dt.getTime());
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
  return d;
}

// 'paid 2026-10-10' / 'paid:2026-10-10' in notes = when full payment landed (DSO).
function paidDate(notes) {
  const m = /\bpaid\s*[:=]?\s*(\d{4}-\d{1,2}-\d{1,2})\b/i.exec(String(notes || ''));
  return m ? parseDate(m[1]) : null;
}

// ------------------------------------------------------------- aggregation
function blank() {
  const outcomes = { quoted: 0, deposit_paid: 0, delivered: 0, balance_paid: 0, lost: 0, other: 0 };
  return {
    deals: 0, outcomes, cash: 0, dep: 0, bal: 0, pipeline: 0, pipelineN: 0,
    tiers: {}, dsoSum: 0, dsoN: 0, outstanding: 0, undated: 0,
  };
}

function add(acc, rec) {
  acc.deals++;
  const outcome = rec.outcome;
  if (KNOWN_OUTCOMES.includes(outcome)) acc.outcomes[outcome]++;
  else acc.outcomes.other++;

  if (CASH_OUTCOMES.has(outcome)) {
    acc.dep += rec.deposit_kes;
    acc.bal += rec.balance_kes;
    acc.cash += rec.deposit_kes + rec.balance_kes;
  }

  const tier = rec.tier ? titleCase(rec.tier) : '(no tier)';
  acc.tiers[tier] = (acc.tiers[tier] || 0) + 1;

  if (outcome === 'quoted') {
    acc.pipeline += rec.quote_kes;
    acc.pipelineN++;
  }

  if (outcome === 'deposit_paid' || outcome === 'delivered' || outcome === 'quoted') {
    const due = rec.quote_kes - rec.deposit_kes - rec.balance_kes;
    if (due > 0) acc.outstanding += due;
  }

  if (outcome === 'balance_paid') {
    const paid = paidDate(rec.notes);
    if (paid && rec.date) {
      const days = Math.round((paid.getTime() - rec.date.getTime()) / 86400000);
      if (days >= 0) { acc.dsoSum += days; acc.dsoN++; }
    }
  }
}

function titleCase(s) {
  return s.replace(/\s+/g, ' ').trim().replace(/\b[a-z]/g, (c) => c.toUpperCase());
}

const kes = (n) => 'KES ' + Math.round(n).toLocaleString('en-US');
const winRate = (o) => {
  const won = o.deposit_paid + o.delivered + o.balance_paid;
  const closed = won + o.lost;
  return closed ? `${Math.round((won / closed) * 100)}% (${won} won / ${closed} closed)` : `n/a (${won} won, 0 lost)`;
};
const outcomeLine = (o) => KNOWN_OUTCOMES.map((k) => `${k} ${o[k]}`).join(', ') + (o.other ? `, other ${o.other}` : '');
const tierLine = (t) => Object.entries(t).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}`).join(', ') || '-';

function printBlock(label, acc) {
  const dso = acc.dsoN ? `${(acc.dsoSum / acc.dsoN).toFixed(1)} days (n=${acc.dsoN})` : 'n/a (needs "paid YYYY-MM-DD" in notes)';
  console.log(`  ${label}`);
  console.log(`    deals           ${acc.deals}  |  ${outcomeLine(acc.outcomes)}`);
  console.log(`    cash collected  ${kes(acc.cash)}  (deposits ${kes(acc.dep)} / balances ${kes(acc.bal)})`);
  console.log(`    pipeline        ${kes(acc.pipeline)} from ${acc.pipelineN} quoted  |  balance still due on open deals ${kes(acc.outstanding)}`);
  console.log(`    by tier         ${tierLine(acc.tiers)}`);
}

// ---------------------------------------------------------------- main
function main() {
  const file = candidates.find((p) => existsSync(p));
  if (!file) {
    console.error('deal-log.csv not found. Looked in:\n  ' + candidates.join('\n  '));
    process.exitCode = 1;
    return;
  }

  const rows = parseCsv(readFileSync(file, 'utf8'));
  if (rows.length === 0) {
    console.log('no deals yet — deal-log.csv is empty.');
    return;
  }

  const header = rows[0].map((h) => h.trim().toLowerCase());
  const idx = {};
  for (const col of COLUMNS) idx[col] = header.indexOf(col);
  if (idx.date < 0 || idx.outcome < 0) {
    console.error('deal-log.csv header is missing required columns (date, outcome). Nothing to summarise.');
    process.exitCode = 1;
    return;
  }

  const records = [];
  for (const row of rows.slice(1)) {
    if (!row.some((v) => String(v).trim() !== '')) continue; // skip blank lines
    const get = (col) => (idx[col] >= 0 && idx[col] < row.length ? String(row[idx[col]] ?? '').trim() : '');
    records.push({
      date: parseDate(get('date')),
      dateRaw: get('date'),
      tier: get('tier'),
      quote_kes: toNumber(get('quote_kes')),
      deposit_kes: toNumber(get('deposit_kes')),
      balance_kes: toNumber(get('balance_kes')),
      outcome: get('outcome').toLowerCase().replace(/[\s-]+/g, '_'),
      notes: get('notes'),
    });
  }

  console.log(`DEAL LOG SUMMARY — ${path.basename(file)}`);

  if (records.length === 0) {
    console.log('\nno deals yet — header only. Nothing has closed.');
    return;
  }

  // ---- all time
  const all = blank();
  for (const rec of records) add(all, rec);
  const o = all.outcomes;
  console.log(`\n=== ALL TIME (${all.deals} deals) ===`);
  console.log(`  deals           ${all.deals}  |  ${outcomeLine(o)}`);
  console.log(`  cash collected  ${kes(all.cash)}  (deposits ${kes(all.dep)} / balances ${kes(all.bal)})`);
  console.log(`  win rate        ${winRate(o)}  |  open (quoted) ${o.quoted}`);
  console.log(`  by tier         ${tierLine(all.tiers)}`);
  console.log(`  pipeline        ${kes(all.pipeline)} from ${all.pipelineN} quoted`);
  console.log(`  DSO             ${all.dsoN ? (all.dsoSum / all.dsoN).toFixed(1) + ' days (n=' + all.dsoN + ')' : 'n/a — log "paid YYYY-MM-DD" in notes on balance_paid rows'}`);
  if (all.outcomes.other) console.log(`  WARNING         ${all.outcomes.other} row(s) with an unrecognised outcome: expected ${KNOWN_OUTCOMES.join('/')}`);

  // ---- weekly + monthly buckets
  const weeks = new Map();
  const months = new Map();
  const undated = blank();
  for (const rec of records) {
    if (!rec.date) { add(undated, rec); continue; }
    const wk = isoDate(mondayOf(rec.date));
    const mo = isoDate(rec.date).slice(0, 7);
    if (!weeks.has(wk)) weeks.set(wk, blank());
    if (!months.has(mo)) months.set(mo, blank());
    add(weeks.get(wk), rec);
    add(months.get(mo), rec);
  }

  if (weeks.size) {
    console.log('\n=== WEEKLY (Mon–Sun) ===');
    for (const key of [...weeks.keys()].sort()) printBlock(`week of ${key}`, weeks.get(key));
  }
  if (months.size) {
    console.log('\n=== MONTHLY ===');
    for (const key of [...months.keys()].sort()) printBlock(key, months.get(key));
  }
  if (undated.deals) {
    console.log('\n=== UNDATED (fix the date column) ===');
    printBlock(`${undated.deals} row(s) with an unreadable date`, undated);
  }
}

main();
