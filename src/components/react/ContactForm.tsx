import { useState, type FormEvent } from "react";
import { whatsappLink } from "../../config";

export default function ContactForm() {
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [phone, setPhone] = useState("");
	const [details, setDetails] = useState("");

	function handleSubmit(e: FormEvent) {
		e.preventDefault();
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
	}

	const inputCls =
		"w-full border border-edge bg-transparent px-4 py-3.5 font-sans text-sm text-cream placeholder:text-stone outline-none transition focus:border-metal";

	return (
		<form onSubmit={handleSubmit} className="grid gap-6 sm:grid-cols-2">
			<label className="grid gap-2">
				<span className="font-mono text-xs uppercase tracking-widest text-stone">Name</span>
				<input type="text" required value={name} onInput={(e) => setName((e.target as HTMLInputElement).value)} placeholder="Jane Wanjiku" className={inputCls} />
			</label>
			<label className="grid gap-2">
				<span className="font-mono text-xs uppercase tracking-widest text-stone">Email</span>
				<input type="email" value={email} onInput={(e) => setEmail((e.target as HTMLInputElement).value)} placeholder="jane@company.co.ke" className={inputCls} />
			</label>
			<label className="grid gap-2 sm:col-span-2">
				<span className="font-mono text-xs uppercase tracking-widest text-stone">Phone</span>
				<input type="tel" value={phone} onInput={(e) => setPhone((e.target as HTMLInputElement).value)} placeholder="+254 7XX XXX XXX" className={inputCls} />
			</label>
			<label className="grid gap-2 sm:col-span-2">
				<span className="font-mono text-xs uppercase tracking-widest text-stone">Project details</span>
				<textarea rows={4} value={details} onInput={(e) => setDetails((e.target as HTMLTextAreaElement).value)} placeholder="What does your business do, and what do you need?" className={`${inputCls} resize-y`} />
			</label>
			<button type="submit" className="link-underline justify-self-start sm:col-span-2">
				Send via WhatsApp <span aria-hidden>→</span>
			</button>
		</form>
	);
}
