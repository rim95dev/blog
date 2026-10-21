import { describe, expect, it } from 'vitest';
import { firstLanguage, isCleanPath, pickLang, splitLangPath, toLangPath } from './lang';

describe('pickLang', () => {
	it('is ko when the top browser language is Korean', () => {
		expect(pickLang(null, 'ko-KR,ko;q=0.9,en-US;q=0.8')).toBe('ko');
		expect(pickLang(null, 'ko')).toBe('ko');
	});

	it('is en for any other language and for no header (crawlers)', () => {
		expect(pickLang(null, 'en-US,en;q=0.9,ko;q=0.8')).toBe('en');
		expect(pickLang(null, 'ja,ko;q=0.9')).toBe('en');
		expect(pickLang(null, null)).toBe('en');
		expect(pickLang(null, '')).toBe('en');
		expect(pickLang(null, '*')).toBe('en');
	});

	it('follows q values', () => {
		expect(pickLang(null, 'en;q=0.5,ko;q=0.8')).toBe('ko');
		expect(pickLang(null, 'ko;q=0,en')).toBe('en');
	});

	it('prefers the cookie over the browser language', () => {
		expect(pickLang('lang=en', 'ko-KR')).toBe('en');
		expect(pickLang('theme=dark; lang=ko', 'en-US')).toBe('ko');
	});

	it('ignores unknown cookie values', () => {
		expect(pickLang('lang=fr', 'ko-KR')).toBe('ko');
	});
});

describe('firstLanguage', () => {
	it('picks the highest q, earliest on ties', () => {
		expect(firstLanguage('fr-CH, fr;q=0.9, en;q=0.8')).toBe('fr-ch');
		expect(firstLanguage('en;q=0.8, ko;q=0.8')).toBe('en');
	});
});

describe('paths', () => {
	it('converts between clean and language URLs', () => {
		expect(toLangPath('ko', '/')).toBe('/ko');
		expect(toLangPath('en', '/notes/abc')).toBe('/en/notes/abc');
		expect(splitLangPath('/ko')).toEqual(['ko', '/']);
		expect(splitLangPath('/en/notes/abc')).toEqual(['en', '/notes/abc']);
		expect(splitLangPath('/kor/abc')).toBeNull();
		expect(splitLangPath('/notes')).toBeNull();
	});

	it('knows which paths the Worker picks a language for', () => {
		for (const path of ['/', '/notes', '/notes/', '/notes/abc', '/resume', '/kor']) {
			expect(isCleanPath(path), path).toBe(true);
		}
		for (const path of ['/ko', '/ko/', '/en/notes/abc', '/_astro/x.css', '/_image', '/robots.txt', '/ko/rss.xml', '/favicon.svg']) {
			expect(isCleanPath(path), path).toBe(false);
		}
	});
});
