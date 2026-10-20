/* sprite.ts — the 32 × 32 pixel character, shared by the canvas character (src/character/mount.ts) and the icons (src/character/icons.ts).
 * Each letter is a palette index ('a' = 0); '.' is transparent.
 */

export const SPRITE = {
	size: 32,
	palette: ['#000000', '#d68e65', '#ffaec9', '#b97a57', '#946246', '#422c1f', '#fffffe'],
	rows: [
		'................................',
		'................................',
		'................................',
		'................................',
		'.......aa...aa..................',
		'......abba.abba.................',
		'......acda.acda.................',
		'......acda.acdba................',
		'......acdbaaccda................',
		'......accdbaacda................',
		'.......acddbaddaaaa.............',
		'.......adddddddbbbbaa...........',
		'........addddddddddbba..........',
		'........addddddddddddba.........',
		'.......aeddddfffddddfff.........',
		'.......aedddfgggfddfgggf........',
		'.......aedddfgfgfddfgfgf........',
		'.......aedddfgggfddfgggf........',
		'.......aeddddfffddddfffa........',
		'.......aedddddddddddddda........',
		'.......aeedddddddffdddea........',
		'........aeeddddddddddea.........',
		'.........aaeeeeeeeeeea..........',
		'...........aaaaaaaaaa...........',
		'.........aaeeeddddddeaa.........',
		'........aeeeddddddddddea........',
		'.......aeeeddddddddddddea.......',
		'......aeeeddddddddddddddea......',
		'......aeeeddddddddddddddea......',
		'......aeeedddddbbbbbddddea......',
		'......aeeeddddbbbbbbbdddea......',
		'......aeeeddddbbbbbbbdddea......',
	],
} as const;

/** A rectangle of the sprite in dots: x, y, width, height */
export type Crop = readonly [number, number, number, number];

/** The whole body without the empty border (the footer character) */
export const BODY: Crop = [6, 4, 20, 28];
/** The whole body centered in a square (favicons) */
export const SQUARE: Crop = [2, 4, 28, 28];

/** Rows of a crop, '.' for transparent */
export function cropRows([x, y, w, h]: Crop): string[] {
	return SPRITE.rows.slice(y, y + h).map((row) => row.slice(x, x + w));
}

/** Palette color of a sprite letter, or null for '.' */
export function colorOf(ch: string): string | null {
	return ch === '.' ? null : (SPRITE.palette[ch.charCodeAt(0) - 97] ?? null);
}
