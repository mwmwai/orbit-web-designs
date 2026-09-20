import { useState, type FormEvent, useEffect } from "react";
import { whatsappLink } from "../../config";

const TURNSTILE_SITE_KEY = import.meta.env.PUBLIC_TURNSTILE_SITE_KEY;

export default function ContactForm() {
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [phone, setPhone] = useState("");
	const [details, setDetails] = useState("");
	const [turnstileToken, setTurnstileToken] = useState("");
	const [submitting, setSubmitting] = useState(false);
	const [submitError, setSubmitError] = useState("");
	const widgetIdRef = useState<number | null>(null);

	useEffect(() => {
		if (TURNSTILE_SITE_KEY && (window as any).turnstile) {
			const id = (window as any).turnstile.render('#cf-turnstile', {
				sitekey: TURNSTILE_SITE_KEY,
				callback: (token: string) => setTurnstileToken(token),
				'expired-callback': () => setTurnstileToken(''),
			});
			widgetIdRef.current = id;
		}
	}, [TURNSTILE_SITE_KEY]);

	async function handleSubmit(e: FormEvent) {
		e.preventDefault();
		if (!turnstileToken) {
			setSubmitError("Please complete the security check");
			return;
		}
		setSubmitting(true);
		setSubmitError("");

		const message = [
			`Hello Orbit Web Designs & Marketing!`,
			`My name is ${name}.`,
			email && `Email: ${email}`,
			phone && `Phone: ${phone}`,
			details && `Project details: ${details}`,
			`I'd like to get a free quote.`,
		]
			.filter(Boolean)
			.join("\n");

		try {
			const res = await fetch('/api/supabase/submit', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					table: 'leads',
					data: { name, email: email || undefined, phone: phone || undefined, details: details || undefined, source: "contact-form", turnstile_token: turnstileToken },
				}),
			});

			const data = await res.json();
			if (!res.ok) throw new Error(data.error || 'Submission failed');

			window.open(whatsappLink(message), "_blank", "noopener");
			setName(""); setEmail(""); setPhone(""); setDetails(""); setTurnstileToken("");
			if (widgetIdRef.current !== null && (window as any).turnstile) {
				(window as any).turnstile.reset(widgetIdRef.current);
			}
		} catch (err: any) {
			setSubmitError(err.message || "Something went wrong. Try WhatsApp instead.");
		} finally {
			setSubmitting(false);
		}
	}

	const inputCls =
		"w-full rounded-xl border border-edge bg-charcoal px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-electric focus:ring-2 focus:ring-electric/30";

	return (
		<form onSubmit={handleSubmit} className="grid gap-5 sm:grid-cols-2">
			<label className="grid gap-1.5">
				<span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Name</span>
				<input
					type="text"
					required
					maxLength={60}
					value={name}
					onInput={(e) => setName((e.target as HTMLInputElement).value)}
					placeholder="Jane Wanjiku"
					className={inputCls}
				/>
			</label>
			<label className="grid gap-1.5">
				<span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Email</span>
				<input
					type="email"
					maxLength={100}
					value={email}
					onInput={(e) => setEmail((e.target as HTMLInputElement).value)}
					placeholder="jane@company.co.ke"
					className={inputCls}
				/>
			</label>
			<label className="grid gap-1.5 sm:col-span-2">
				<span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Phone Number</span>
				<input
					type="tel"
					maxLength={20}
					value={phone}
					onInput={(e) => setPhone((e.target as HTMLInputElement).value)}
					placeholder="+254 7XX XXX XXX"
					className={inputCls}
				/>
			</label>
			<label className="grid gap-1.5 sm:col-span-2">
				<span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Project Details</span>
				<textarea
					rows={4}
					maxLength={800}
					value={details}
					onInput={(e) => setDetails((e.target as HTMLTextAreaElement).value)}
					placeholder="Tell us about your project — what does your business do, and what do you need?"
					className={`${inputCls} resize-y`}
				/>
			</label>
			<label className="sm:col-span-2">
				<div id="cf-turnstile" />
				{submitError && <p className="mt-2 text-sm text-red-400">{submitError}</p>}
			</label>
			<button
				type="submit"
				disabled={submitting || !turnstileToken}
				className="btn-gradient rounded-full px-8 py-3.5 font-semibold text-white shadow-lg shadow-neon/25 hover:-translate-y-0.5 sm:col-span-2 disabled:opacity-50 disabled:cursor-not-allowed"
			>
				{submitting ? "Sending…" : "Send via WhatsApp"}
			</button>
		</form>
	);
}