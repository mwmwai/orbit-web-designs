// Local money app runner — mounts money-api/* + serves the shop-tracker admin UI.
// Owner override (Oct 6): money never serves from the public domain.
// This binds 127.0.0.1 ONLY. Zero dependencies.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = Number(process.env.MONEY_APP_PORT) || 8390;
const LOG = path.join(path.dirname(fileURLToPath(import.meta.url)), 'health.log');

// Load .env without dependencies (never override existing vars).
try {
  for (const line of fs.readFileSync(path.join(ROOT, '.env'), 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2];
  }
} catch {}

const ROUTES = [
  ['GET,POST', '/api/transactions', 'money-api/transactions.js'],
  ['POST', '/api/mpesa/c2b/validation', 'money-api/mpesa/c2b/validation.js'],
  ['POST', '/api/mpesa/c2b/confirmation', 'money-api/mpesa/c2b/confirmation.js'],
  ['POST', '/api/ingest/sms', 'money-api/ingest/sms.js'],
];

const handlers = {};
for (const [, urlPath, rel] of ROUTES) {
  handlers[urlPath] = (await import(pathToFileURL(path.join(ROOT, rel)).href)).default;
}

const ENV_KEYS = ['PUBLIC_SUPABASE_URL', 'PUBLIC_SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY', 'INGEST_SECRET', 'TILL_SHOP_MAP', 'POCHI_SHOP_MAP', 'MPESA_CALLBACK_TOKEN'];
function envReport() {
  const out = {};
  for (const k of ENV_KEYS) out[k] = process.env[k] ? 'set' : 'missing';
  return out;
}

const DEBUG = process.env.MONEY_DEBUG === '1';
function dbg(...a) { if (DEBUG) console.log('[dbg]', ...a); }

function rawBody(req) {
  return new Promise((resolve) => {
    const chunks = [];
    let size = 0;
    let done = false;
    // Regression tripwire: a POST whose body never arrives was the original
    // adapter bug (handlers saw "" -> malformed-ack). Always shout about it.
    const expected = Number(req.headers['content-length']);
    const finish = (why) => {
      if (done) return;
      done = true;
      // Concat as Buffers then decode once: `data += c` used to decode each
      // chunk separately, corrupting multi-byte UTF-8 split across chunks.
      const data = Buffer.concat(chunks).toString('utf8');
      dbg('rawBody finish via', why, 'len=', data.length);
      if (Number.isFinite(expected) && expected > 0 && Buffer.byteLength(data, 'utf8') < expected) {
        console.warn(`rawBody TRUNCATED ${req.method} ${req.url}: got ${Buffer.byteLength(data, 'utf8')} of ${expected} bytes (${why})`);
      }
      resolve(data);
    };
    if (req.readableEnded || req.destroyed) { dbg('rawBody already-ended complete=', req.complete); resolve(''); return; }
    req.on('data', (c) => { dbg('rawBody data', c.length); if (size < 1_000_000) { chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)); size += c.length; } });
    req.on('end', () => finish('end'));
    // Client aborts / socket errors mid-upload must not strand the adapter
    // promise (would leak the request and never answer the client).
    req.on('error', (e) => finish('error:' + (e && e.message)));
    req.on('aborted', () => finish('aborted'));
    req.on('close', () => finish('close'));
    dbg('rawBody start', req.method, req.url, 'complete=', req.complete, 'readableEnded=', req.readableEnded);
  });
}

// Vercel-style req/res shim so api handlers run unmodified.
function adapt(handler, req, res, url) {
  return new Promise(async (resolve) => {
    const r = {
      method: req.method,
      url: req.url,
      query: Object.fromEntries(url.searchParams),
      headers: req.headers,
      body: ['GET', 'HEAD'].includes(req.method) ? undefined : await rawBody(req),
    };
    let code = 200, payload = null, sent = false;
    const outHeaders = {};
    dbg('adapt r.body type=', typeof r.body, 'value=', typeof r.body === 'string' ? JSON.stringify(r.body.slice(0, 200)) : r.body);
    const send = () => {
      if (sent) return; sent = true;
      dbg('adapt respond', code, typeof payload === 'string' ? payload.slice(0, 200) : JSON.stringify(payload));
      const body = payload === null || payload === undefined ? '' : (typeof payload === 'string' ? payload : JSON.stringify(payload));
      if (!('Content-Type' in outHeaders)) {
        outHeaders['Content-Type'] = typeof payload === 'string' ? 'text/plain; charset=utf-8' : 'application/json; charset=utf-8';
      }
      res.writeHead(code, outHeaders);
      res.end(body);
      resolve();
    };
    const rv = {
      status(c) { code = c; return rv; },
      json(o) { payload = o; send(); return rv; },
      send(o) { payload = o; send(); return rv; },
      setHeader(k, v) { if (k && v !== undefined) outHeaders[String(k)] = v; },
      end() { send(); },
    };
    try {
      await handler(r, rv);
      send(); // handler returned without responding (defensive)
    } catch (e) {
      console.error('runner handler error:', e?.stack || e);
      code = 500; payload = { ok: false, error: 'Internal server error' }; send();
    }
  });
}

