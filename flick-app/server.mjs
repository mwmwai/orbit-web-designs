import {createServer} from 'node:http';
import {spawn} from 'node:child_process';
import {readFile, mkdir, writeFile} from 'node:fs/promises';
import {existsSync, mkdirSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(here, '..');
const remotionDir = path.join(projectRoot, 'flick-output', 'remotion');
const runsDir = path.join(projectRoot, 'flick-output', 'app-runs');
const ffmpeg = path.join(remotionDir, 'node_modules', 'ffmpeg-static', 'ffmpeg.exe');

const jobs = new Map();
const SCENES = ['wasted-first-impression', 'three-second-exit', 'orbit-builds-better', 'design-speed-seo', 'orbit-outro'];

function run(command, opts = {}) {
  return new Promise((resolveP, rejectP) => {
    const child = spawn(command, {shell: true, ...opts});
    let err = '';
    child.stderr.on('data', (d) => (err += d));
    child.stdout.on('data', () => {});
    child.on('close', (code) => (code === 0 ? resolveP() : rejectP(new Error(err.slice(-600)))));
    child.on('error', rejectP);
  });
}

function mediaDuration(file) {
  return new Promise((resolveP) => {
    const child = spawn(`"${ffmpeg}" -i "${file}"`, {shell: true});
    let err = '';
    child.stderr.on('data', (d) => (err += d));
    child.on('close', () => {
      const m = err.match(/Duration:\s*(\d+):(\d+):([\d.]+)/);
      resolveP(m ? parseInt(m[1]) * 3600 + parseInt(m[2]) * 60 + parseFloat(m[3]) : 0);
    });
    child.on('error', () => resolveP(0));
  });
}

function posts(body, lines) {
  const g = (k, d) => (body[k] || '').trim() || d;
  const brand = g('brandName', 'Orbit Web Designs');
  const url = g('url', 'orbitwebdesigns.co.ke');
  const tagline = g('tagline', 'Your brand, in motion.');
  const hook = lines[0] || `${tagline}.`;
  const benefit = lines[2] || hook;
  const tags = '#webdesign #website #smallbusiness #webdevelopment #kenya';
  return {
    Instagram: `${hook}\n\n${benefit}\n\n${tagline}. Visit ${url} - link in bio.\n\n${tags}`,
    Facebook: `${hook}\n\n${benefit}\n\nWe build fast, modern websites that turn visitors into customers. ${tagline} - ${url}`,
    X: `${hook}\n\n${benefit}\n\n${url}\n\n#webdesign #website #smallbusiness`,
    LinkedIn: `${hook}\n\n${benefit}\n\nAt ${brand}, design, speed and SEO come as standard - not extras.\n\n${tagline}: ${url}`,
    TikTok: `${hook} ${tagline} ${url} ${tags}`,
  };
}

async function generate(jobId, body) {
  const g = (k, d) => (body[k] || '').trim() || d;
  const lines = (body.lines || []).map((l) => (l || '').trim());
  const props = [
    {title: g('hook', 'Your first impression'), caption: lines[0] || ''},
    {label: g('label', '3 SECONDS'), caption: lines[1] || ''},
    {brand: g('brandName', 'ORBIT').toUpperCase(), hero: g('hero', 'Websites that work.'), cta: g('cta', 'Get started'), caption: lines[2] || ''},
    {location: g('location', 'NAIROBI').toUpperCase(), caption: lines[3] || ''},
    {wordmark: g('brandName', 'ORBIT').toUpperCase(), wordSub: g('brandSub', 'WEB DESIGNS').toUpperCase(), tagline: g('tagline', 'Your brand, in motion.'), url: g('url', 'orbitwebdesigns.co.ke'), caption: lines[4] || ''},
  ];

  const outDir = path.join(runsDir, jobId);
  await mkdir(outDir, {recursive: true});

  for (let i = 0; i < SCENES.length; i++) {
    jobs.get(jobId).status = `Rendering scene ${i + 1} of 5...`;
    const mp4 = path.join(outDir, 'scenes', `${SCENES[i]}.mp4`);
    const propsFile = path.join(outDir, `props-${i}.json`);
    await writeFile(propsFile, JSON.stringify(props[i]));
    let lastErr = null;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        await run(`npx remotion render src/index.tsx ${SCENES[i]} "${mp4}" --props="${propsFile}"`, {cwd: remotionDir});
        lastErr = null;
        break;
      } catch (e) {
        lastErr = e;
        jobs.get(jobId).status = `Scene ${i + 1}: browser timed out, retrying (${attempt}/3)...`;
        await new Promise((r) => setTimeout(r, 5000));
      }
    }
    if (lastErr) throw lastErr;
  }

  jobs.get(jobId).status = 'Stitching final video...';

  // voiceover: one narration clip per script line, fitted to each scene's length
  const SCENE_SECONDS = [4, 4, 5, 4, 5];
  const voice = (body.voice || 'en-US-AndrewNeural').trim();
  const wantVoice = body.voiceover !== false;
  const narrated = [];
  for (let i = 0; i < SCENES.length; i++) {
    const sceneMp4 = path.join(outDir, 'scenes', `${SCENES[i]}.mp4`);
    const line = (lines[i] || '').trim();
    if (!wantVoice || !line) {
      narrated.push(sceneMp4);
      continue;
    }
    jobs.get(jobId).status = `Recording voiceover ${i + 1} of 5...`;
    const mp3 = path.join(outDir, `voice-${i}.mp3`);
    await run(`py -m edge_tts --voice "${voice}" --text "${String(line).replace(/"/g, '')}" --write-media "${mp3}"`);
    const dur = await mediaDuration(mp3);
    const limit = SCENE_SECONDS[i] - 0.15;
    let mixFilter;
    if (dur > limit) {
      const tempo = Math.min(dur / limit, 2);
      mixFilter = `[1:a]atempo=${tempo.toFixed(3)}[nar];[0:a][nar]amix=inputs=2:duration=first:dropout_transition=0[a]`;
    } else {
      mixFilter = `[0:a][1:a]amix=inputs=2:duration=first:dropout_transition=0[a]`;
    }
    const mixed = path.join(outDir, 'scenes', `narr-${SCENES[i]}.mp4`);
    await run(`"${ffmpeg}" -y -i "${sceneMp4}" -i "${mp3}" -filter_complex "${mixFilter}" -map 0:v -map "[a]" -c:v copy "${mixed}"`);
    narrated.push(mixed);
  }

  const concatList = narrated.map((f) => `file '${f.replace(/\\/g, '/')}'`).join('\n');
  await writeFile(path.join(outDir, 'concat.txt'), concatList);
  await run(`"${ffmpeg}" -y -f concat -safe 0 -i "${path.join(outDir, 'concat.txt')}" -c copy "${path.join(outDir, 'full.mp4')}"`);

  jobs.get(jobId).posts = posts(body, lines);
  jobs.get(jobId).done = true;
  jobs.get(jobId).status = 'Done';
}

