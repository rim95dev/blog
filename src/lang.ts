/* lang.ts
 * Language rules in one place, shared by Astro pages, the dev-server integration and the Cloudflare Worker (no Astro imports).
 * People see language-free "clean" URLs (/notes/abc); crawlers get language URLs (/ko/notes/abc). See docs/architecture.md.
 */

export const LANGS = ['ko', 'en'] as const;
export type Lang = (typeof LANGS)[number];

/** Served to every non-Korean visitor and to crawlers that send no language. Also the hreflang x-default. */
export const DEFAULT_LANG: Lang = 'en';

/** Remembers the chosen language. Set when a visitor lands on a language URL or presses the language switch. */
export const LANG_COOKIE = 'lang';

export function isLang(value: unknown): value is Lang {
	return typeof value === 'string' && (LANGS as readonly string[]).includes(value);
}

/** The cookie wins; otherwise Korean only when the browser's top language is Korean. */
export function pickLang(cookieHeader: string | null, acceptLanguage: string | null): Lang {
	const chosen = readCookie(cookieHeader, LANG_COOKIE);
	if (isLang(chosen)) return chosen;
	return firstLanguage(acceptLanguage)?.startsWith('ko') ? 'ko' : DEFAULT_LANG;
}

/** The Accept-Language tag with the highest q (earliest on ties), or null. */
export function firstLanguage(acceptLanguage: string | null): string | null {
	if (!acceptLanguage) return null;
	let best: { tag: string; q: number } | null = null;
	for (const part of acceptLanguage.split(',')) {
		const [rawTag, ...params] = part.trim().split(';');
		const tag = rawTag?.trim().toLowerCase();
		if (!tag || tag === '*') continue;
		const qParam = params.map((p) => p.trim()).find((p) => p.startsWith('q='));
		const q = qParam ? Number(qParam.slice(2)) : 1;
		if (!Number.isFinite(q) || q <= 0) continue;
		if (!best || q > best.q) best = { tag, q };
	}
	return best?.tag ?? null;
}

export function readCookie(cookieHeader: string | null, name: string): string | null {
	if (!cookieHeader) return null;
	for (const pair of cookieHeader.split(';')) {
		const eq = pair.indexOf('=');
		if (eq < 0) continue;
		if (pair.slice(0, eq).trim() === name) return pair.slice(eq + 1).trim();
	}
	return null;
}

/** Clean URL → language URL. '/' → '/ko', '/notes/abc' → '/ko/notes/abc'. */
export function toLangPath(lang: Lang, cleanPath: string): string {
	return cleanPath === '/' ? `/${lang}` : `/${lang}${cleanPath}`;
}

/** [lang, clean URL] for a language URL, otherwise null. */
export function splitLangPath(path: string): [Lang, string] | null {
	const match = /^\/(ko|en)(\/.*)?$/.exec(path);
	if (!match) return null;
	return [match[1] as Lang, match[2] || '/'];
}

/**
 * Whether a path is a clean URL that needs a language picked. Language URLs, build output (/_astro/)
 * and files with an extension (robots.txt etc.) are not. Paths with a trailing slash count too
 * (the Worker answers them with a 301 that drops the slash).
 */
export function isCleanPath(path: string): boolean {
	if (splitLangPath(path.replace(/\/+$/, '') || '/')) return false;
	if (path.startsWith('/_astro/')) return false;
	const last = path.split('/').filter(Boolean).pop() ?? '';
	return !last.includes('.');
}
