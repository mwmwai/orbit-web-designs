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

	return (
		<header className="sticky top-0 z-50 border-b border-white/5 bg-ink/80 backdrop-blur-md">
			<div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
				<a href="/" className="flex items-center gap-3">
					<img src="/logo.png" alt="Orbit logo" width={38} height={38} />
					<span className="leading-none">
						<span className="block text-base font-extrabold tracking-[0.22em] text-slate-200">
							ORBIT
						</span>
						<span className="mt-1 block text-[8px] font-semibold uppercase tracking-[0.24em] text-slate-500">
							Web Designs &amp; Marketing
						</span>
					</span>
				</a>

				<nav className="hidden items-center gap-7 md:flex" aria-label="Main">
					{NAV_LINKS.map((l) => {
						const active = path === l.href;
						return (
							<a
								key={l.href}
								href={l.href}
								className={`text-sm transition ${
									active
										? "font-semibold text-gradient"
										: "text-slate-300 hover:text-white"
								}`}
							>
								{l.label}
							</a>
						);
					})}
				</nav>

				<div className="flex items-center gap-3">
					<a
						href={whatsappLink(DEFAULT_WA_MESSAGE)}
						target="_blank"
						rel="noopener noreferrer"
						className="hidden rounded-full bg-gradient-to-r from-electric to-neon px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-electric/25 transition hover:brightness-110 md:inline-block"
					>
						Get a Free Quote
					</a>
					<button
						type="button"
						onClick={() => setOpen(!open)}
						className="rounded-lg border border-edge p-2 text-slate-300 md:hidden"
						aria-label="Toggle menu"
						aria-expanded={open}
					>
						<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
							{open ? (
								<path d="M6 6l12 12M18 6L6 18" />
							) : (
								<path d="M4 7h16M4 12h16M4 17h16" />
							)}
						</svg>
					</button>
				</div>
			</div>

			{open && (
				<nav className="border-t border-white/5 px-5 pb-4 pt-2 md:hidden" aria-label="Mobile">
					{NAV_LINKS.map((l) => (
						<a
							key={l.href}
							href={l.href}
							onClick={() => setOpen(false)}
							className={`block py-2.5 transition ${path === l.href ? "font-semibold text-white" : "text-slate-300 hover:text-white"}`}
						>
							{l.label}
						</a>
					))}
					<a
						href={whatsappLink(DEFAULT_WA_MESSAGE)}
						target="_blank"
						rel="noopener noreferrer"
						className="mt-2 block rounded-full bg-gradient-to-r from-electric to-neon px-5 py-2.5 text-center text-sm font-semibold text-white"
					>
						Get a Free Quote
					</a>
				</nav>
			)}
		</header>
	);
}

