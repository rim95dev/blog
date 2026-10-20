import rss from '@astrojs/rss';
import type { APIRoute, GetStaticPaths } from 'astro';
import { t } from '../../i18n';
import { LANGS, toLangPath, type Lang } from '../../lang';
import { getNotes } from '../../notes';
import { SITE } from '../../site';

export const getStaticPaths = (() => LANGS.map((lang) => ({ params: { lang } }))) satisfies GetStaticPaths;

// Feed links are language URLs: they open in the subscribed language, then the address bar shows the clean URL.
export const GET: APIRoute = async ({ params }) => {
	const lang = params.lang as Lang;
	const notes = await getNotes(lang);
	return rss({
		title: SITE.name,
		description: t(lang, 'site.description'),
		site: SITE.url,
		items: notes.map(({ slug, entry }) => ({
			title: entry.data.title,
			description: entry.data.description,
			pubDate: entry.data.pubDate,
			link: toLangPath(lang, `/notes/${slug}`),
			categories: entry.data.tags,
		})),
		customData: `<language>${lang}</language>`,
	});
};
