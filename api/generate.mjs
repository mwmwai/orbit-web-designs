const TURNSTILE_SECRET = process.env.TURNSTILE_SECRET_KEY;

// Media generation costs money per call — gate it like the other api/ routes.
const RATE_LIMIT = 10; // generations per window, per client subnet
const WINDOW_MS = 3_600_000; // 1 hour
const MAX_ENTRIES = 5000;
const ipStore = new Map(); // key -> { count, reset }

function getClientIP(req) {
	const forwarded = req.headers?.["x-forwarded-for"];
	if (forwarded) return String(forwarded).split(",")[0].trim();
	return req.headers?.["x-real-ip"] || req.socket?.remoteAddress || "unknown";
}

// Normalize to /24 so trivial last-octet rotation doesn't dodge the limit.
function rateKey(ip) {
	const m = String(ip).match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.\d{1,3}$/);
	if (m) return `${m[1]}.${m[2]}.${m[3]}.0/24`;
	return String(ip).slice(0, 64);
}

function checkRateLimit(ip) {
	const now = Date.now();
	const key = rateKey(ip);
	const record = ipStore.get(key);
	if (!record || now > record.reset) {
		if (ipStore.size >= MAX_ENTRIES) {
			const oldest = ipStore.keys().next().value;
			ipStore.delete(oldest);
		}
		const reset = now + WINDOW_MS;
		ipStore.set(key, { count: 1, reset });
		return { allowed: true, reset };
	}
	if (record.count >= RATE_LIMIT) return { allowed: false, reset: record.reset };
	record.count++;
	return { allowed: true, reset: record.reset };
}

async function verifyTurnstile(token, ip) {
	if (!TURNSTILE_SECRET) return false; // Fail CLOSED — never skip verification.
	try {
		const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
			method: "POST",
			headers: { "Content-Type": "application/x-www-form-urlencoded" },
			body: new URLSearchParams({ secret: TURNSTILE_SECRET, response: token, remoteip: ip }),
		});
		const data = await res.json();
		return data.success === true;
	} catch {
		return false;
	}
}

// Only models we have vetted for cost/ToS. Add new ones here deliberately —
// never accept an attacker-chosen model string (it becomes part of the URL).
const ALLOWED_MODELS = new Set(["higgsfield-ai/soul/standard"]);
const ALLOWED_ASPECTS = new Set(["16:9", "9:16", "1:1"]);
const ALLOWED_RESOLUTIONS = new Set(["720p", "1080p"]);
const MAX_PROMPT_CHARS = 2000;

export default async function handler(req, res) {
	if (req.method !== "POST") {
		res.status(405).json({ error: "POST only" });
		return;
	}
	const ip = getClientIP(req);
	const rateLimit = checkRateLimit(ip);
	if (!rateLimit.allowed) {
		res.status(429).json({ error: "Too many generations. Try again later." });
		return;
	}
	const { prompt, model = "higgsfield-ai/soul/standard", aspect_ratio = "16:9", resolution = "720p", turnstileToken } = req.body ?? {};
	if (!turnstileToken || typeof turnstileToken !== "string") {
		res.status(400).json({ error: "Security check required. Please try again." });
		return;
	}
	if (!TURNSTILE_SECRET) {
		res.status(503).json({ error: "Verification unavailable. Try again later." });
		return;
	}
	if (!(await verifyTurnstile(turnstileToken, ip))) {
		res.status(403).json({ error: "Security check failed. Please try again." });
		return;
	}
	if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
		res.status(400).json({ error: "prompt required" });
		return;
	}
	if (prompt.length > MAX_PROMPT_CHARS) {
		res.status(400).json({ error: `prompt too long (max ${MAX_PROMPT_CHARS} chars)` });
		return;
	}
	if (!ALLOWED_MODELS.has(model)) {
		res.status(400).json({ error: "Unsupported model" });
		return;
	}
	if (!ALLOWED_ASPECTS.has(aspect_ratio) || !ALLOWED_RESOLUTIONS.has(resolution)) {
		res.status(400).json({ error: "Unsupported aspect_ratio or resolution" });
		return;
	}
	const id = process.env.HF_API_KEY_ID;
	const secret = process.env.HF_API_KEY_SECRET;
	if (!id || !secret) {
		res.status(500).json({ error: "Higgsfield credentials not configured" });
		return;
	}
	const auth = { Authorization: `Key ${id}:${secret}`, "Content-Type": "application/json" };
	try {
		const submit = await fetch(`https://platform.higgsfield.ai/${model}`, {
			method: "POST",
			headers: auth,
			body: JSON.stringify({ prompt, aspect_ratio, resolution }),
		});
		const submitted = await submit.json();
		if (!submitted.request_id || !submitted.status_url) {
			res.status(submit.status || 502).json({ error: "submit failed", detail: submitted });
			return;
		}
		const deadline = Date.now() + 240000;
		let result = submitted;
		while (Date.now() < deadline) {
			await new Promise((r) => setTimeout(r, 3000));
			const check = await fetch(submitted.status_url, { headers: auth });
			result = await check.json();
			const status = result.status ?? result.request?.status;
			if (status === "completed") {
				res.status(200).json({ status: "completed", output: result.results ?? result.images ?? result });
				return;
			}
			if (status === "failed" || status === "nsfw") {
				res.status(200).json({ status, detail: result });
				return;
			}
		}
		res.status(202).json({ status: "timeout", request_id: submitted.request_id, status_url: submitted.status_url });
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
}
