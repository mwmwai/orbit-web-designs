// Temporary instrumentation: replicates server.mjs rawBody/adapt exactly, with event tracing.
import http from 'node:http';

function dbg(...a) { console.log('[dbg]', ...a); }

function rawBody(req) {
  return new Promise((resolve) => {
    let data = '';
    let done = false;
    const finish = (why) => { if (!done) { done = true; dbg('rawBody finish via', why, 'len=', data.length); resolve(data); } };
    if (req.readableEnded || req.destroyed) { dbg('rawBody already-ended complete=', req.complete); resolve(''); return; }
    req.on('data', (c) => { dbg('rawBody data', c.length); if (data.length < 1_000_000) data += c; });
    req.on('end', () => finish('end'));
    req.on('error', (e) => finish('error:' + (e && e.message)));
    req.on('aborted', () => finish('aborted'));
    req.on('close', () => finish('close'));
    dbg('rawBody start', req.method, req.url, 'complete=', req.complete, 'readableEnded=', req.readableEnded, 'destroyed=', req.destroyed);
  });
}

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
      dbg('adapt respond', code, JSON.stringify(payload));
      res.writeHead(code, { 'Content-Type': 'application/json' });
      res.end(payload === null || payload === undefined ? '' : (typeof payload === 'string' ? payload : JSON.stringify(payload)));
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
      send();
    } catch (e) {
      code = 500; payload = { ok: false, error: String(e) }; send();
    }
  });
}

// Mimics confirmation.js readJson exactly
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

const handler = async (req, res) => {
  let body = {};
  try { body = await readJson(req); } catch { body = {}; }
  if (!body || typeof body !== 'object' || Array.isArray(body)) body = {};
  const code = String(body.TransID || '').trim().toUpperCase();
  res.status(code ? 200 : 503).json({ gotCode: code || null, bodyKeys: Object.keys(body) });
};

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://127.0.0.1');
  try {
    await adapt(handler, req, res, url);
  } catch (e) {
    console.error('dispatch error', e);
    if (!res.headersSent) { res.writeHead(500); res.end(); }
  }
});
server.listen(8391, '127.0.0.1', () => console.log('probe on 8391'));
