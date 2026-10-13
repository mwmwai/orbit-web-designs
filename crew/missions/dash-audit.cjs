const fs = require('fs');
const vm = require('vm');

const file = process.argv[2];
const html = fs.readFileSync(file, 'utf8');
const src = html.match(/<script>([\s\S]*?)<\/script>/)[1];

function mkEl(id) {
  const e = {
    id, _t: '', _h: '', className: '', disabled: false, title: '', value: '',
    dataset: {}, onclick: null, href: '', download: '',
    classList: (() => {
      const s = new Set();
      return {
        add: (...c) => c.forEach(x => s.add(x)),
        remove: (...c) => c.forEach(x => s.delete(x)),
        toggle: (c, f) => { if (f === undefined) { s.has(c) ? s.delete(c) : s.add(c); } else { f ? s.add(c) : s.delete(c); } },
        contains: c => s.has(c)
      };
    })(),
    addEventListener() {}, querySelector() { return mkEl('span'); },
    closest() { return null; }, click() {}, remove() {}, appendChild() {}
  };
  Object.defineProperty(e, 'textContent', { get: () => e._t, set: v => { e._t = String(v); } });
  Object.defineProperty(e, 'innerHTML', { get: () => e._h, set: v => { e._h = String(v); } });
  return e;
}

const fails = [];
const ok = (name, cond, extra) => { console.log((cond ? '  PASS  ' : '  FAIL  ') + name + (extra ? '  [' + extra + ']' : '')); if (!cond) fails.push(name); };

async function run(label, resp, fn) {
  const els = {};
  const get = id => (els[id] || (els[id] = mkEl(id)));
  const keys = ['date', 'shop', 'type', 'amount', 'method', 'note', 'mpesa_code'];
  const ths = keys.map(k => { const t = mkEl('th'); t.dataset.k = k; return t; });
  const thead = mkEl('thead');
  const document = {
    getElementById: get,
    querySelectorAll: sel => (sel === 'th.sortable' ? ths : []),
    querySelector: sel => (sel === 'thead' ? thead : mkEl('x')),
    createElement: tag => mkEl(tag),
    body: { appendChild() {} },
    hidden: false
  };
  const blobs = [];
  class FakeBlob { constructor(parts, opts) { this.parts = parts; this.opts = opts; blobs.push(this); } }
  const sandbox = {
    document, console,
    fetch: async () => resp,
    URL: { createObjectURL: () => 'blob:x', revokeObjectURL() {} },
    Blob: FakeBlob,
    setInterval: () => 0, setTimeout: () => 0, clearTimeout: () => {}
  };
  const ctx = vm.createContext(sandbox);
  vm.runInContext(src, ctx, { filename: 'dashboard-inline.js' });
  await new Promise(r => setTimeout(r, 60));
  console.log('\n== ' + label + ' ==');
  await fn({ ctx, els, blobs, get });
}

const J = o => JSON.stringify(o);

