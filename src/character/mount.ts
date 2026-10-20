/* mount.ts — the pixel character on a canvas. Every dot is split into pieces; while the pointer moves over it, the pieces
 * under the pointer fly off and then return. Pressing near it bursts a larger circle once.
 * Hosts are elements with data-character; data-* attributes override the defaults below (the footer uses smaller values).
 * data-character-broken starts the character scattered in a ring and assembles it.
 */

import { colorOf, cropRows, SPRITE, type Crop } from './sprite';

const DEFAULTS = {
	/** Each dot is split into split × split pieces */
	split: 2,
	/** Radius (dots) the moving pointer breaks */
	radius: 4.2,
	/** Radius (dots) a press bursts */
	burst: 13,
	/** Room (dots) around the sprite for flying pieces */
	pad: 16,
	/** A press this far (CSS px) outside the host still bursts */
	near: 48,
};
type Option = keyof typeof DEFAULTS;

/** Frames a pushed piece floats before it starts returning */
const FREE_MOVE = 10;
const FREE_BURST = 24;
/** The simulation runs at a fixed 60 steps per second, independent of the display refresh rate */
const TICK = 1000 / 60;

interface Piece {
	hx: number;
	hy: number;
	x: number;
	y: number;
	vx: number;
	vy: number;
	a: number;
	va: number;
	free: number;
	color: string;
	r1: number;
	r2: number;
	intro: { x: number; y: number; a: number; t: number; dur: number } | null;
}

interface Pointer {
	x: number;
	y: number;
	vx: number;
	vy: number;
	speed: number;
}

