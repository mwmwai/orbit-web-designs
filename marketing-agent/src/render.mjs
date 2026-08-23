import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {
  DIRS,
  OUT_DIR,
  ROOT,
  ensureDirs,
  findDraft,
  listQueue,
  readJson
} from './lib.mjs';

ensureDirs();

const require = createRequire(import.meta.url);
const cliPkg = require('@remotion/cli/package.json');
const cliJs = path.join(ROOT, 'node_modules', '@remotion', 'cli', cliPkg.bin.remotion);

function renderDraft(file) {
  const draft = readJson(file);
  if (!['approved', 'rendered'].includes(draft.status)) {
    console.log(`skip ${draft.id}: status is ${draft.status}, needs approved`);
    return null;
  }
  const outPath = path.join(OUT_DIR, `${draft.id}.mp4`);
  console.log(`rendering ${draft.id} -> ${path.relative(ROOT, outPath)}`);
  const res = spawnSync(
    process.execPath,
    [
      cliJs,
      'render',
      path.join(ROOT, 'video', 'index.ts'),
      'MarketingVideo',
      outPath,
      `--props=${file}`,
      '--overwrite'
    ],
    {stdio: 'inherit'}
  );
  if (res.status !== 0) {
    console.error(`render failed for ${draft.id}`);
    return null;
  }
  draft.status = 'rendered';
  draft.output = path.relative(ROOT, outPath);
  fs.writeFileSync(path.join(DIRS.approved, `${draft.id}.json`), JSON.stringify(draft, null, 2));
  console.log(`done ${draft.id}`);
  return draft;
}

const [arg] = process.argv.slice(2);
if (arg === '--all') {
  for (const f of listQueue(DIRS.approved)) renderDraft(path.join(DIRS.approved, f));
} else if (arg) {
  const file = findDraft(arg);
  if (!file || !file.includes('approved')) throw new Error(`approved draft not found: ${arg}`);
  renderDraft(file);
} else {
  console.log('usage: node src/render.mjs <id> | --all');
}
