import fs from 'node:fs';
import path from 'node:path';
import {DIRS, ROOT, ensureDirs, loadEnv, readJson, timestampId, writeJson} from './lib.mjs';

loadEnv();
ensureDirs();

const args = process.argv.slice(2);
const countArg = args.indexOf('--count');
const count = countArg >= 0 ? Number(args[countArg + 1]) || 1 : 2;
const topicArg = args.indexOf('--topic');
const onlyTopic = topicArg >= 0 ? args[topicArg + 1] : null;

const topics = readJson(path.join(ROOT, 'topics.json'));
const chosen = onlyTopic
  ? topics.filter((t) => t.id === onlyTopic)
  : topics.slice().sort(() => Math.random() - 0.5).slice(0, count);

if (chosen.length === 0) {
  console.error('No matching topics found in topics.json');
  process.exit(1);
}

async function llmDraft(topic) {
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
              'You write scripts for short-form vertical marketing videos. Reply with JSON only.'
          },
          {
            role: 'user',
            content: `Write a new script for this topic idea: ${topic.idea}

Return JSON with exactly these keys:
hookStat (max 8 chars, punchy number or phrase), hookLine (one sentence continuing the stat),
credibility (one sentence of earned authority), frameworkName (3-5 letter acronym),
steps (array of 3-4 objects: key=letter, title=one word, point=max 12 words),
example (one concrete sentence), ctaQuestion (short question), ctaOffer (call to action under 8 words).
Be specific and concrete. No hashtags in any field.`
          }
        ]
      })
    });
    if (!res.ok) throw new Error(`OpenAI ${res.status}`);
    const data = await res.json();
    return JSON.parse(data.choices[0].message.content);
  } catch (err) {
    console.warn(`LLM generation failed (${err.message}), using template fallback.`);
    return null;
  }
}

function templateDraft(topic) {
  return {
    hookStat: topic.hookStat,
    hookLine: topic.hookLine,
    credibility: topic.credibility,
    frameworkName: topic.frameworkName,
    steps: topic.steps,
    example: topic.example,
    ctaQuestion: topic.ctaQuestion,
    ctaOffer: topic.ctaOffer
  };
}

for (const topic of chosen) {
  const ai = await llmDraft(topic);
  const video = {...templateDraft(topic), ...(ai ?? {})};
  const draft = {
    id: timestampId(topic.id),
    createdAt: new Date().toISOString(),
    status: 'pending',
    source: ai ? 'llm' : 'template',
    title: topic.title,
    caption: topic.caption,
    hashtags: topic.hashtags,
    platforms: ['youtube'],
    handle: '@orbitwebdesigns',
    video
  };
  const file = path.join(DIRS.pending, `${draft.id}.json`);
  writeJson(file, draft);
  console.log(`draft  ${draft.source.padEnd(8)} ${path.basename(file)}`);
}

console.log('\nNext: npm run review');
