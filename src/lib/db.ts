// Tiny Supabase REST helpers — no SDK needed.
// Env vars (Vercel → Environment Variables + local .env):
//   PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY

const URL = import.meta.env.PUBLIC_SUPABASE_URL as string | undefined;
const KEY = import.meta.env.PUBLIC_SUPABASE_ANON_KEY as string | undefined;

export const dbReady = Boolean(URL && KEY);

async function insert(table: "leads" | "newsletter", row: Record<string, unknown>): Promise<boolean> {
	if (!dbReady) return false;
	try {
		const res = await fetch(`${URL}/rest/v1/${table}`, {
			method: "POST",
			headers: {
				apikey: KEY as string,
				Authorization: `Bearer ${KEY}`,
				"Content-Type": "application/json",
				Prefer: "return=minimal",
			},
			body: JSON.stringify(row),
		});
		return res.ok;
	} catch {
		return false;
	}
}

export function saveLead(lead: { name: string; email?: string; phone?: string; details?: string; source?: string }) {
	// Fire-and-forget: never block the WhatsApp redirect.
	void insert("leads", lead);
}

export async function subscribeNewsletter(email: string, name?: string): Promise<boolean> {
	return insert("newsletter", { email, name: name || null });
}
