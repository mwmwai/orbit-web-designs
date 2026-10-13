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
	'/design': 'monthly',
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
	if (url.includes('/automation') || url.includes('/design') || url.includes('/saas') || url.includes('/dashboards')) return 0.8;
	if (url.includes('/faq') || url.includes('/contact') || url.includes('/about')) return 0.7;
	return 0.6;
}

const LASTMOD = {
	'/blog/website-cost-kenya': '2026-10-13',
	'/blog/website-care-kenya': '2026-10-13',
	'/blog/ecommerce-kenya-guide': '2026-10-13',
	'/blog/seo-small-business-kenya': '2026-10-13',
	'/blog/best-web-designer-kenya': '2026-10-13',
	'/blog/mpesa-till-vs-paybill': '2026-10-13',
	'/blog/whatsapp-business-kenya': '2026-10-13',
	'/blog/web-design-kenya-guide': '2026-10-13',
	'/blog/choose-web-designer-kenya': '2026-10-13',
	'/blog/orbit-vs-competitors': '2026-10-13',
	'/blog/mpesa-daraja-website-kenya': '2026-10-13',
	'/blog/business-not-showing-google-maps-kenya': '2026-10-13',
	'/blog/': '2026-10-13',
	'/reviews': '2026-10-13',
	'/': '2026-10-13',
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
				images.push({ url: logoUrl, title: 'Orbit Web Designs & Marketing', caption: 'Professional web design and marketing for Kenyan businesses' });
			} else if (item.url.includes('/blog/')) {
				images.push({ url: logoUrl, title: 'Orbit Guides', caption: 'Free guides for Kenyan SMEs' });
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

