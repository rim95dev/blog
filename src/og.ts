/* og.ts — the share card (og:image, 1200 × 630) used by every page: the whole character and rim95.dev, centered in a dark terminal window.
 * Rendered at build time: satori lays out the card and turns the text into paths (SVG), sharp turns the SVG into PNG.
 * Every position is a whole pixel so the dots stay sharp.
 */

import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import satori from 'satori';
import sharp from 'sharp';
import { spritePng } from './character/icons';
import { BODY } from './character/sprite';

export const CARD = { width: 1200, height: 630 } as const;

/** Dark theme colors (src/styles/global.css) */
const COLOR = { bg: '#0a0e14', surface: '#0f141b', line: '#1c232d', fg: '#c7d0d9', muted: '#6c7680', faint: '#4d5560', text: '#8b949e' };
/** The logo's hover rainbow */
const RAINBOW = 'linear-gradient(90deg, #ff6b6b, #ffb347, #ffe066, #7ee787, #63c5ff, #a78bfa, #ff7eb6)';

// satori needs static TTF, OTF or WOFF files (the site itself uses the variable WOFF2 versions)
const font = (path: string) => readFile(join(process.cwd(), 'node_modules', path));
let fonts: Promise<{ name: string; data: Buffer; weight: 400 | 600 }[]> | undefined;
const loadFonts = () =>
	(fonts ??= Promise.all([
		font('@fontsource/jetbrains-mono/files/jetbrains-mono-latin-400-normal.woff').then((data) => ({ name: 'JetBrains Mono', data, weight: 400 as const })),
		font('@fontsource/jetbrains-mono/files/jetbrains-mono-latin-600-normal.woff').then((data) => ({ name: 'JetBrains Mono', data, weight: 600 as const })),
		font('pretendard/dist/public/static/Pretendard-Regular.otf').then((data) => ({ name: 'Pretendard', data, weight: 400 as const })),
	]));

interface Node {
	type: string;
	props: { style?: Record<string, string | number>; src?: string; width?: number; height?: number; children?: Node | (Node | string)[] | string };
}
const div = (style: Record<string, string | number>, children?: Node['props']['children']): Node => ({ type: 'div', props: { style: { display: 'flex', ...style }, children } });

/** PNG of the card; `caption` is the line under the address ('TaeRim Lee · Blockchain engineer') */
export async function renderCard(caption: string): Promise<Uint8Array<ArrayBuffer>> {
	const dot = 9;
	const [, , w, h] = BODY;
	const art = { width: w * dot, height: h * dot };
	const src = `data:image/png;base64,${Buffer.from(spritePng(BODY, dot)).toString('base64')}`;

	const win = { x: 40, y: 40, width: CARD.width - 80, height: CARD.height - 80 };
	const bar = 62;
	const site = 76;
	const captionSize = 28;
	const gaps = [28, 18];
	// Character, address and caption stacked in the middle of the window body
	const bodyTop = win.y + bar;
	const total = art.height + gaps[0]! + site + gaps[1]! + captionSize;
	const artTop = bodyTop + Math.round((win.y + win.height - bodyTop - total) / 2);
	const siteTop = artTop + art.height + gaps[0]!;
	const captionTop = siteTop + site + gaps[1]!;
	const centered = (top: number, size: number, children: Node['props']['children'], style: Record<string, string | number> = {}) =>
		div({ position: 'absolute', left: win.x, top, width: win.width, height: size, justifyContent: 'center', alignItems: 'center', ...style }, children);

	const card = div({ position: 'relative', width: CARD.width, height: CARD.height, background: COLOR.bg }, [
		div({ position: 'absolute', left: win.x, top: win.y, width: win.width, height: win.height, background: COLOR.surface, border: `2px solid ${COLOR.line}`, borderRadius: 18 }),
		// Title bar: three dots, the address and a line under them
		div({ position: 'absolute', left: win.x + 28, top: win.y + 2, height: bar - 2, alignItems: 'center', fontFamily: 'JetBrains Mono', fontSize: 22, color: COLOR.muted }, [
			div({ color: COLOR.faint, fontSize: 16, letterSpacing: 6, marginRight: 22 }, '●●●'),
			'rim95.dev',
		]),
		div({ position: 'absolute', left: win.x + 2, top: win.y + bar, width: win.width - 4, height: 2, background: COLOR.line }),
		{ type: 'img', props: { src, width: art.width, height: art.height, style: { position: 'absolute', left: (CARD.width - art.width) / 2, top: artTop } } },
		centered(siteTop, site, [div({ color: COLOR.fg }, 'rim95'), div({ backgroundImage: RAINBOW, backgroundClip: 'text', color: 'transparent' }, '.dev')], {
			fontFamily: 'JetBrains Mono',
			fontWeight: 600,
			fontSize: site,
			letterSpacing: '-0.02em',
		}),
		centered(captionTop, captionSize, caption, { fontFamily: 'Pretendard', fontSize: captionSize, color: COLOR.text }),
	]);

	const svg = await satori(card as unknown as Parameters<typeof satori>[0], { ...CARD, fonts: await loadFonts() });
	return new Uint8Array(await sharp(Buffer.from(svg)).png().toBuffer());
}