function heartbeat(ok, detail) {
  try { fs.appendFileSync(LOG, `${new Date().toISOString()} ok=${ok} ${detail}\n`); } catch {}
}

// Availability guard: Node's default for unhandledRejection is to throw, which
// kills the listener mid-flight and loses in-flight money POSTs. Handlers are
// per-request and stateless, so log + keep serving instead of crashing.
process.on('unhandledRejection', (e) => {
  console.error('unhandledRejection:', (e && e.stack) || e);
  heartbeat(false, 'unhandledRejection ' + ((e && e.message) || String(e)));
});

const server = http.createServer(async (req, res) => {
  let url;
  try {
    url = new URL(req.url, 'http://127.0.0.1');
  } catch {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'invalid request target' }));
    return;
  }
  if (url.pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true, app: 'orbit-money-local', uptime_s: Math.round(process.uptime()), env: envReport(), routes: ROUTES.map(([m, p]) => m + ' ' + p) }, null, 2));
    return;
  }
  if (url.pathname === '/' || url.pathname === '/index.html') {
    try {
      const html = fs.readFileSync(path.join(ROOT, 'shop-tracker', 'index.html'));
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(html);
    } catch { res.writeHead(500); res.end('shop-tracker UI missing'); }
    return;
  }
  if (url.pathname === '/dashboard' || url.pathname === '/dashboard.html') {
    try {
      const html = fs.readFileSync(path.join(ROOT, 'money-app', 'dashboard.html'));
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(html);
    } catch { res.writeHead(500); res.end('money-app dashboard missing'); }
    return;
  }
  const route = ROUTES.find(([, p]) => p === url.pathname);
  if (route) {
    if (!route[0].split(',').includes(req.method)) { res.writeHead(405, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: 'Method not allowed' })); return; }
    // An adapter-level rejection must never escape this callback: an unhandled
    // rejection terminates the process (money POSTs would be lost mid-flight).
    // Fail closed with 500 instead; the handler's own errors are caught inside adapt().
    try {
      await adapt(handlers[url.pathname], req, res, url);
    } catch (e) {
      console.error('runner dispatch error:', e?.stack || e);
      if (!res.headersSent) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: 'Internal server error' }));
      } else if (!res.writableEnded) {
        res.end();
      }
    }
    return;
  }
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'not found', hint: '/health, /, /dashboard, /api/transactions' }));
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`orbit-money-local on http://127.0.0.1:${PORT} (UI /, dashboard /dashboard, health /health, api /api/*)`);
  heartbeat(true, 'server-start port=' + PORT);
});

// Port-busy (EADDRINUSE) and other listen errors: crash fast with a clear
// heartbeat instead of a raw uncaught stack — the watchdog sees the dead
// process and owns the retry loop.
server.on('error', (e) => {
  console.error('server error:', (e && e.stack) || e);
  heartbeat(false, 'server-error ' + ((e && e.code) || (e && e.message) || String(e)));
  process.exit(1);
});

// Autonomous self-monitor: probe own health every 10 min, heartbeat to health.log.
setInterval(async () => {
  try {
    const r = await fetch(`http://127.0.0.1:${PORT}/health`);
    const j = await r.json();
    const missing = Object.entries(j.env || {}).filter(([, v]) => v === 'missing').map(([k]) => k);
    heartbeat(r.ok, 'self-probe env_missing=' + (missing.join(',') || 'none'));
  } catch (e) { heartbeat(false, 'self-probe FAILED ' + e.message); }
}, 600_000);
