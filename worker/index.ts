/* worker/index.ts
 * Cloudflare Worker for rim95.dev. The ASSETS binding serves the static build (dist/); this Worker sits in front and only:
 *  1. redirects www.rim95.dev → rim95.dev (301)
 *  2. serves clean URLs (/notes/abc) from the /ko or /en static page picked for the visitor (cookie > browser language), at the same URL
 *  3. adds noindex anywhere but the production host (workers.dev, previews, local)
 * /_astro/ (build output) is excluded from run_worker_first in wrangler.jsonc and never reaches this Worker.
 */

import { isCleanPath, pickLang, toLangPath } from '../src/lang';

const SECURITY_HEADERS: Record<string, string> = {
	'X-Content-Type-Options': 'nosniff',
	'Referrer-Policy': 'strict-origin-when-cross-origin',
	'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
};

export default {
	async fetch(request, env): Promise<Response> {
		const url = new URL(request.url);

		if (url.hostname === `www.${env.PROD_HOST}`) {
			url.hostname = env.PROD_HOST;
			return Response.redirect(url.toString(), 301);
		}

		const response = isCleanPath(url.pathname)
			? await serveClean(request, url, env)
			: await env.ASSETS.fetch(request);

		return finalize(response, url.hostname === env.PROD_HOST);
	},
} satisfies ExportedHandler<Env>;

async function serveClean(request: Request, url: URL, env: Env): Promise<Response> {
	if (url.pathname !== '/' && url.pathname.endsWith('/')) {
		url.pathname = url.pathname.replace(/\/+$/, '') || '/';
		return Response.redirect(url.toString(), 301);
	}

	const lang = pickLang(request.headers.get('Cookie'), request.headers.get('Accept-Language'));
	const target = new URL(url);
	target.pathname = toLangPath(lang, url.pathname);

	const asset = await env.ASSETS.fetch(new Request(target, request));
	const response = new Response(asset.body, asset);
	response.headers.set('Content-Language', lang);
	response.headers.set('Vary', 'Accept-Language, Cookie');
	// The same URL is a different language per visitor: no shared caching. Browsers revalidate every time (304 via ETag).
	response.headers.set('Cache-Control', 'private, no-cache');
	return response;
}

function finalize(response: Response, isProduction: boolean): Response {
	const out = new Response(response.body, response);
	for (const [name, value] of Object.entries(SECURITY_HEADERS)) out.headers.set(name, value);
	if (!isProduction) out.headers.set('X-Robots-Tag', 'noindex');
	return out;
}
