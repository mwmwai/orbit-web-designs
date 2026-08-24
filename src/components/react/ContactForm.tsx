import { useState, type FormEvent } from "react";
import { whatsappLink } from "../../config";

export default function ContactForm() {
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [phone, setPhone] = useState("");
	const [details, setDetails] = useState("");
	const [submitting, setSubmitting] = useState(false);

	function handleSubmit(e: FormEvent) {
		e.preventDefault();
		setSubmitting(true);
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
		window.open(whatsappLink(message), "_blank", "noopener");
		setTimeout(() => setSubmitting(false), 800);
	}

	const inputCls =
		"w-full rounded-xl border border-edge bg-charcoal px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-electric focus:ring-2 focus:ring-electric/30 magnetic hover-lift";

	return (
		<form onSubmit={handleSubmit} className="grid gap-5 sm:grid-cols-2">
			<label className="grid gap-1.5">
				<span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Name</span>
				<input
					type="text"
					required
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
					value={details}
					onInput={(e) => setDetails((e.target as HTMLTextAreaElement).value)}
					placeholder="Tell us about your project — what does your business do, and what do you need?"
					className={`${inputCls} resize-y`}
				/>
			</label>
			<button
				type="submit"
				disabled={submitting}
				className="btn-gradient rounded-full px-8 py-3.5 font-semibold text-white shadow-lg shadow-neon/25 hover:-translate-y-0.5 sm:col-span-2 magnetic ripple hover-lift disabled:opacity-60 disabled:cursor-wait"
			>
				{submitting ? "Opening WhatsApp…" : "Send via WhatsApp"}
			</button>
		</form>
	);
}

