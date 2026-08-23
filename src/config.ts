export const WHATSAPP_NUMBER = "254741992308";

export const DEFAULT_WA_MESSAGE =
	"Hi Orbit Web Designs & Marketing! I'd like to inquire about your web design or marketing services.";

export function whatsappLink(message: string) {
	return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

