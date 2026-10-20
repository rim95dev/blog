/* dev-lang.ts — mimics the Worker's language picking on the dev server (astro dev) only.
 * Astro hides request headers while rendering static pages, so the rewrite from clean URL to language URL
 * happens in front of Astro, in the Vite dev server. In production worker/index.ts does the same with src/lang.ts.
 */

import type { AstroIntegration } from 'astro';
import { isCleanPath, pickLang, toLangPath } from '../src/lang';

export default function devLang(): AstroIntegration {
	return {
		name: 'dev-lang',
		hooks: {
			'astro:server:setup': ({ server }) => {
				server.middlewares.use((req, _res, next) => {
					const url = new URL(req.url ?? '/', 'http://localhost');
					if (req.method === 'GET' && isCleanPath(url.pathname) && !url.pathname.startsWith('/@')) {
						const header = (name: string) => {
							const value = req.headers[name];
							return Array.isArray(value) ? value.join(',') : (value ?? null);
						};
						const lang = pickLang(header('cookie'), header('accept-language'));
						req.url = toLangPath(lang, url.pathname.replace(/\/+$/, '') || '/') + url.search;
					}
					next();
				});
			},
		},
	};
}
