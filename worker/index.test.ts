import { describe, expect, it } from 'vitest';
import worker from './index';

// ASSETS stand-in: echoes the requested path in the body. Unknown paths under /ko and /en are 404.
const assets = {
	fetch: async (input: Request | string | URL) => {
		const { pathname } = new URL(input instanceof Request ? input.url : input);
		const known = ['/ko', '/en', '/ko/notes', '/en/notes', '/robots.txt'];
		return new Response(pathname, {
			status: known.includes(pathname) ? 200 : 404,
			headers: { 'Cache-Control': 'public, max-age=0, must-revalidate' },
		});
	},
};
const env = { ASSETS: assets, PROD_HOST: 'rim95.dev' } as unknown as Env;

function get(url: string, headers: Record<string, string> = {}) {
	return worker.fetch(new Request(url, { headers }), env);
}

describe('worker', () => {
	it('serves the picked language page at the clean URL', async () => {
		const res = await get('https://rim95.dev/notes', { 'Accept-Language': 'ko-KR,ko;q=0.9' });
		expect(res.status).toBe(200);
		expect(await res.text()).toBe('/ko/notes');
		expect(res.headers.get('Content-Language')).toBe('ko');
		expect(res.headers.get('Vary')).toBe('Accept-Language, Cookie');
		expect(res.headers.get('Cache-Control')).toBe('private, no-cache');
		expect(res.headers.get('X-Robots-Tag')).toBeNull();
	});

	it('serves / as the language home', async () => {
		expect(await (await get('https://rim95.dev/')).text()).toBe('/en');
		expect(await (await get('https://rim95.dev/', { Cookie: 'lang=ko' })).text()).toBe('/ko');
	});

	it('passes language URLs and files through', async () => {
		const res = await get('https://rim95.dev/ko/notes', { 'Accept-Language': 'en' });
		expect(await res.text()).toBe('/ko/notes');
		expect(res.headers.get('Vary')).toBeNull();
		expect(await (await get('https://rim95.dev/robots.txt')).text()).toBe('/robots.txt');
	});

	it('drops a trailing slash with a 301', async () => {
		const res = await get('https://rim95.dev/notes/');
		expect(res.status).toBe(301);
		expect(res.headers.get('Location')).toBe('https://rim95.dev/notes');
	});

	it('redirects www to the apex with a 301, keeping path and query', async () => {
		const res = await get('https://www.rim95.dev/notes/abc?x=1');
		expect(res.status).toBe(301);
		expect(res.headers.get('Location')).toBe('https://rim95.dev/notes/abc?x=1');
	});

	it('adds noindex outside the production host', async () => {
		for (const url of ['https://rim95-dev.example.workers.dev/notes', 'https://rim95-dev.example.workers.dev/ko/notes']) {
			expect((await get(url)).headers.get('X-Robots-Tag'), url).toBe('noindex');
		}
	});

	it('sets security headers', async () => {
		const res = await get('https://rim95.dev/ko/notes');
		expect(res.headers.get('X-Content-Type-Options')).toBe('nosniff');
		expect(res.headers.get('Referrer-Policy')).toBe('strict-origin-when-cross-origin');
	});
});
