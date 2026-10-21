/* worker/index.ts
 * Cloudflare Worker for rim95.dev. The ASSETS binding serves the static build (dist/); this Worker sits in front and only:
 *  1. redirects www.rim95.dev → rim95.dev (301)
 *  2. serves clean URLs (/notes/abc) from the /ko or /en static page picked for the visitor (cookie > browser language), at the same URL
 *  3. answers byte ranges for video (the ASSETS binding ignores Range and sends the whole file, and Safari will not play video that way)
 *  4. adds noindex anywhere but the production host (workers.dev, previews, local)
 * /_astro/ (build output) is excluded from run_worker_first in wrangler.jsonc and never reaches this Worker,
 * so videos live in public/ (served at their own paths), not next to the notes that import them.
 */

import { isCleanPath, pickLang, toLangPath } from '../src/lang';

/** Files served in byte ranges */
const RANGED = /\.(mp4|webm)$/i;

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
			: RANGED.test(url.pathname)
				? await serveRanged(request, env)
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

async function serveRanged(request: Request, env: Env): Promise<Response> {
	const headers = new Headers(request.headers);
	headers.delete('Range');
	const asset = await env.ASSETS.fetch(new Request(request.url, { method: 'GET', headers }));
	// 404, or 304 for a conditional request: nothing to slice
	if (asset.status !== 200) return asset;

	const body = await asset.arrayBuffer();
	const size = body.byteLength;
	const out = new Headers(asset.headers);
	out.set('Accept-Ranges', 'bytes');
	const head = request.method === 'HEAD';
	const range = parseRange(request.headers.get('Range'), size);
	if (range === undefined) {
		out.set('Content-Length', String(size));
		return new Response(head ? null : body, { status: 200, headers: out });
	}
	if (range === null) {
		out.set('Content-Range', `bytes */${size}`);
		out.delete('Content-Length');
		return new Response(null, { status: 416, headers: out });
	}
	const [start, end] = range;
	out.set('Content-Range', `bytes ${start}-${end}/${size}`);
	out.set('Content-Length', String(end - start + 1));
	return new Response(head ? null : body.slice(start, end + 1), { status: 206, headers: out });
}

/**
 * A single 'bytes=…' range as [start, end] (inclusive): 'bytes=0-99', 'bytes=100-', 'bytes=-100' (the last 100 bytes).
 * undefined when there is no header or it cannot be used (several ranges, other units): send the whole file.
 * null when it cannot be satisfied (starts past the end): 416.
 */
export function parseRange(header: string | null, size: number): [number, number] | null | undefined {
	const match = header ? /^bytes=(\d*)-(\d*)$/.exec(header.trim()) : null;
	if (!match || (match[1] === '' && match[2] === '')) return undefined;
	if (match[1] === '') {
		const suffix = Number(match[2]);
		if (suffix === 0) return null;
		return [Math.max(0, size - suffix), size - 1];
	}
	const start = Number(match[1]);
	const end = match[2] === '' ? size - 1 : Math.min(Number(match[2]), size - 1);
	if (start >= size || end < start) return null;
	return [start, end];
}

function finalize(response: Response, isProduction: boolean): Response {
	const out = new Response(response.body, response);
	for (const [name, value] of Object.entries(SECURITY_HEADERS)) out.headers.set(name, value);
	if (!isProduction) out.headers.set('X-Robots-Tag', 'noindex');
	return out;
}
