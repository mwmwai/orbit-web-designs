export const SITE_NAME = "Orbit Web Designs & Marketing";
export const SITE_URL = "https://orbitwebdesigns.co.ke";
export const SITE_EMAIL = "mwmwai@gmail.com";
export const SITE_PHONE_DISPLAY = "+254 741 992 308";

export const WHATSAPP_NUMBER = "254741992308";

export const DEFAULT_WA_MESSAGE =
	"Hi Orbit! I want a website for my business. I have my photos, text and logo ready — what package fits me?";

export function whatsappLink(message: string) {
	return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

export const NAV_LINKS = [
	{ href: "/", label: "Home" },
	{ href: "/services", label: "Services" },
	{ href: "/packages", label: "Packages" },
	{ href: "/about", label: "About" },
	{ href: "/guides", label: "Guides" },
	{ href: "/contact", label: "Contact" },
];

export const MORE_LINKS = [
	{ href: "/automation", label: "Agents & Workflows" },
	{ href: "/dashboards", label: "Dashboards" },
	{ href: "/mpesa-fee-calculator", label: "M-Pesa Calculator" },
	{ href: "/web-design-nairobi", label: "Web Design Nairobi" },
	{ href: "/mpesa-ecommerce-kenya", label: "M-Pesa Stores" },
	{ href: "/seo-services-kenya", label: "SEO Services" },
	{ href: "/reviews", label: "Reviews" },
	{ href: "/faq", label: "FAQ" },
	{ href: "/about", label: "About" },
	{ href: "/guides", label: "Guides" },
];


