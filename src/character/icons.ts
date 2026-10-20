/* icons.ts — favicon and touch icon drawn from the sprite at build time (src/pages/favicon.svg.ts and friends).
 * Pixel art scales by whole numbers only, so each icon size is a multiple of the crop size.
 */

import { crc32, deflateSync } from 'node:zlib';
import { colorOf, cropRows, type Crop } from './sprite';

/** SVG with one rect per dot */
export function spriteSvg(crop: Crop): string {
	const [, , w, h] = crop;
	const rects = cropRows(crop).flatMap((row, y) =>
		[...row].flatMap((ch, x) => {
			const color = colorOf(ch);
			return color ? [`<rect x="${x}" y="${y}" width="1" height="1" fill="${color}"/>`] : [];
		}),
	);
	return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" shape-rendering="crispEdges">${rects.join('')}</svg>`;
}

/** PNG of the crop, each dot scale × scale pixels, on a solid background (or transparent) */
export function spritePng(crop: Crop, scale: number, background?: string): Uint8Array<ArrayBuffer> {
	const [, , w, h] = crop;
	const rows = cropRows(crop);
	const width = w * scale;
	const height = h * scale;
	const bg = background ? rgba(background) : [0, 0, 0, 0];
	// Each scanline starts with filter byte 0 (none)
	const raw = Buffer.alloc(height * (width * 4 + 1));
	for (let py = 0; py < height; py++) {
		const line = py * (width * 4 + 1);
		for (let px = 0; px < width; px++) {
			const color = colorOf(rows[Math.floor(py / scale)]?.[Math.floor(px / scale)] ?? '.');
			raw.set(color ? rgba(color) : bg, line + 1 + px * 4);
		}
	}
	const header = Buffer.alloc(13);
	header.writeUInt32BE(width, 0);
	header.writeUInt32BE(height, 4);
	header.set([8, 6, 0, 0, 0], 8); // 8-bit RGBA, no interlace
	return new Uint8Array(Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', header), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]));
}

/** ICO holding one PNG image (supported by every browser that reads /favicon.ico) */
export function pngIco(png: Uint8Array, size: number): Uint8Array<ArrayBuffer> {
	const header = Buffer.alloc(22);
	header.writeUInt16LE(0, 0);
	header.writeUInt16LE(1, 2); // icon
	header.writeUInt16LE(1, 4); // one image
	header.writeUInt8(size >= 256 ? 0 : size, 6);
	header.writeUInt8(size >= 256 ? 0 : size, 7);
	header.writeUInt16LE(1, 10); // color planes
	header.writeUInt16LE(32, 12); // bits per pixel
	header.writeUInt32LE(png.length, 14);
	header.writeUInt32LE(22, 18); // image data offset
	return new Uint8Array(Buffer.concat([header, png]));
}

function chunk(type: string, data: Buffer): Buffer {
	const length = Buffer.alloc(4);
	length.writeUInt32BE(data.length);
	const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
	const crc = Buffer.alloc(4);
	crc.writeUInt32BE(crc32(body));
	return Buffer.concat([length, body, crc]);
}

function rgba(hex: string): number[] {
	const n = Number.parseInt(hex.slice(1), 16);
	return [(n >> 16) & 255, (n >> 8) & 255, n & 255, 255];
}
