# Remotion Composition Brief: Flick

## Objective
Create the approved short-form scene animations from the timestamped transcript.

## Output
- Remotion project: `flick-output/remotion/`
- Format: 9:16 vertical — 1080x1920 at 30 fps
- Rendered scenes:
  - `wasted-first-impression` -> `scenes/wasted-first-impression/wasted-first-impression.mp4`
  - `three-second-exit` -> `scenes/three-second-exit/three-second-exit.mp4`
  - `orbit-builds-better` -> `scenes/orbit-builds-better/orbit-builds-better.mp4`
  - `design-speed-seo` -> `scenes/design-speed-seo/design-speed-seo.mp4`
  - `orbit-outro` -> `scenes/orbit-outro/orbit-outro.mp4`

## Source Material
- Transcript: `transcript.json`
- Approved plan: `flick-plan.md`
- Selected brand assets: none (Flick renders an original ORBIT wordmark)
- Available sound effects: `remotion/public/sounds/`

## Creative Direction
- User direction: "you do you" — approved with 9:16.
- Interpretation: dark cosmic theme fitting the Orbit name — deep space navy background, warm amber accent, crisp white type. Problem scenes feel cold and broken; solution scenes feel fast and polished.
- Avoid: generic filler visuals, unapproved assets, background music

## Scene Compositions

### wasted-first-impression
- Composition ID: `wasted-first-impression`
- Component: `WastedFirstImpression`
- Transcript: "Your website is your first impression. Most businesses waste it."
- Time: 0:00-0:04
- Output: `scenes/wasted-first-impression/wasted-first-impression.mp4`
- What is on screen: A browser window loads a dull gray generic business site; spinner stalls; page renders flat; a visitor cursor arrives, hesitates, bounces away; the window dims to near-black.
- Text on screen: "Your first impression"
- Brand assets / supplied material: none
- Sequential / interaction: browser chrome in, progress bar stalls, page renders, cursor hovers then exits top-right, dim to black
- Sound effect: Click.mp3 on page render; Impact.mp3 on cursor bounce
- Audio-coupled idea: dim-to-black lands exactly on Impact
- Transition: hard cut

### three-second-exit
- Composition ID: `three-second-exit`
- Component: `ThreeSecondExit`
- Transcript: "Slow pages. Broken layouts. Visitors leave in three seconds."
- Time: 0:04-0:08
- Output: `scenes/three-second-exit/three-second-exit.mp4`
- What is on screen: The same site breaks apart — text shifts out of alignment, an image overlaps a heading, a button misplaces — while a large countdown ticks 3-2-1-0; at zero everything slides off leaving dark canvas.
- Text on screen: "3 seconds"; digits 3, 2, 1, 0
- Brand assets / supplied material: none
- Sequential / interaction: three breakages one by one synced to digits; mass slide-off at zero
- Sound effect: Popups.mp3 per breakage; Notification.mp3 at zero
- Audio-coupled idea: each breakage lands exactly on its digit
- Transition: zoom out into darkness

### orbit-builds-better
- Composition ID: `orbit-builds-better`
- Component: `OrbitBuildsBetter`
- Transcript: "Orbit Web Designs builds fast, modern websites that turn visitors into customers."
- Time: 0:08-0:13
- Output: `scenes/orbit-builds-better/orbit-builds-better.mp4`
- What is on screen: A fresh browser window snaps together piece by piece (nav bar, hero headline, two feature cards, CTA button); a speed badge stamps "98"; cursor glides to CTA and clicks; conversion card with green check slides up.
- Text on screen: "Websites that work."; "Get started"; "98"
- Brand assets / supplied material: none — original ORBIT-styled mockup
- Sequential / interaction: five UI pieces snap in order, badge stamp, cursor travel, click, conversion reveal
- Sound effect: Pop.mp3 per snapping piece; Zoomin-OR-out.mp3 on badge stamp; Click.mp3 on CTA click; Correct.mp3 when check appears
- Audio-coupled idea: every snap, stamp, click, and check lands on its own sound
- Transition: slide left

### design-speed-seo
- Composition ID: `design-speed-seo`
- Component: `DesignSpeedSeo`
- Transcript: "Design, speed, SEO - done right, from Nairobi to the world."
- Time: 0:13-0:17
- Output: `scenes/design-speed-seo/design-speed-seo.mp4`
- What is on screen: Three amber tiles rise from below one at a time — DESIGN fans type specimens, SPEED sweeps a gauge needle high, SEO climbs rank chips from #8 to #1; then a globe pulse expands outward from Nairobi.
- Text on screen: "DESIGN", "SPEED", "SEO"; chips "8" and "1"; location tag "Nairobi"
- Brand assets / supplied material: none
- Sequential / interaction: tiles arrive in order each animating its proof; globe pulse fires after third tile settles
- Sound effect: Pop.mp3 per tile arrival; energy.MP3 on globe pulse
- Audio-coupled idea: globe pulse expands exactly on the energy sound
- Transition: crossfade

### orbit-outro
- Composition ID: `orbit-outro`
- Component: `OrbitOutro`
- Transcript: "Orbit Web Designs. Your brand, in motion. Visit orbitwebdesigns.co.ke today."
- Time: 0:17-0:22
- Output: `scenes/orbit-outro/orbit-outro.mp4`
- What is on screen: Dark starfield. Three glowing tiles labeled DESIGN, SPEED, SEO orbit a central bright point, spiral inward, and merge into the ORBIT wordmark wrapped by an orbital ring; beneath it the URL types itself out; final lockup holds.
- Text on screen: "ORBIT WEB DESIGNS"; "Your brand, in motion."; "orbitwebdesigns.co.ke"
- Brand assets / supplied material: none — original ORBIT wordmark rendered by Flick
- Sequential / interaction: tiles orbit and merge, ring draws around wordmark, URL types character by character, full lockup holds
- Sound effect: riser.mp3 under the merge; Impact.mp3 when the ring completes; Typing.mp3 during URL type-out
- Audio-coupled idea: ring completion lands exactly on Impact; URL characters appear on typing rhythm
- Transition: end on held final frame

## Remotion Instructions
- Build one dedicated React component for each approved scene under `src/scenes/`.
- Register each scene as its own `<Composition>` in `src/Root.tsx`.
- Do not create a combined or all-scenes composition.
- Derive frame timing from the approved transcript timestamps and `scene-spec.json`.
- Use frame-driven Remotion motion. Build the approved visual idea; do not fall back to generic title-card layouts.
- Use only selected brand assets from `public/brand-assets/` and bundled SFX from `public/sounds/`.
- Do not add background music. Use an SFX only when it supports the visible action in the approved scene.
- Keep on-screen text readable and render each scene before review.
