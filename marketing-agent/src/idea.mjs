import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {loadEnv, readJson, ROOT, timestampId} from './lib.mjs';

loadEnv();

const [url] = process.argv.slice(2);
if (!url || !/^https?:\/\//.test(url)) {
  console.error('usage: node src/idea.mjs <youtube-url>');
  process.exit(1);
}

const ytdlp =
  process.env.YTDLP_PATH ?? path.join(os.tmpdir(), 'opencode', 'yt-dlp.exe');
if (!fs.existsSync(ytdlp)) {
  console.error(`yt-dlp not found at ${ytdlp}. Set YTDLP_PATH or place the exe there.`);
  process.exit(1);
}

const tmpBase = path.join(os.tmpdir(), `agent-idea-${Date.now()}`);
console.log('fetching captions...');
const meta = spawnSync(
  ytdlp,
  [
    '--skip-download',
    '--write-auto-subs',
    '--sub-lang',
    'en',
    '--sub-format',
    'json3',
    '--print',
    '{"title":"%(title)s","duration":%(duration)s}',
    '-o',
    tmpBase,
    url
  ],
  {encoding: 'utf8'}
);
if (meta.status !== 0) throw new Error(`yt-dlp failed: ${meta.stderr}`);
const info = meta.stdout.trim().split('\n').filter((l) => l.startsWith('{')).pop();
const {title} = JSON.parse(info);
const subFile = `${tmpBase}.en.json3`;
if (!fs.existsSync(subFile)) throw new Error('no English auto-captions found');
const data = JSON.parse(fs.readFileSync(subFile, 'utf8'));

const lines = [];
for (const ev of data.events ?? []) {
  if (!ev.segs) continue;
  const text = ev.segs.map((s) => s.utf8).join('').replace(/\n/g, ' ').trim();
  if (!text) continue;
  const sec = Math.round(ev.tStartMs / 1000);
  lines.push({sec, text});
}
if (lines.length === 0) throw new Error('captions empty');

const pick = (from, to) =>
  lines
    .filter((l) => l.sec >= from && l.sec < to)
    .map((l) => l.text)
    .join(' ')
    .slice(0, 600);

const questions = lines.filter((l) => l.text.includes('?')).length;
const profile = {
  videoTitle: title,
  durationMin: Math.round(data.events.at(-1)?.tStartMs / 60000),
  openHookPattern: pick(0, 15),
  midPattern: pick(30, 45),
  closePattern: pick(Math.max(0, lines.at(-1).sec - 20), lines.at(-1).sec + 1),
  questionCount: questions,
  pacingNote: `~${Math.ceil(lines.length / (data.events.at(-1).tStartMs / 60000))} caption lines per minute`
};

function heuristicTopic() {
  return {
    id: timestampId('ref'),
    title: `New topic inspired by: ${title}`.slice(0, 90),
    idea: `Build an original angle using this observed FORMAT (do not copy the wording): opens on a hard number/stat within 15s, establishes credibility early, teaches a named step framework through the middle, closes with a comment-bait question plus a follow/DM offer. Your angle:`,
    hookStat: 'TODO',
    hookLine: 'TODO finish this stat line with your own number and claim.',
    credibility: 'TODO why should viewers trust you on this?',
    frameworkName: 'ABC',
    steps: [
      {key: 'A', title: 'First', point: 'TODO first step in under 12 words.'},
      {key: 'B', title: 'Second', point: 'TODO second step in under 12 words.'},
      {key: 'C', title: 'Third', point: 'TODO third step in under 12 words.'}
    ],
    example: 'TODO one concrete result you have seen.',
    ctaQuestion: 'TODO ask which case fits them.',
    ctaOffer: 'Follow for part two.',
    caption: 'TODO caption with a hook line and a question.',
    hashtags: ['#marketing'],
    needsFilling: true
  };
}

async function llmTopic() {
  if (!process.env.OPENAI_API_KEY) return null;
  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        response_format: {type: 'json_object'},
        messages: [
          {
            role: 'system',
            content:
              'You design original short-form video scripts for a small web-design studio audience of local business owners. Reply with JSON only.'
          },
          {
            role: 'user',
            content: `A reference video had this STRUCTURAL profile: ${JSON.stringify(profile)}

Create ONE completely original topic for our audience. Match the format energy (stat hook, credibility line, named acronym framework, concrete example, engagement CTA) but DO NOT reuse any phrases or claims from the source. Return JSON keys exactly: id omitted, title, idea, hookStat (<=8 chars), hookLine, credibility, frameworkName, steps (3-4 objects key/title<=1 word/point<=12 words), example, ctaQuestion, ctaOffer (<8 words), caption, hashtags (4 items starting with #).`
          }
        ]
      })
    });
    if (!res.ok) throw new Error(`OpenAI ${res.status}`);
    const out = JSON.parse((await res.json()).choices[0].message.content);
    return {...out, id: timestampId('ref'), sourceRef: url};
  } catch (err) {
    console.warn(`LLM topic failed (${err.message}), writing scaffold instead.`);
    return null;
  }
}

const topic = (await llmTopic()) ?? heuristicTopic();
const topicsFile = path.join(ROOT, 'topics.json');
const topics = readJson(topicsFile);
topics.push(topic);
fs.writeFileSync(topicsFile, JSON.stringify(topics, null, 2));
console.log(`added topic "${topic.id}" to topics.json`);
console.log(`source profile: ${profile.videoTitle}, ${profile.durationMin}min, ${questions} questions`);
console.log('next: npm run generate -- --topic ' + topic.id);
