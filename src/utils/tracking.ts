import { GA_MEASUREMENT_ID, META_PIXEL_ID, WA_EVENTS } from "../config";

declare global {
	interface Window {
		gtag: (...args: unknown[]) => void;
		fbq: (...args: unknown[]) => void;
		dataLayer: unknown[];
	}
}

export function trackWhatsAppClick(eventName: keyof typeof WA_EVENTS, extraParams: Record<string, string | number> = {}) {
	const event = WA_EVENTS[eventName];

	if (typeof window !== "undefined") {
		if (GA_MEASUREMENT_ID && GA_MEASUREMENT_ID !== "G-XXXXXXXXXX" && window.gtag) {
			window.gtag("event", event, {
				event_category: "WhatsApp",
				event_label: eventName,
				...extraParams,
			});
		}

		if (META_PIXEL_ID && window.fbq) {
			window.fbq("track", "Contact", {
				content_name: eventName,
				...extraParams,
			});
		}
	}
}

export function initGA() {
	if (typeof window !== "undefined" && GA_MEASUREMENT_ID && GA_MEASUREMENT_ID !== "G-XXXXXXXXXX") {
		window.dataLayer = window.dataLayer || [];
		window.gtag = function gtag() {
			window.dataLayer.push(arguments);
		};
		window.gtag("js", new Date());
		window.gtag("config", GA_MEASUREMENT_ID, {
			page_path: window.location.pathname,
		});
	}
}

export function initMetaPixel() {
	if (typeof window !== "undefined" && META_PIXEL_ID) {
		!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
			n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
			n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
			t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
			document,'script','https://connect.facebook.net/en_US/fbevents.js');
		window.fbq("init", META_PIXEL_ID);
		window.fbq("track", "PageView");
	}
}