/* i18n.ts — UI strings (labels, headings) per language. Note bodies and profile text live in src/content; only fixed UI text belongs here.
 * {name} placeholders are filled by t(lang, key, { name: … }).
 */

import type { Lang } from './lang';

const ko = {
	'site.description': 'rim95dev의 개발 블로그',
	'nav.notes': 'Notes',
	'nav.career': 'Career',
	'lang.name': '한국어',
	'theme.toggle': '테마 바꾸기',
	'search.label': '검색',
	'search.placeholder': '페이지 검색',
	'search.page': '페이지',
	'search.move': '이동',
	'search.open': '열기',
	'search.close': '닫기',
	'home.career': '경력',
	'home.recent': '최근 노트',
	'home.viewAll': '전체 보기',
	'notes.title': '노트',
	'notes.all': '전체',
	'notes.empty': '작성한 글이 없습니다',
	'note.toc': '목차',
	'note.readTime': '읽는 데 {n}분',
	'note.updated': '수정 {date}',
	'note.prev': '이전 노트',
	'note.next': '다음 노트',
	'note.copy': '복사',
	'note.copied': '복사됨',
	'resume.title': '경력',
	'resume.experience': '경력',
	'resume.education': '학력',
	'resume.etc': '기타',
	'resume.current': '현재',
	'resume.contact': '연락',
	'resume.present': '현재',
	'resume.now': '현 {name}',
	'resume.exclude': '{label} {d} 제외',
	'resume.research': '+ {label} {d}',
	'country.kr': '대한민국',
	'country.ae': '아랍에미리트',
	'country.us': '미국',
	'notFound.title': '페이지를 찾을 수 없습니다',
	'notFound.home': '홈으로',
	'notFound.notes': '노트 보기',
};

const en: Record<keyof typeof ko, string> = {
	'site.description': "rim95dev's developer blog",
	'nav.notes': 'Notes',
	'nav.career': 'Career',
	'lang.name': 'English',
	'theme.toggle': 'Toggle theme',
	'search.label': 'Search',
	'search.placeholder': 'Search pages',
	'search.page': 'page',
	'search.move': 'move',
	'search.open': 'open',
	'search.close': 'close',
	'home.career': 'Career',
	'home.recent': 'Recent notes',
	'home.viewAll': 'View all',
	'notes.title': 'Notes',
	'notes.all': 'All',
	'notes.empty': 'No posts yet',
	'note.toc': 'Contents',
	'note.readTime': '{n} min read',
	'note.updated': 'Updated {date}',
	'note.prev': 'Previous',
	'note.next': 'Next',
	'note.copy': 'Copy',
	'note.copied': 'Copied',
	'resume.title': 'Career',
	'resume.experience': 'Experience',
	'resume.education': 'Education',
	'resume.etc': 'Etc.',
	'resume.current': 'Current',
	'resume.contact': 'Contact',
	'resume.present': 'Present',
	'resume.now': 'now {name}',
	'resume.exclude': 'excl. {d} of {label}',
	'resume.research': '+ {d} {label}',
	'country.kr': 'South Korea',
	'country.ae': 'UAE',
	'country.us': 'United States',
	'notFound.title': 'Page not found',
	'notFound.home': 'Home',
	'notFound.notes': 'Notes',
};

const UI: Record<Lang, Record<keyof typeof ko, string>> = { ko, en };

export type UiKey = keyof typeof ko;

export function t(lang: Lang, key: UiKey, vars: Record<string, string | number> = {}): string {
	return UI[lang][key].replace(/\{(\w+)\}/g, (match, name: string) => String(vars[name] ?? match));
}

/** og:locale values */
export const OG_LOCALE: Record<Lang, string> = { ko: 'ko_KR', en: 'en_US' };

/** 2026.10.20 (Korean time) in both languages */
export function formatDate(date: Date): string {
	const kst = new Date(date.getTime() + 9 * 3600_000);
	const pad = (n: number) => String(n).padStart(2, '0');
	return `${kst.getUTCFullYear()}.${pad(kst.getUTCMonth() + 1)}.${pad(kst.getUTCDate())}`;
}

/** 21 → '1 yr 9 mos' (and the Korean equivalent) */
export function formatDuration(lang: Lang, months: number): string {
	const y = Math.floor(months / 12);
	const m = months % 12;
	if (lang === 'ko') return [y && `${y}년`, m && `${m}개월`].filter(Boolean).join(' ');
	return [y && `${y} yr${y > 1 ? 's' : ''}`, m && `${m} mo${m > 1 ? 's' : ''}`].filter(Boolean).join(' ');
}

/** Rounded to whole years (education): '4 yrs' */
export function formatYears(lang: Lang, months: number): string {
	const y = Math.round(months / 12);
	return lang === 'ko' ? `${y}년` : `${y} yr${y > 1 ? 's' : ''}`;
}
