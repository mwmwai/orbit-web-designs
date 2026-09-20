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
<div className="flex items-center gap-6 lg:gap-10">
				<a href="/" className="flex items-center gap-2.5 lg:gap-3.5">
					<img src="/logo-mark.png" alt="Orbit logo" width={40} height={40} />
					<span className="leading-none">
						<span className="block bg-gradient-to-r from-slate-100 via-slate-300 to-slate-400 bg-clip-text text-lg lg:text-xl font-black tracking-[0.3em] text-transparent">
							ORBIT
						</span>
						<span className="mt-1 block text-[9px] lg:text-[10px] font-semibold uppercase tracking-[0.26em] text-slate-500">
							Web Designs <span className="text-electric">&</span> Marketing
						</span>
					</span>
				</a>

				<nav className="hidden items-center gap-4 lg:gap-7 lg:flex" aria-label="Main">
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

				<div className="flex items-center gap-2 lg:gap-3">
					<a
						href={whatsappLink(DEFAULT_WA_MESSAGE)}
						target="_blank"
						rel="noopener noreferrer"
						className="btn-gradient rounded-full px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-electric/25 hover:shadow-electric/40 md:px-6 md:py-2.5 md:text-sm"
					>
						10% off
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
				<nav className="animate-menu border-t border-white/5 px-4 pb-6 pt-3 md:hidden" aria-label="Mobile" style={{maxWidth: '320px', margin: '0 auto'}}>
					{NAV_LINKS.map((l) => (
						<a
							key={l.href}
							href={l.href}
							onClick={() => setOpen(false)}
							className={`block px-4 py-3 rounded-xl transition ${path === l.href ? "bg-electric/10 font-semibold text-white" : "text-slate-300 hover:text-white hover:bg-white/5"}`}
						>
							{l.label}
						</a>
					))}
					<a
						href={whatsappLink(DEFAULT_WA_MESSAGE)}
						target="_blank"
						rel="noopener noreferrer"
						className="btn-gradient mt-4 block rounded-full px-6 py-3 text-center text-sm font-semibold text-white shadow-lg shadow-electric/25"
					>
						Get 10% off
					</a>
				</nav>
			)}
		</header>
	);
}
