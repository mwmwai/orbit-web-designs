import { readFileSync, writeFileSync, mkdirSync } from "node:fs";

const env = readFileSync(".env", "utf8");
const ID = env.match(/HF_API_KEY_ID=(.+)/)[1].trim();
const SECRET = env.match(/HF_API_KEY_SECRET=(.+)/)[1].trim();
const auth = { Authorization: `Key ${ID}:${SECRET}`, "Content-Type": "application/json" };

const prompt = process.argv[2] ?? "Cinematic dark hero background for a premium web design agency, deep charcoal with electric blue and neon blue light orbit trails, subtle film grain, volumetric glow, ultra minimal, 8k";
const model = process.argv[3] ?? "higgsfield-ai/soul/standard";

console.log("Submitting to", model);
const submit = await fetch(`https://platform.higgsfield.ai/${model}`, {
	method: "POST",
	headers: auth,
	body: JSON.stringify({ prompt, aspect_ratio: "16:9", resolution: "720p" }),
});
const submitted = await submit.json();
console.log("submitted:", submit.status, submitted.request_id);
if (!submitted.status_url) {
	console.error(JSON.stringify(submitted).slice(0, 500));
	process.exit(1);
}

let result = null;
const deadline = Date.now() + 240000;
while (Date.now() < deadline) {
	await new Promise((r) => setTimeout(r, 4000));
	const check = await fetch(submitted.status_url, { headers: auth });
	result = await check.json();
	const status = result.status ?? result.request?.status;
	console.log("status:", status);
	if (status === "completed" || status === "failed" || status === "nsfw") break;
}

if (result?.status !== "completed") {
	console.error("not completed:", JSON.stringify(result).slice(0, 500));
	process.exit(1);
}

const media =
	result.results?.raw?.[0] ??
	result.results?.[0] ??
	result.images?.[0] ??
	Object.values(result).find((v) => Array.isArray(v) && v[0]?.url);
const url = typeof media === "string" ? media : media?.url;
if (!url) {
	console.error("no url in result:", JSON.stringify(result).slice(0, 800));
	process.exit(1);
}
console.log("media url:", url);

const img = await fetch(url);
mkdirSync("public/media", { recursive: true });
const ext = url.includes(".mp4") ? "mp4" : "jpg";
writeFileSync(`public/media/hero-gen.${ext}`, Buffer.from(await img.arrayBuffer()));
console.log("saved public/media/hero-gen." + ext);
