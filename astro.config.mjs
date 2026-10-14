// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';

const CHANGEFREQ = {
	'/': 'weekly',
	'/packages': 'weekly',
	'/services': 'monthly',
	'/care': 'monthly',
	'/automation': 'monthly',
	'/saas': 'monthly',
	'/dashboards': 'monthly',
	'/faq': 'monthly',
	'/contact': 'yearly',
	'/about': 'yearly',
	'/blog/': 'weekly',
	'/cases/': 'monthly',
};

function getChangefreq(url) {
	let path = new URL(url).pathname;
	if (path.length > 1 && path.endsWith('/')) path = path.slice(0, -1);
	const entries = Object.entries(CHANGEFREQ)
		.map(([p, freq]) => [p.replace(/\/$/, '') || '/', freq])
		.sort((a, b) => b[0].length - a[0].length);
	for (const [key, freq] of entries) {
		if (key === '/') {
			if (path === '/') return freq;
			continue;
		}
		if (path === key || path.startsWith(key + '/')) return freq;
	}
	return 'monthly';
}
function getPriority(url) {
	if (url === 'https://www.orbitwebdesigns.co.ke/') return 1.0;
	if (url.includes('/packages') || url.includes('/services') || url.includes('/care')) return 0.9;
	if (url.includes('/blog/') || url.includes('/cases/')) return 0.8;
	if (url.includes('/automation') || url.includes('/saas') || url.includes('/dashboards')) return 0.8;
	if (url.includes('/faq') || url.includes('/contact') || url.includes('/about')) return 0.7;
	return 0.6;
}

const LASTMOD = {
	'/blog/website-cost-kenya': '2026-10-14',
	'/blog/website-care-kenya': '2026-10-14',
	'/blog/ecommerce-kenya-guide': '2026-10-14',
	'/blog/seo-small-business-kenya': '2026-10-14',
	'/blog/best-web-designer-kenya': '2026-10-14',
	'/blog/mpesa-till-vs-paybill': '2026-10-14',
	'/blog/whatsapp-business-kenya': '2026-10-14',
	'/blog/web-design-kenya-guide': '2026-10-14',
	'/blog/choose-web-designer-kenya': '2026-10-14',
	'/blog/orbit-vs-competitors': '2026-10-14',
	'/blog/mpesa-daraja-website-kenya': '2026-10-14',
	'/blog/business-not-showing-google-maps-kenya': '2026-10-14',
	'/blog/': '2026-10-14',
	'/reviews': '2026-10-14',
	'/': '2026-10-14',
	'/about': '2026-10-14',
	'/faq': '2026-10-14',
	'/packages': '2026-10-14',
	'/guides': '2026-10-14',
	'/review': '2026-10-14',
	'/saas': '2026-10-14',
	'/automation': '2026-10-14',
	'/dashboards': '2026-10-14',
	'/start': '2026-10-14',
	'/services': '2026-10-14',
	'/contact': '2026-10-14',
	'/care': '2026-10-14',
	'/cases/law-firm-nairobi': '2026-10-14',
	'/mpesa-ecommerce-kenya': '2026-10-14',
	'/seo-services-kenya': '2026-10-14',
	'/web-design-nairobi': '2026-10-14',
};
function getLastmod(url) {
	let path = new URL(url).pathname;
	if (path.length > 1 && path.endsWith('/')) path = path.slice(0, -1);
	if (LASTMOD[path]) return LASTMOD[path];
	if (LASTMOD[path + '/']) return LASTMOD[path + '/'];
	return '2026-10-05';
}

// https://astro.build/config
export default defineConfig({
	site: 'https://www.orbitwebdesigns.co.ke',
	compressHTML: true,
	integrations: [react(), sitemap({
		filter: (page) => !page.includes('/card') && !page.includes('/business-card'),
		serialize(item) {
			const images = [];
			const logoUrl = 'https://www.orbitwebdesigns.co.ke/logo.webp';
			if (item.url === 'https://www.orbitwebdesigns.co.ke/') {
				images.push({ url: logoUrl, title: 'Orbit Web Designs & Marketing', caption: 'Professional web design and marketing for growing businesses' });
			} else if (item.url.includes('/blog/')) {
				images.push({ url: logoUrl, title: 'Orbit Guides', caption: 'Free guides for small businesses' });
			} else if (item.url.includes('/packages')) {
				images.push({ url: logoUrl, title: 'Website Packages', caption: 'Starter 28,999 | Business 39,999 | Master 49,999 KES' });
			}
			return {
				...item,
				changefreq: getChangefreq(item.url),
				priority: getPriority(item.url),
				lastmod: getLastmod(item.url),
				img: images.length > 0 ? images : undefined,
			};
		},
	})],
	vite: {
		plugins: [tailwindcss()],
		build: {
			chunkSizeWarningLimit: 700,
		},
	},
});

