import { useEffect, useState } from "react";
import { DEFAULT_WA_MESSAGE, whatsappLink, NAV_LINKS } from "../../config";

export default function Navbar() {
	const [open, setOpen] = useState(false);
	const [path, setPath] = useState("/");

	useEffect(() => {
		const update = () => setPath(window.location.pathname);
		update();
		document.addEventListener("astro:page-load", update);
		return () => document.removeEventListener("astro:page-load", update);
	}, []);

	useEffect(() => {
		document.body.style.overflow = open ? "hidden" : "";
		return () => { document.body.style.overflow = ""; };
	}, [open]);

	return (
		<header className="sticky top-0 z-50 border-b border-edge/40 bg-ink/70 backdrop-blur-xl">
			<div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 md:px-8">
				<a href="/" className="flex items-center gap-3.5">
					<img src="/logo-mark.png" alt="Orbit logo" width={36} height={36} className="opacity-90" />
					<span className="leading-none">
						<span className="block font-display text-[1.05rem] font-medium tracking-[0.22em] text-cream">
							ORBIT
						</span>
						<span className="mt-1 block font-sans text-[0.58rem] font-medium uppercase tracking-[0.22em] text-stone">
							Web Designs <span className="text-metal">&amp;</span> Marketing
						</span>
					</span>
				</a>

				<nav className="hidden items-center gap-8 lg:flex" aria-label="Main">
					{NAV_LINKS.map((l) => {
						const active = path === l.href;
						return (
							<a
								key={l.href}
								href={l.href}
								className={`nav-link transition-colors duration-300 ${active ? "is-active text-cream" : "text-stone hover:text-cream"}`}
							>
								{l.label}
							</a>
						);
					})}
				</nav>

				<div className="hidden items-center gap-4 lg:flex">
					<a href="/contact" className="link-underline text-xs">
						Start a project <span aria-hidden>→</span>
					</a>
				</div>

				<button
					type="button"
					onClick={() => setOpen(!open)}
					className="inline-flex h-10 w-10 items-center justify-center border border-edge text-stone transition hover:border-metal hover:text-cream lg:hidden"
					aria-label="Open menu"
					aria-expanded={open}
				>
					<span className="relative block h-3 w-5">
						<span className={`absolute left-0 top-0 h-px w-full bg-current transition-all ${open ? "translate-y-1.5 rotate-45" : ""}`} />
						<span className={`absolute left-0 top-1.5 h-px w-full bg-current transition-opacity ${open ? "opacity-0" : "opacity-100"}`} />
						<span className={`absolute left-0 top-3 h-px w-full bg-current transition-all ${open ? "-translate-y-1.5 -rotate-45" : ""}`} />
					</span>
				</button>
			</div>

			<div className={`fixed inset-0 z-40 bg-ink/60 backdrop-blur-sm transition lg:hidden ${open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"}`} onClick={() => setOpen(false)} aria-hidden />

			<div className={`fixed right-0 top-0 z-50 flex h-dvh w-[88%] max-w-sm flex-col border-l border-edge bg-charcoal p-8 pt-20 transition duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] lg:hidden ${open ? "translate-x-0" : "translate-x-full"}`}>
				<nav className="flex flex-col gap-1" aria-label="Mobile">
					{NAV_LINKS.map((l, i) => (
						<a
							key={l.href}
							href={l.href}
							onClick={() => setOpen(false)}
							className={`group flex items-baseline justify-between border-b border-edge/60 py-5 transition ${path === l.href ? "text-cream" : "text-stone hover:text-cream"}`}
							style={{ transitionDelay: `${i * 40}ms` }}
						>
							<span className="font-display text-2xl tracking-tight">{l.label}</span>
							<span className="font-mono text-xs opacity-40">0{i + 1}</span>
						</a>
					))}
				</nav>
				<div className="mt-auto pt-8">
					<a href={whatsappLink(DEFAULT_WA_MESSAGE)} target="_blank" rel="noopener noreferrer" className="link-underline">
						Chat on WhatsApp <span aria-hidden>↗</span>
					</a>
					<p className="mt-6 font-mono text-xs leading-relaxed text-stone">
						Available worldwide.<br />Response within hours.
					</p>
				</div>
			</div>
		</header>
	);
}
