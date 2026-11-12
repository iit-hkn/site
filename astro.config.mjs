// @ts-check

import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { defineConfig, fontProviders } from 'astro/config';

// https://astro.build/config
export default defineConfig({
	site: 'https://iit-hkn.github.io/',
	base: '/site',
	integrations: [mdx(), sitemap()],
	// Free stand-ins for Illinois Tech's brand fonts (Futura / Neue Haas Grotesk, which are licensed).
	fonts: [
		{
			provider: fontProviders.google(),
			name: 'Jost',
			cssVariable: '--font-heading',
			weights: [400, 600, 700],
			styles: ['normal'],
			fallbacks: ['Futura', 'sans-serif'],
		},
		{
			provider: fontProviders.google(),
			name: 'Source Sans 3',
			cssVariable: '--font-body',
			weights: [400, 600, 700],
			styles: ['normal', 'italic'],
			fallbacks: ['sans-serif'],
		},
	],
});
