# Marketing Agent

Generates ready-made short-form vertical videos (TikTok / Reels / Shorts style) from your topics, gets your approval, renders them locally with Remotion, and ships them.

Video format: stat hook -> credibility line -> named framework -> concrete example -> engagement CTA, with matched sound effects and animated word-by-word captions.

## Quick start

```
npm install
npm run app
```

Open the printed URL on your desktop or phone (same Wi-Fi). On the phone use your browser's "Add to Home Screen" to install it as an app.

## The pipeline

1. **Generate** - `npm run generate` or the app button creates draft scripts into `queue/pending/`.
   - With `OPENAI_API_KEY` in `.env`: scripts are written by the LLM.
   - Without: uses your raw material in `topics.json`.
2. **Review** - `npm run review` (CLI) or review in the app: approve / reject / edit captions.
3. **Render** - `npm run render -- <id>` / `--all`, or one click in the app. Outputs `out/<id>.mp4` (1080x1920, 30fps).
4. **Publish** - `npm run publish -- <id>`, or in the app.
   - YouTube auto-uploads when `PLATFORMS=youtube` + OAuth creds are set.
   - Always also creates `out/packages/<id>/` with the MP4, caption.txt and checklist for manual posting to TikTok / Reels.

## Idea harvester

Turn any reference video's *format* into a new original topic (never copies its wording):

```
npm run idea -- https://youtube.com/watch?v=...
```

Needs `yt-dlp.exe` (default looks in `%TEMP%\opencode\yt-dlp.exe`, override with `YTDLP_PATH`). Adds a topic to `topics.json`, then `npm run generate -- --topic <id>`.

## Preview in studio

```
npm run studio
```

## Configuration

- `topics.json` - your content bank (hook stat, framework steps, CTAs, caption, hashtags).
- `.env` (copy from `.env.example`):
  - `OPENAI_API_KEY` / `OPENAI_MODEL` - LLM script writing
  - `YT_CLIENT_ID` / `YT_CLIENT_SECRET` / `YT_REFRESH_TOKEN` - YouTube upload
  - `PLATFORMS` - `manual` (default) or `youtube`
  - `YTDLP_PATH` - yt-dlp location for idea harvesting

### One-time YouTube setup

1. console.cloud.google.com -> new project -> enable YouTube Data API v3.
2. OAuth consent screen -> External -> add yourself as test user.
3. Create OAuth client ID -> Desktop app -> copy client id/secret to `.env`.
4. Use Google OAuth Playground (own client) with scope `https://www.googleapis.com/auth/youtube.upload` to mint a refresh token -> put it in `.env`.

TikTok / Instagram Reels auto-posting requires approved developer apps (Meta Graph API, TikTok Content Posting API); until approved, post manually from `out/packages/`.

## Customizing the look

- Colors/fonts/fps: `video/theme.ts`
- Scenes & animations & sounds: `video/scenes.tsx`
- Scene order/duration: `video/MarketingVideo.tsx` + `FRAMES` in theme.ts
- Sound effects live in `public/sfx/`

## Notes

- Renders run 100% locally and free; first render downloads Chrome Headless Shell once.
- Queue states: pending -> approved -> rendered -> packaged/posted (or rejected).
- If a render ever hangs at browser launch, just re-run it.
