export const SITE_NAME = "Orbit Web Designs & Marketing";
export const SITE_URL = "https://orbitwebdesigns.co.ke";
export const SITE_EMAIL = "mwmwai@gmail.com";
export const SITE_PHONE_DISPLAY = "+254 741 992 308";

export const WHATSAPP_NUMBER = "254741992308";

export const DEFAULT_WA_MESSAGE =
	"Hi Orbit Web Designs & Marketing! I'd like to inquire about your web design or marketing services.";

export function whatsappLink(message: string) {
	return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

export const NAV_LINKS = [
	{ href: "/", label: "Home" },
	{ href: "/services", label: "Services" },
	{ href: "/packages", label: "Packages" },
	{ href: "/portfolio", label: "Our Work" },
	{ href: "/contact", label: "Contact" },
];


