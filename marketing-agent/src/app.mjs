import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {randomUUID} from 'node:crypto';
import {
  DIRS,
  OUT_DIR,
  ROOT,
  ensureDirs,
  findDraft,
  listQueue,
  moveDraft,
  readJson,
  writeJson
} from './lib.mjs';

ensureDirs();

const PORT = Number(process.env.PORT) || 4780;
const PUBLIC_DIR = path.join(ROOT, 'public');
const MIME = {
  '.json': 'application/json',
  '.js': 'text/javascript',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.html': 'text/html',
  '.mp3': 'audio/mpeg'
};
const jobs = new Map();

function runJob(label, args) {
  const id = randomUUID().slice(0, 8);
  const job = {id, label, status: 'running', log: ''};
  jobs.set(id, job);
  const child = spawn(process.execPath, args, {
    cwd: ROOT,
    env: {...process.env, ELECTRON_RUN_AS_NODE: '1'}
  });
  const push = (chunk) => {
    job.log += chunk.toString();
    if (job.log.length > 8000) job.log = job.log.slice(-8000);
  };
  child.stdout.on('data', push);
  child.stderr.on('data', push);
  child.on('close', (code) => {
    job.status = code === 0 ? 'done' : 'failed';
    job.code = code;
  });
  return job;
}

function readBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', (c) => (body += c));
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        resolve({});
      }
    });
  });
}

const json = (res, data, status = 200) => {
  res.writeHead(status, {'Content-Type': 'application/json'});
  res.end(JSON.stringify(data));
};

function draftsIn(dir, status) {
  return listQueue(dir)
    .map((f) => readJson(path.join(dir, f)))
    .filter((d) => !status || d.status === status);
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://127.0.0.1:${PORT}`);

  if (req.method === 'GET' && url.pathname === '/') {
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.end(fs.readFileSync(path.join(ROOT, 'src', 'app.html')));
    return;
  }

  if (req.method === 'GET' && !url.pathname.startsWith('/api/') && !url.pathname.startsWith('/video/')) {
    const rel = path.normalize(decodeURIComponent(url.pathname)).replace(/^([/\\])+/, '');
    const file = path.join(PUBLIC_DIR, rel);
    if (file.startsWith(PUBLIC_DIR) && fs.existsSync(file) && fs.statSync(file).isFile()) {
      res.writeHead(200, {'Content-Type': MIME[path.extname(file)] ?? 'application/octet-stream'});
      fs.createReadStream(file).pipe(res);
      return;
    }
  }

  if (req.method === 'GET' && url.pathname.startsWith('/video/')) {
    const name = path.basename(url.pathname);
    const file = path.join(OUT_DIR, name);
    if (!fs.existsSync(file)) return json(res, {error: 'not found'}, 404);
    res.writeHead(200, {'Content-Type': 'video/mp4', 'Accept-Ranges': 'none'});
    fs.createReadStream(file).pipe(res);
    return;
  }

  if (req.method === 'GET' && url.pathname === '/api/drafts') {
    return json(res, {
      pending: draftsIn(DIRS.pending, 'pending'),
      approved: draftsIn(DIRS.approved).filter((d) => ['approved', 'rendered', 'packaged'].includes(d.status)),
      posted: draftsIn(DIRS.posted),
      rejected: draftsIn(DIRS.rejected)
    });
  }

  if (req.method === 'GET' && url.pathname === '/api/jobs') {
    return json(res, [...jobs.values()].slice(-20));
  }

  if (req.method === 'POST' && url.pathname === '/api/generate') {
    const {count} = await readBody(req);
    const job = runJob('generate', [path.join(ROOT, 'src', 'generate.mjs'), '--count', String(count || 2)]);
    return json(res, {started: job.id});
  }

  if (req.method === 'POST' && url.pathname === '/api/approve') {
    const {id} = await readBody(req);
    const file = findDraft(id);
    if (!file || !file.includes('pending')) return json(res, {error: 'not pending'}, 400);
    const draft = readJson(file);
    draft.status = 'approved';
    writeJson(file, draft);
    moveDraft(file, DIRS.approved);
    return json(res, {ok: true});
  }

  if (req.method === 'POST' && url.pathname === '/api/reject') {
    const {id} = await readBody(req);
    const file = findDraft(id);
    if (!file || !file.includes('pending')) return json(res, {error: 'not pending'}, 400);
    const draft = readJson(file);
    draft.status = 'rejected';
    moveDraft(file, DIRS.rejected);
    return json(res, {ok: true});
  }

  if (req.method === 'POST' && url.pathname === '/api/edit') {
    const {id, patch} = await readBody(req);
    const file = findDraft(id);
    if (!file) return json(res, {error: 'not found'}, 404);
    const draft = readJson(file);
    if (typeof patch.caption === 'string') draft.caption = patch.caption;
    if (typeof patch.title === 'string') draft.title = patch.title;
    writeJson(file, draft);
    return json(res, {ok: true});
  }

  if (req.method === 'POST' && url.pathname === '/api/render') {
    const {id} = await readBody(req);
    const file = findDraft(id);
    if (!file || !file.includes('approved')) return json(res, {error: 'not approved'}, 400);
    if ([...jobs.values()].some((j) => j.status === 'running' && j.label !== 'generate'))
      return json(res, {error: 'another render/publish job is running'}, 409);
    const job = runJob(`render ${id}`, [path.join(ROOT, 'src', 'render.mjs'), id]);
    return json(res, {started: job.id});
  }

  if (req.method === 'POST' && url.pathname === '/api/publish') {
    const {id} = await readBody(req);
    const file = findDraft(id);
    if (!file || !file.includes('approved')) return json(res, {error: 'not approved'}, 400);
    const draft = readJson(file);
    if (draft.status !== 'rendered') return json(res, {error: 'render first'}, 400);
    const job = runJob(`publish ${id}`, [path.join(ROOT, 'src', 'publish.mjs'), id]);
    return json(res, {started: job.id});
  }

  json(res, {error: 'no route'}, 404);
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`marketing-agent app: http://127.0.0.1:${PORT}`);
  const nets = os.networkInterfaces();
  for (const list of Object.values(nets)) {
    for (const n of list ?? []) {
      if (n.family === 'IPv4' && !n.internal) {
        console.log(`from your phone:     http://${n.address}:${PORT}`);
      }
    }
  }
});
