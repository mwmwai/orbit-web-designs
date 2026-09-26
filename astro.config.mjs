// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
	site: 'https://orbitwebdesigns.co.ke',
	compressHTML: true,
	integrations: [react(), sitemap({
		filter: (page) => !page.includes('/card') && !page.includes('/business-card'),
	})],
	vite: {
		plugins: [tailwindcss()],
		build: {
			chunkSizeWarningLimit: 700,
		},
	},
});