(async () => {
  // --- 503 (the live backend state right now) ---
  await run('HTTP 503 - /api/transactions env unset', {
    status: 503, text: async () => J({ ok: false, error: 'Server not configured (supabase env missing)' })
  }, async ({ ctx, els }) => {
    ok('banner class = banner b-warn', els.banner.className === 'banner b-warn', els.banner.className);
    ok('banner tag = Not configured', els.bannerTag.textContent === 'Not configured', els.bannerTag.textContent);
    ok('banner text says backend not configured', /not configured/i.test(els.bannerText.textContent), els.bannerText.textContent);
    ok('banner detail carries server error', /supabase env missing/.test(els.bannerDetail.textContent), els.bannerDetail.textContent);
    ok('retry + sample actions rendered', /retry/.test(els.bannerAct._h) && /sample/.test(els.bannerAct._h));
    ok('export button NOT disabled (live mode)', els.exportBtn.disabled === false);
    ok('footer records HTTP 503', /HTTP 503/.test(els.upd.textContent), els.upd.textContent);
    ok('KPI shows placeholder, not invented numbers', els.kTodayIn.textContent === '—' && els.kCount.textContent === '—', els.kTodayIn.textContent + '/' + els.kCount.textContent);
    ok('no fabricated totals in subs', /no ledger data loaded/.test(els.kTodaySub.textContent), els.kTodaySub.textContent);

    // sample toggle must disable export
    ctx.toggleSample(true);
    ok('SAMPLE on -> exportBtn.disabled = true', els.exportBtn.disabled === true);
    ok('SAMPLE on -> button label updated', els.sampleBtn.textContent === 'SAMPLE DATA: on', els.sampleBtn.textContent);
    ok('SAMPLE on -> banner class = b-sample', /b-sample/.test(els.banner.className), els.banner.className);
    ok('SAMPLE on -> banner warns NOT real money', /NOT real money/.test(els.bannerText.textContent), els.bannerText.textContent);
    ok('SAMPLE on -> export guard blocks CSV', (ctx.exportCsv(), true) && false || els.toast.textContent === 'Export disabled while SAMPLE DATA is on', els.toast.textContent);
    ok('SAMPLE on -> sample rows rendered in table', /Counter sale|— sample/.test(els.rows.innerHTML), els.rows.innerHTML.slice(0, 60));
    ok('SAMPLE on -> KPIs filled from sample', /^KSh /.test(els.kTodayIn.textContent), els.kTodayIn.textContent);
    ok('SAMPLE on -> balance labelled sample', /sample value/.test(els.kBalSub.textContent), els.kBalSub.textContent);

    ctx.toggleSample(false);
    await new Promise(r => setTimeout(r, 60));
    ok('SAMPLE off -> exportBtn re-enabled', els.exportBtn.disabled === false);
    ok('SAMPLE off -> reload returns to 503 banner', els.bannerTag.textContent === 'Not configured', els.bannerTag.textContent);
  });

  // --- 200 ---
  await run('HTTP 200 - live rows', {
    status: 200, text: async () => J({
      ok: true,
      rows: [
        { date: '2026-10-12', shop: 'Aggmart', type: 'in', amount: 1500, method: 'Till Number', category: 'Sales', note: 'Sale, "big" day', mpesa_code: 'QWERTY1234' },
        { date: '2026-10-11', shop: 'Trade Star Shop', type: 'out', amount: 400, method: 'Cash', category: 'Transport', note: '=cmd|calc', mpesa_code: null }
      ],
      total: 2, limit: 1000,
      summary: { Aggmart: { in: 1500, out: 0, profit: 1500, count: 1 } },
      latestBalance: 48200
    })
  }, async ({ ctx, els, blobs }) => {
    ok('banner class = banner b-live', els.banner.className === 'banner b-live', els.banner.className);
    ok('banner tag = Live', els.bannerTag.textContent === 'Live', els.bannerTag.textContent);
    ok('banner text reports row count', /Connected — 2 rows loaded/.test(els.bannerText.textContent), els.bannerText.textContent);
    ok('footer records HTTP 200', /HTTP 200/.test(els.upd.textContent), els.upd.textContent);
    ok('KES format = "KSh " + toLocaleString(en-KE)', els.kBal.textContent === 'KSh ' + Number(48200).toLocaleString('en-KE'), els.kBal.textContent);
    ok('KPI windows formatted', /^KSh /.test(els.k7In.textContent), els.k7In.textContent);
    ok('table row rendered with +/- and no KSh prefix', /\+1,?500/.test(els.rows.innerHTML) && !/\+KSh/.test(els.rows.innerHTML));
    ok('HTML-escapes quotes in notes', /Sale, &quot;big&quot; day/.test(els.rows.innerHTML));
    ok('empty shop card path not hit', /Aggmart/.test(els.shopCards.innerHTML));

    // CSV escaping
    ctx.exportCsv();
    ok('CSV export produced a blob', blobs.length === 1);
    const csv = blobs.length ? blobs[0].parts.join('') : '';
    ok('CSV doubles embedded quotes', csv.includes('"Sale, ""big"" day"'), JSON.stringify(csv.split('\r\n')[2] || ''));
    ok('CSV neutralizes formula injection', csv.includes("'=cmd|calc"), csv.includes("'=cmd|calc") ? 'yes' : 'no');
    ok('CSV keeps header + BOM', csv.startsWith('\ufeffdate,shop,type,amount'), csv.slice(0, 24));
    ok('CSV has no raw CRLF inside cells', !/[^\r]\n[^\r]/.test(csv));
    ok('toast confirms row count', /CSV downloaded \(2 rows\)/.test(els.toast.textContent), els.toast.textContent);
  });

  // --- 401 / 404 ---
  await run('HTTP 401', { status: 401, text: async () => J({ ok: false, error: 'owner token required' }) },
    async ({ els }) => {
      ok('401 -> b-warn + Sign-in required', /b-warn/.test(els.banner.className) && els.bannerTag.textContent === 'Sign-in required', els.banner.className + '/' + els.bannerTag.textContent);
      ok('401 detail propagated', /owner token required/.test(els.bannerDetail.textContent), els.bannerDetail.textContent);
    });

  await run('HTTP 404', { status: 404, text: async () => 'not found' },
    async ({ els }) => {
      ok('404 -> b-err + API unreachable', /b-err/.test(els.banner.className) && /404/.test(els.bannerText.textContent), els.banner.className + '/' + els.bannerText.textContent);
    });

  await run('network error (server down)', { status: 0, text: async () => { throw new Error('fetch failed'); } },
    async ({ els }) => {
      ok('netErr -> b-err + unreachable', /b-err/.test(els.banner.className) && /Cannot reach/.test(els.bannerText.textContent), els.bannerText.textContent);
      ok('netErr detail hints at 8390', /127\.0\.0\.1:8390/.test(els.bannerDetail.textContent), els.bannerDetail.textContent);
    });

  // --- refresh guard: background refresh already in flight ---
  await run('refresh clicked while load in flight', {
    status: 200, text: () => new Promise(() => {}) // never resolves -> loading stays true
  }, async ({ els }) => {
    ok('initial load still pending (banner = Loading)', els.bannerTag.textContent === 'Loading', els.bannerTag.textContent);
    ok('refreshBtn disabled while in flight', els.refreshBtn.disabled === true);
    els.refreshBtn.onclick();
    ok('click during in-flight load gives feedback (no silent no-op)', /already in progress/.test(els.toast.textContent), els.toast.textContent);
  });

  console.log('\n' + (fails.length ? 'FAILURES: ' + fails.length + '\n - ' + fails.join('\n - ') : 'ALL CHECKS PASSED'));
  process.exit(fails.length ? 1 : 0);
})();
