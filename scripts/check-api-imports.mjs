// Build guard: every relative import under api/ must resolve to a real file.
// A wrong `../` in a serverless function does NOT fail `astro build` — it
// ships, then Vercel answers 500 on every request (that is exactly what
// happened to /api/transactions, /api/ingest/sms and the C2B confirmation).
// Run automatically from `npm run build`.

import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import { join, dirname, resolve, relative } from 'node:path';

const root = process.cwd();
const apiDir = join(root, 'api');
const EXTENSIONS = ['', '.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.json'];

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (/\.(js|ts|mjs|cjs|jsx|tsx)$/.test(entry.name)) out.push(full);
  }
  return out;
}

function resolves(fromFile, spec) {
  const base = resolve(dirname(fromFile), spec);
  for (const ext of EXTENSIONS) {
    if (existsSync(base + ext) && statSync(base + ext).isFile()) return true;
    if (existsSync(join(base + ext, 'index.ts'))) return true;
    if (existsSync(join(base + ext, 'index.js'))) return true;
  }
  return false;
}

if (!existsSync(apiDir)) {
  console.log('check-api-imports: no api/ directory, skipping');
  process.exit(0);
}

const IMPORT_RE = /(?:from|import|require\()\s*['"](\.[^'"]+)['"]/g;
const missing = [];
let checked = 0;

for (const file of walk(apiDir)) {
  const src = readFileSync(file, 'utf8');
  for (const match of src.matchAll(IMPORT_RE)) {
    checked += 1;
    if (!resolves(file, match[1])) {
      missing.push(`${relative(root, file)} -> ${match[1]}`);
    }
  }
}

if (missing.length) {
  console.error(`check-api-imports: ${missing.length} broken import(s):`);
  for (const m of missing) console.error('  ' + m);
  process.exit(1);
}

console.log(`check-api-imports: ${checked} relative import(s) resolved`);
