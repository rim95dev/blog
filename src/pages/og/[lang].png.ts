import type { APIRoute, GetStaticPaths } from 'astro';
import { getProfile } from '../../career';
import { LANGS, type Lang } from '../../lang';
import { renderCard } from '../../og';

// /og/ko.png, /og/en.png: the share card for every page in that language (src/og.ts)
export const getStaticPaths = (() => LANGS.map((lang) => ({ params: { lang } }))) satisfies GetStaticPaths;

export const GET: APIRoute = async ({ params }) => {
	const lang = params.lang as Lang;
	const profile = await getProfile();
	const png = await renderCard(`${profile.name[lang]} · ${profile.role[lang]}`);
	return new Response(png, { headers: { 'Content-Type': 'image/png' } });
};