export function mountCharacter(host: HTMLElement): void {
	const opt = (key: Option) => (host.dataset[key] !== undefined ? Number(host.dataset[key]) : DEFAULTS[key]);
	const S = opt('split');
	const RADIUS = opt('radius');
	const BURST = opt('burst');
	const PAD = opt('pad');
	const NEAR = opt('near');
	// data-crop="x,y,width,height": only part of the sprite
	const crop = (host.dataset.crop?.split(',').map(Number) ?? [0, 0, SPRITE.size, SPRITE.size]) as unknown as Crop;
	const W = crop[2];
	const H = crop[3];
	const size = 1 / S;

	const canvas = document.createElement('canvas');
	canvas.setAttribute('aria-hidden', 'true');
	host.append(canvas);
	const ctx = canvas.getContext('2d');
	if (!ctx) return;
	const reduce = matchMedia('(prefers-reduced-motion: reduce)');

	// A fixed random direction and spin per piece, so nothing jitters from frame to frame
	let seed = 7;
	const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
	const pieces: Piece[] = [];
	cropRows(crop).forEach((row, y) =>
		[...row].forEach((ch, x) => {
			const color = colorOf(ch);
			if (!color) return;
			for (let sy = 0; sy < S; sy++)
				for (let sx = 0; sx < S; sx++) {
					const hx = x + sx * size;
					const hy = y + sy * size;
					pieces.push({ hx, hy, x: hx, y: hy, vx: 0, vy: 0, a: 0, va: 0, free: 0, color, r1: rand() - 0.5, r2: rand() - 0.5, intro: null });
				}
		}),
	);

	let cell = 1;
	let dpr = 1;
	// Where the sprite sits inside the host (CSS px)
	let offX = 0;
	let offY = 0;
	function resize() {
		dpr = Math.min(devicePixelRatio || 1, 3);
		// A whole number of device pixels per piece; fractions would draw pieces 1 or 2 px wide and distort the dots
		const want = (host.clientWidth / W) * size * dpr;
		let dev = Math.max(1, Math.round(want));
		if (dev / want > 1.15) dev = Math.max(1, Math.floor(want));
		cell = dev / (size * dpr);
		// The sprite is centered horizontally and sits on the bottom; the canvas corner lands on a device pixel
		const r = host.getBoundingClientRect();
		const snap = (v: number) => Math.round(v * dpr) / dpr;
		offX = snap(r.left + (host.clientWidth - W * cell) / 2) - r.left;
		offY = snap(r.top + host.clientHeight - H * cell) - r.top;
		const fullW = (W + PAD * 2) * cell;
		const fullH = (H + PAD * 2) * cell;
		canvas.style.width = `${fullW}px`;
		canvas.style.height = `${fullH}px`;
		canvas.style.left = `${offX - PAD * cell}px`;
		canvas.style.top = `${offY - PAD * cell}px`;
		canvas.width = Math.round(fullW * dpr);
		canvas.height = Math.round(fullH * dpr);
		draw();
	}

	function draw() {
		if (!ctx) return;
		ctx.setTransform(1, 0, 0, 1, 0, 0);
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		const s = cell * dpr;
		for (const p of pieces) {
			ctx.fillStyle = p.color;
			const atHome = Math.abs(p.x - p.hx) < 0.02 && Math.abs(p.y - p.hy) < 0.02 && Math.abs(p.a) < 0.01;
			if (atHome) {
				// Pieces at home snap to device pixels so there are no seams
				const x0 = Math.round((PAD + p.hx) * s);
				const y0 = Math.round((PAD + p.hy) * s);
				ctx.fillRect(x0, y0, Math.round((PAD + p.hx + size) * s) - x0, Math.round((PAD + p.hy + size) * s) - y0);
			} else {
				const w = size * s;
				ctx.setTransform(1, 0, 0, 1, (PAD + p.x + size / 2) * s, (PAD + p.y + size / 2) * s);
				ctx.rotate(p.a);
				ctx.fillRect(-w / 2, -w / 2, w, w);
				ctx.setTransform(1, 0, 0, 1, 0, 0);
			}
		}
	}

	/** In dots from the sprite's top left, with this move's velocity */
	let pointer: Pointer | null = null;
	/** Whether the pointer moved since the last step */
	let moved = false;
	/** Where to burst on the next step */
	let burst: { x: number; y: number } | null = null;
	let running = false;
	let last = 0;
	let acc = 0;

	function frame(now: number) {
		acc += Math.min(now - (last || now), 250);
		last = now;
		let moving = true;
		while (acc >= TICK) {
			moving = simulate();
			acc -= TICK;
		}
		draw();
		if (moving) requestAnimationFrame(frame);
		else {
			running = false;
			last = 0;
			acc = 0;
		}
	}

	function simulate(): boolean {
		let moving = false;
		for (const p of pieces) {
			if (p.intro) {
				const it = p.intro;
				it.t++;
				const k = Math.min(Math.max(it.t / it.dur, 0), 1);
				const e = 1 - (1 - k) ** 4;
				p.x = it.x + (p.hx - it.x) * e;
				p.y = it.y + (p.hy - it.y) * e;
				p.a = it.a * (1 - e);
				if (k >= 1) {
					p.intro = null;
					p.x = p.hx;
					p.y = p.hy;
					p.a = 0;
				}
				moving = true;
				continue;
			}
			const cx = p.x + size / 2;
			const cy = p.y + size / 2;
			if (burst) {
				const dx = cx - burst.x;
				const dy = cy - burst.y;
				const d = Math.hypot(dx, dy) || 0.001;
				if (d < BURST) {
					const f = 1 - d / BURST;
					p.vx += ((dx / d) * 1.6 + p.r1 * 0.9) * f;
					p.vy += ((dy / d) * 1.6 + p.r2 * 0.9 - 0.4) * f;
					p.va += p.r1 * 1.2 * f;
					p.free = Math.max(p.free, Math.round(FREE_BURST * (0.6 + f * 0.4)));
				}
			}
			if (pointer && moved) {
				// Push only as much as the pointer moved: away from it, along its path, and a little differently per piece
				const dx = cx - pointer.x;
				const dy = cy - pointer.y;
				const d = Math.hypot(dx, dy) || 0.001;
				if (d < RADIUS) {
					const f = (1 - d / RADIUS) * Math.min(1, 0.35 + pointer.speed * 0.6);
					p.vx += ((dx / d) * 0.5 + pointer.vx * 0.45 + p.r1 * 0.6) * f;
					p.vy += ((dy / d) * 0.5 + pointer.vy * 0.45 + p.r2 * 0.6 - 0.25) * f;
					p.va += p.r1 * 0.6 * f;
					p.free = Math.max(p.free, FREE_MOVE);
				}
			}
			const free = p.free > 0;
			if (free) p.free--;
			const off = Math.hypot(p.x - p.hx, p.y - p.hy);
			let k = free ? 0.003 : 0.07;
			if (off > PAD - 3) k = Math.max(k, 0.06);
			if (free && off > 0.05) p.vy += 0.03;
			p.vx += (p.hx - p.x) * k;
			p.vy += (p.hy - p.y) * k;
			p.va += -p.a * (free ? 0.004 : 0.08);
			const damp = free ? 0.88 : 0.8;
			p.vx *= damp;
			p.vy *= damp;
			p.va *= free ? 0.92 : 0.82;
			p.x += p.vx;
			p.y += p.vy;
			p.a += p.va;
			if (free || Math.abs(p.x - p.hx) > 0.01 || Math.abs(p.y - p.hy) > 0.01 || Math.abs(p.vx) + Math.abs(p.vy) > 0.01 || Math.abs(p.a) > 0.005) moving = true;
			else {
				p.x = p.hx;
				p.y = p.hy;
				p.vx = p.vy = p.va = p.a = 0;
			}
		}
		moved = false;
		burst = null;
		return moving;
	}

	function kick() {
		if (running || reduce.matches) return;
		running = true;
		requestAnimationFrame(frame);
	}

	function toDots(e: PointerEvent) {
		const r = host.getBoundingClientRect();
		return { x: (e.clientX - r.left - offX) / cell, y: (e.clientY - r.top - offY) / cell };
	}
	host.addEventListener('pointermove', (e) => {
		const { x, y } = toDots(e);
		const clamp = (v: number) => Math.max(-3, Math.min(3, v));
		const vx = pointer ? clamp(x - pointer.x) : 0;
		const vy = pointer ? clamp(y - pointer.y) : 0;
		pointer = { x, y, vx, vy, speed: Math.hypot(vx, vy) };
		moved = true;
		kick();
	});
	host.addEventListener('pointerleave', () => (pointer = null));
	host.addEventListener('pointercancel', () => (pointer = null));

	document.addEventListener('pointerdown', (e) => {
		const r = host.getBoundingClientRect();
		if (e.clientX < r.left - NEAR || e.clientX > r.right + NEAR || e.clientY < r.top - NEAR || e.clientY > r.bottom + NEAR) return;
		burst = toDots(e);
		kick();
	});

	new ResizeObserver(resize).observe(host);
	resize();
	// Late fonts move the layout; zoom changes the device pixel ratio
	document.fonts?.ready.then(resize);
	addEventListener('resize', resize);

	if (host.hasAttribute('data-character-broken') && !reduce.matches) {
		// Start spread on a wide ring around the center and assemble quickly (fast start, slow finish)
		const cx = W / 2;
		const cy = H / 2;
		const ring = Math.min(W, H) * 0.62;
		for (const p of pieces) {
			const angle = Math.atan2(p.hy - cy, p.hx - cx) + (rand() - 0.5) * 0.5;
			const dist = ring + rand() * Math.min(W, H) * 0.22;
			p.x = cx + Math.cos(angle) * dist;
			p.y = cy + Math.sin(angle) * dist;
			p.a = (rand() - 0.5) * 5;
			// 21 to 36 steps (0.35 to 0.6 s) per piece, no delay
			p.intro = { x: p.x, y: p.y, a: p.a, t: 0, dur: 21 + Math.round(rand() * 15) };
		}
		draw();
		kick();
	}
}
