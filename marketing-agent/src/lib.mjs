import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const OUT_DIR = path.join(ROOT, 'out');

export const DIRS = {
  pending: path.join(ROOT, 'queue', 'pending'),
  approved: path.join(ROOT, 'queue', 'approved'),
  rejected: path.join(ROOT, 'queue', 'rejected'),
  posted: path.join(ROOT, 'queue', 'posted')
};

export function ensureDirs() {
  fs.mkdirSync(OUT_DIR, {recursive: true});
  for (const dir of Object.values(DIRS)) fs.mkdirSync(dir, {recursive: true});
}

export function loadEnv() {
  const envFile = path.join(ROOT, '.env');
  if (!fs.existsSync(envFile)) return;
  for (const line of fs.readFileSync(envFile, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^([A-Z_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
  }
}

export function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

export function writeJson(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

export function timestampId(slug) {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const stamp = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
  return `${slug}-${stamp}`;
}

export function listQueue(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((f) => f.endsWith('.json'));
}

export function moveDraft(file, targetDir) {
  const dest = path.join(targetDir, path.basename(file));
  fs.renameSync(file, dest);
  return dest;
}

export function findDraft(id) {
  for (const dir of [DIRS.pending, DIRS.approved, DIRS.posted, DIRS.rejected]) {
    const candidate = path.join(dir, `${id}.json`);
    if (fs.existsSync(candidate)) return candidate;
  }
  return null;
}
