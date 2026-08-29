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
	{ href: "/mpesa-fee-calculator", label: "M-Pesa Calculator" },
	{ href: "/contact", label: "Contact" },
];

// SEO Config
export const SITE_DESCRIPTION = "Orbit designs fast, secure websites and runs marketing that gets businesses found, trusted and paid. Custom builds from KES 20,000 — worldwide, fully remote.";
export const SITE_KEYWORDS = "web design Kenya, website design Nairobi, e-commerce developer Kenya, M-Pesa integration, landing page design, PageSpeed optimization, digital marketing agency Nairobi";
export const SITE_OG_IMAGE = "/og-image.png";

// Business Info for Schema
export const BUSINESS_INFO = {
	name: SITE_NAME,
	url: SITE_URL,
	logo: `${SITE_URL}/logo.png`,
	email: SITE_EMAIL,
	telephone: `+${WHATSAPP_NUMBER}`,
	address: {
		"@type": "PostalAddress",
		addressLocality: "Nairobi",
		addressCountry: "KE",
	},
	geo: {
		"@type": "GeoCoordinates",
		latitude: "-1.2921",
		longitude: "36.8219",
	},
	openingHours: "Mo-Sa 08:00-22:00",
	priceRange: "KES 20,000 - KES 90,000",
	areaServed: ["Kenya", "East Africa", "Worldwide"],
	sameAs: [
		"https://wa.me/254741992308",
		"https://www.linkedin.com/company/orbit-web-designs",
	],
};

// Analytics / Tracking
export const GA_MEASUREMENT_ID = import.meta.env.PUBLIC_GA_ID || "G-XXXXXXXXXX"; // Set in .env
export const META_PIXEL_ID = import.meta.env.PUBLIC_META_PIXEL_ID || ""; // Set in .env

// WhatsApp click tracking event names
export const WA_EVENTS = {
	click: "click_whatsapp",
	hero_cta: "hero_cta_whatsapp",
	navbar: "navbar_whatsapp",
	floating: "floating_whatsapp",
	contact_form: "contact_form_whatsapp",
	card_page: "card_page_whatsapp",
} as const;


