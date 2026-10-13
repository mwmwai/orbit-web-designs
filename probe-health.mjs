import fs from 'node:fs';
const out = [];
const log = (s) => { out.push(s); };
const target = process.argv[2] || 'http://127.0.0.1:8390/health';
const method = process.argv[3] || 'GET';
const body = process.argv[4];
const ac = new AbortController();
const timer = setTimeout(() => { log('TIMEOUT 5s'); fs.writeFileSync('probe-result.txt', out.join('\n')); process.exit(0); }, 5000);
try {
  const r = await fetch(target, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body || undefined,
    signal: ac.signal,
  });
  clearTimeout(timer);
  log('STATUS ' + r.status);
  log(await r.text());
} catch (e) {
  clearTimeout(timer);
  log('ERR ' + (e && e.message));
}
fs.writeFileSync('probe-result.txt', out.join('\n'));
process.exit(0);
