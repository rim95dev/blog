/* notes.ts — reading notes. Whether a note is public (draft, scheduled) is decided here and nowhere else. */

import { getCollection, type CollectionEntry } from 'astro:content';
import { SHOW_DRAFTS } from 'astro:env/server';
import { isLang, LANGS, type Lang } from './lang';

export interface Note {
	slug: string;
	lang: Lang;
	entry: CollectionEntry<'notes'>;
}

const showAll = import.meta.env.DEV || SHOW_DRAFTS;

/** Public when not a draft and pubDate has passed. A date-only pubDate goes live with the first build after 00:00 UTC (09:00 KST) that day. */
function isPublished(entry: CollectionEntry<'notes'>, now: Date): boolean {
	return showAll || (!entry.data.draft && entry.data.pubDate <= now);
}

function toNote(entry: CollectionEntry<'notes'>): Note {
	const [slug, lang] = entry.id.split('/');
	if (!slug || !isLang(lang)) throw new Error(`note path is not <slug>/<ko|en>: ${entry.id}`);
	return { slug, lang, entry };
}

/** All public notes in every language, newest first */
export async function getAllNotes(): Promise<Note[]> {
	const now = new Date();
	const entries = await getCollection('notes', (entry) => isPublished(entry, now));
	return entries
		.map(toNote)
		.sort((a, b) => b.entry.data.pubDate.getTime() - a.entry.data.pubDate.getTime());
}

export async function getNotes(lang: Lang): Promise<Note[]> {
	return (await getAllNotes()).filter((note) => note.lang === lang);
}

/** slug → languages the note exists in */
export async function getNoteLangs(): Promise<Map<string, Lang[]>> {
	const map = new Map<string, Lang[]>();
	for (const note of await getAllNotes()) {
		const langs = map.get(note.slug) ?? [];
		langs.push(note.lang);
		map.set(note.slug, langs);
	}
	for (const langs of map.values()) langs.sort((a, b) => LANGS.indexOf(a) - LANGS.indexOf(b));
	return map;
}

/** Minutes to read: about 500 characters a minute in Korean, 230 words a minute in English */
export function readingMinutes(note: Note): number {
	const body = note.entry.body ?? '';
	const amount = note.lang === 'ko' ? body.replace(/\s/g, '').length / 500 : body.split(/\s+/).filter(Boolean).length / 230;
	return Math.max(1, Math.round(amount));
}
