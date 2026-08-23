import {readFileSync, writeFileSync} from 'node:fs';

const src = process.argv[2];
const out = process.argv[3];
const data = JSON.parse(readFileSync(src, 'utf8'));
const fmt = (ms) => {
  const s = Math.floor(ms / 1000);
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
};

const lines = [];
let buf = '';
let start = null;

for (const ev of data.events ?? []) {
  if (!ev.segs) continue;
  const text = ev.segs.map((s) => s.utf8).join('').replace(/\n/g, ' ').trim();
  if (!text) continue;
  if (start === null) start = ev.tStartMs;
  buf += (buf ? ' ' : '') + text;
  const endsSentence = /[.!?:]$/.test(text);
  const tooLong = buf.length > 220;
  if (endsSentence || tooLong) {
    lines.push(`[${fmt(start)}] ${buf}`);
    buf = '';
    start = null;
  }
}
if (buf) lines.push(`[${fmt(start)}] ${buf}`);

writeFileSync(out, lines.join('\n'), 'utf8');
console.log(`wrote ${lines.length} lines to ${out}`);
