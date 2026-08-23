export default async function handler(req, res) {
	if (req.method !== "POST") {
		res.status(405).json({ error: "POST only" });
		return;
	}
	const { prompt, model = "higgsfield-ai/soul/standard", aspect_ratio = "16:9", resolution = "720p" } = req.body ?? {};
	if (!prompt || typeof prompt !== "string") {
		res.status(400).json({ error: "prompt required" });
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
