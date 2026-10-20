// @ts-check
import { defineConfig, envField } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import codeFigure from './integrations/code-figure.ts';
import devLang from './integrations/dev-lang.ts';

// Every page is built as static HTML under /ko/… and /en/…. Language-free clean URLs are handled by the Worker (worker/index.ts).
export default defineConfig({
	site: 'https://rim95.dev',
	trailingSlash: 'never',
	build: { format: 'file' },
	env: {
		schema: {
			// When true, drafts and scheduled notes (future pubDate) are built too — for preview builds. The dev server always shows them.
			SHOW_DRAFTS: envField.boolean({ context: 'server', access: 'public', default: false }),
		},
	},
	markdown: {
		shikiConfig: {
			// GitHub colors; light-dark() follows the page's color-scheme (system or the theme button)
			themes: { light: 'github-light-default', dark: 'github-dark-default' },
			defaultColor: 'light-dark()',
			transformers: [codeFigure()],
		},
	},
	integrations: [
		devLang(),
		mdx(),
		sitemap({
			i18n: { defaultLocale: 'en', locales: { en: 'en', ko: 'ko' } },
			filter: (page) => !/\/404$/.test(page),
		}),
	],
});
