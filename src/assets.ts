/* assets.ts — logos and flags, referenced by file name from src/content/resume.yaml */

import type { ImageMetadata } from 'astro';

/** Flags in src/assets/flags. Adding one: the SVG file, this list, and a 'country.<code>' string in src/i18n.ts */
export const FLAGS = ['kr', 'ae', 'us'] as const;
export type Flag = (typeof FLAGS)[number];

const logos = import.meta.glob<ImageMetadata>('./assets/logos/*.png', { eager: true, import: 'default' });
const flags = import.meta.glob<ImageMetadata>('./assets/flags/*.svg', { eager: true, import: 'default' });

/** A logo in src/assets/logos by file name without the extension */
export function logo(name: string): ImageMetadata {
	const image = logos[`./assets/logos/${name}.png`];
	if (!image) throw new Error(`no logo src/assets/logos/${name}.png (used in src/content/resume.yaml)`);
	return image;
}

export function flag(code: Flag): ImageMetadata {
	const image = flags[`./assets/flags/${code}.svg`];
	if (!image) throw new Error(`no flag src/assets/flags/${code}.svg`);
	return image;
}
