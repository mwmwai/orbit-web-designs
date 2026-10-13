import rss from "@astrojs/rss";
import { SITE_URL, SITE_NAME } from "../config";

const posts = [
	{
		slug: "website-cost-kenya",
		title: "How much does a website cost in Kenya?",
		blurb: "Market range 5k–250k, breakdown table + hidden-cost checklist. Works with any designer.",
		date: "2026-09-11",
		updated: "2026-10-03",
	},
	{
		slug: "website-care-kenya",
		title: "Website care in Kenya: DIY vs managed",
		blurb: "30-min/month DIY routine with free tools + what Orbit Care 4,999–9,999 actually covers.",
		date: "2026-09-18",
		updated: "2026-10-03",
	},
	{
		slug: "ecommerce-kenya-guide",
		title: "E-commerce in Kenya: launch checklist",
		blurb: "4 systems + margin math + pre-launch checklist. Try your fees in the calculator.",
		date: "2026-09-25",
		updated: "2026-10-03",
	},
	{
		slug: "seo-small-business-kenya",
		title: "SEO for small businesses: 30-day plan",
		blurb: "Business Profile, buyer keywords, speed and reviews — copy-paste weekly plan.",
		date: "2026-10-02",
		updated: "2026-10-03",
	},
	{
		slug: "best-web-designer-kenya",
		title: "How to choose a web designer: scorecard",
		blurb: "Neutral 6-question scorecard + red flags — score any quote, including ours.",
		date: "2026-09-11",
		updated: "2026-10-03",
	},
	{
		slug: "mpesa-till-vs-paybill",
		title: "M-Pesa Till vs Paybill: pick right once",
		blurb: "Decision tree + fee table — walk-in vs tracked money, tested with calculator.",
		date: "2026-09-20",
		updated: "2026-10-03",
	},
	{
		slug: "whatsapp-business-kenya",
		title: "Turn WhatsApp into your best salesperson",
		blurb: "Profile, greeting/away, quick replies (/price) and wa.me link — copy-paste templates.",
		date: "2026-10-01",
		updated: "2026-10-03",
	},
	{
		slug: "web-design-kenya-guide",
		title: "Web Design Kenya: The Complete Guide",
		blurb: "3000+ word definitive guide: pricing, process, M-Pesa, SEO, and how to pick a designer.",
		date: "2026-09-28",
		updated: "2026-10-03",
	},
	{
		slug: "choose-web-designer-kenya",
		title: "How to Choose a Web Designer in Kenya",
		blurb: "Decision framework with scoring rubric — budget, timeline, M-Pesa, ownership, support.",
		date: "2026-09-15",
		updated: "2026-10-03",
	},
	{
		slug: "orbit-vs-competitors",
		title: "Orbit vs Competitors: Honest Comparison",
		blurb: "Head-to-head vs freelancers, agencies, DIY — on price, speed, M-Pesa, ownership, support.",
		date: "2026-10-04",
		updated: "2026-10-04",
	},
	{
		slug: "mpesa-daraja-website-kenya",
		title: "M-Pesa Daraja on Your Site: Till + Paybill + Cards",
		blurb: "STK flow, fees and limits, setup timeline — Till vs Paybill vs cards, how it works.",
		date: "2026-09-22",
		updated: "2026-10-03",
	},
	{
		slug: "business-not-showing-google-maps-kenya",
		title: "Why Your Business Isn't on Google Maps",
		blurb: "1-day diagnostic: claim, verify, category, duplicates — plus the website fix that holds rankings.",
		date: "2026-10-05",
		updated: "2026-10-05",
	},
];

export async function GET() {
	return rss({
		title: `${SITE_NAME} Guides`,
		description: "Free guides for Kenyan SMEs: website pricing, SEO basics, M-Pesa selling and growth tactics.",
		site: SITE_URL,
		items: posts.map((p) => ({
			title: p.title,
			link: `/blog/${p.slug}`,
			description: p.blurb,
			pubDate: new Date(p.date),
			updatedDate: new Date(p.updated),
		})),
		customData: `<language>en-KE</language>`,
		xmlns: {
			atom: "http://www.w3.org/2005/Atom",
		},
	});
}