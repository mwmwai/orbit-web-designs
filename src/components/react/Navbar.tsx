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
				<div className="flex items-center gap-10">
					<a href="/" className="flex items-center gap-3.5">
						<img src="/logo-mark.png" alt="Orbit logo" width={48} height={48} />
						<span className="leading-none">
							<span className="block bg-gradient-to-r from-slate-100 via-slate-300 to-slate-400 bg-clip-text text-xl font-black tracking-[0.3em] text-transparent">
								ORBIT
							</span>
							<span className="mt-1.5 block text-[10px] font-semibold uppercase tracking-[0.26em] text-slate-500">
								Web Designs <span className="text-electric">&amp;</span> Marketing
							</span>
						</span>
					</a>

					<nav className="hidden items-center gap-7 lg:flex" aria-label="Main">
						{NAV_LINKS.map((l) => {
							const active = path === l.href;
							return (
								<a
									key={l.href}
									href={l.href}
									className={`nav-link text-sm transition-colors duration-300 ${
										active ? "is-active font-semibold text-white" : "text-slate-300 hover:text-white"
									}`}
								>
									{l.label}
								</a>
							);
						})}
					</nav>
				</div>

				<div className="flex items-center gap-3">
					<a
						href={whatsappLink(DEFAULT_WA_MESSAGE)}
						target="_blank"
						rel="noopener noreferrer"
						className="btn-gradient hidden rounded-full px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-electric/25 hover:shadow-electric/40 md:inline-block"
					>
						Get a Free Quote
					</a>
					<button
						type="button"
						onClick={() => setOpen(!open)}
						className="rounded-lg border border-edge p-2 text-slate-300 transition hover:border-electric/60 md:hidden"
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
				<nav className="animate-menu border-t border-white/5 px-5 pb-4 pt-2 md:hidden" aria-label="Mobile">
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
						className="btn-gradient mt-2 block rounded-full px-5 py-2.5 text-center text-sm font-semibold text-white"
					>
						Get a Free Quote
					</a>
				</nav>
			)}
		</header>
	);
}
