import fs from 'node:fs';
import path from 'node:path';
import {
  DIRS,
  OUT_DIR,
  ROOT,
  ensureDirs,
  findDraft,
  listQueue,
  loadEnv,
  moveDraft,
  readJson
} from './lib.mjs';

loadEnv();
ensureDirs();

async function youtubeAccessToken() {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {'Content-Type': 'application/x-www-form-urlencoded'},
    body: new URLSearchParams({
      client_id: process.env.YT_CLIENT_ID,
      client_secret: process.env.YT_CLIENT_SECRET,
      refresh_token: process.env.YT_REFRESH_TOKEN,
      grant_type: 'refresh_token'
    })
  });
  if (!res.ok) throw new Error(`token refresh failed: ${await res.text()}`);
  const data = await res.json();
  return data.access_token;
}

async function uploadYoutube(draft, mp4) {
  const token = await youtubeAccessToken();
  const meta = {
    snippet: {
      title: draft.title.slice(0, 100),
      description: `${draft.caption}\n\n${draft.hashtags.join(' ')}\n#shorts`,
      categoryId: '22'
    },
    status: {privacyStatus: 'public', selfDeclaredMadeForKids: false}
  };
  const init = await fetch(
    'https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json; charset=UTF-8',
        'X-Upload-Content-Length': String(fs.statSync(mp4).size),
        'X-Upload-Content-Type': 'video/mp4'
      },
      body: JSON.stringify(meta)
    }
  );
  if (!init.ok) throw new Error(`upload init failed: ${await init.text()}`);
  const session = init.headers.get('location');
  const put = await fetch(session, {
    method: 'PUT',
    headers: {'Content-Type': 'video/mp4'},
    body: fs.createReadStream(mp4)
  });
  if (!put.ok) throw new Error(`upload failed: ${await put.text()}`);
  const video = await put.json();
  return `https://youtube.com/shorts/${video.id}`;
}

function makePackage(draft, mp4) {
  const pkgDir = path.join(OUT_DIR, 'packages', draft.id);
  fs.mkdirSync(pkgDir, {recursive: true});
  fs.copyFileSync(mp4, path.join(pkgDir, `${draft.id}.mp4`));
  fs.writeFileSync(
    path.join(pkgDir, 'caption.txt'),
    `${draft.title}\n\n${draft.caption}\n\n${draft.hashtags.join(' ')}`
  );
  fs.writeFileSync(
    path.join(pkgDir, 'checklist.txt'),
    [
      `1. YouTube Shorts: upload ${draft.id}.mp4 as a Short`,
      '2. TikTok / Instagram Reels: these require an approved developer app for auto-posting;',
      '   until then post manually using caption.txt',
      `3. Keep vertical format 1080x1920, under 60s (${draft.id}.mp4)`
    ].join('\n')
  );
  return pkgDir;
}

async function publishDraft(file) {
  const draft = readJson(file);
  if (draft.status !== 'rendered') {
    console.log(`skip ${draft.id}: status is ${draft.status}, run render first`);
    return;
  }
  const resolvedMp4 = draft.output
    ? path.join(ROOT, draft.output)
    : path.join(OUT_DIR, `${draft.id}.mp4`);
  if (!fs.existsSync(resolvedMp4)) throw new Error(`missing video file: ${resolvedMp4}`);

  const pkgDir = makePackage(draft, resolvedMp4);
  console.log(`package ready: ${pkgDir}`);

  const uploaded = [];
  if ((process.env.PLATFORMS ?? '').includes('youtube') && process.env.YT_REFRESH_TOKEN) {
    try {
      const url = await uploadYoutube(draft, resolvedMp4);
      uploaded.push(`youtube: ${url}`);
      console.log(`posted to YouTube: ${url}`);
    } catch (err) {
      console.error(`YouTube upload failed: ${err.message}`);
    }
  }

  if (uploaded.length > 0) {
    draft.status = 'posted';
    draft.postedTo = uploaded;
    moveDraft(file, DIRS.posted);
    console.log(`${draft.id} -> posted`);
  } else {
    draft.status = 'packaged';
    fs.writeFileSync(
      path.join(DIRS.approved, `${draft.id}.json`),
      JSON.stringify(draft, null, 2)
    );
    console.log(`${draft.id} -> packaged (manual posting needed, see checklist.txt)`);
  }
}

const [arg] = process.argv.slice(2);
if (arg === '--all') {
  for (const f of listQueue(DIRS.approved)) await publishDraft(path.join(DIRS.approved, f));
} else if (arg) {
  const file = findDraft(arg);
  if (!file) throw new Error(`draft not found: ${arg}`);
  await publishDraft(file);
} else {
  console.log('usage: node src/publish.mjs <id> | --all');
}