const server = createServer(async (req, res) => {
  const parsed = new URL(req.url, 'http://x');

  if (req.method === 'GET' && parsed.pathname === '/') {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.end(await readFile(path.join(here, 'public', 'index.html')));
    return;
  }

  if (req.method === 'POST' && parsed.pathname === '/api/generate') {
    let raw = '';
    req.on('data', (c) => (raw += c));
    req.on('end', () => {
      const body = JSON.parse(raw || '{}');
      const id = Date.now().toString(36);
      jobs.set(id, {done: false, status: 'Starting...'});
      generate(id, body).catch((e) => {
        const job = jobs.get(id);
        job.error = String(e && e.message ? e.message : e);
        job.done = true;
      });
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({id}));
    });
    return;
  }

  if (req.method === 'GET' && parsed.pathname.startsWith('/api/status/')) {
    const id = parsed.pathname.split('/').pop();
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(jobs.get(id) || {error: 'unknown job'}));
    return;
  }

  if (req.method === 'GET' && parsed.pathname.startsWith('/video/')) {
    const [, , id, file] = parsed.pathname.split('/');
    const safe = path.basename(file || '');
    const target = safe === 'full.mp4' ? path.join(runsDir, id, 'full.mp4') : path.join(runsDir, id, 'scenes', safe);
    if (!existsSync(target)) {
      res.statusCode = 404;
      res.end('not found');
      return;
    }
    res.setHeader('Content-Type', 'video/mp4');
    readFile(target)
      .then((buf) => res.end(buf))
      .catch(() => {
        res.statusCode = 500;
        res.end();
      });
    return;
  }

  res.statusCode = 404;
  res.end('nope');
});

mkdirSync(runsDir, {recursive: true});
server.listen(4599, '0.0.0.0', () => console.log('Flick app running: http://localhost:4599'));
