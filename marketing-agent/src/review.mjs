import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline/promises';
import {
  DIRS,
  ensureDirs,
  findDraft,
  listQueue,
  moveDraft,
  readJson
} from './lib.mjs';

ensureDirs();

function summary(draft) {
  const v = draft.video;
  return [
    `id:      ${draft.id}`,
    `source:  ${draft.source}`,
    `title:   ${draft.title}`,
    `hook:    ${v.hookStat} - ${v.hookLine}`,
    `cred:    ${v.credibility}`,
    `steps:   ${v.steps.map((s) => `${s.key}=${s.title}`).join(' ')}`,
    `example: ${v.example}`,
    `cta:     ${v.ctaQuestion} | ${v.ctaOffer}`,
    `caption: ${draft.caption}`,
    `tags:    ${draft.hashtags.join(' ')}`
  ].join('\n');
}

async function interactive() {
  const rl = readline.createInterface({input: process.stdin, output: process.stdout});
  for (;;) {
    const files = listQueue(DIRS.pending);
    console.log(`\n=== PENDING REVIEW (${files.length}) ===`);
    files.forEach((f, i) => {
      const d = readJson(path.join(DIRS.pending, f));
      console.log(`${i + 1}. ${d.id}  [${d.source}] ${d.title}`);
    });
    if (files.length === 0) break;
    const ans = (
      await rl.question('\n<number> view | a<n> approve | r<n> reject | q quit\n> ')
    ).trim();
    if (ans === 'q') break;
    const cmd = ans[0];
    const n = Number(ans.slice(1).trim());
    if (!['1', 'a', 'r'].includes(cmd) || !files[n - 1]) {
      console.log('invalid input');
      continue;
    }
    const file = path.join(DIRS.pending, files[n - 1]);
    const draft = readJson(file);
    if (cmd === '1') console.log(`\n${summary(draft)}\n`);
    if (cmd === 'a') {
      draft.status = 'approved';
      fs.writeFileSync(file, JSON.stringify(draft, null, 2));
      moveDraft(file, DIRS.approved);
      console.log(`approved -> queue/approved/${path.basename(file)}`);
    }
    if (cmd === 'r') {
      draft.status = 'rejected';
      moveDraft(file, DIRS.rejected);
      console.log(`rejected -> queue/rejected/${path.basename(file)}`);
    }
  }
  rl.close();
}

const [cmd, id] = process.argv.slice(2);
if (cmd === 'list') {
  for (const f of listQueue(DIRS.pending)) {
    const d = readJson(path.join(DIRS.pending, f));
    console.log(`${d.id}  [${d.source}]`);
  }
} else if ((cmd === 'approve' || cmd === 'reject') && id) {
  const file = findDraft(id);
  if (!file) throw new Error(`draft not found: ${id}`);
  if (!file.includes('pending')) throw new Error('draft is not pending');
  const draft = readJson(file);
  if (cmd === 'approve') {
    draft.status = 'approved';
    fs.writeFileSync(file, JSON.stringify(draft, null, 2));
    moveDraft(file, DIRS.approved);
  } else {
    draft.status = 'rejected';
    moveDraft(file, DIRS.rejected);
  }
  console.log(`${cmd}d ${id}`);
} else if (!cmd) {
  await interactive();
} else {
  console.log('usage: node src/review.mjs [list|approve <id>|reject <id>]');
}
