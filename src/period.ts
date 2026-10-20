/* period.ts — periods on the career page, computed at build time (the site is rebuilt daily, so ongoing periods stay current).
 * Dates are 'YYYY-MM' or 'YYYY-MM-DD'. With months only, both the first and the last month count (as on LinkedIn).
 * With days on both ends, only whole months count: 2015-09-15 – 2017-06-14 is 21 months.
 * No Astro imports, so it can be unit tested.
 */

export interface Span {
	start: string;
	/** Missing while ongoing */
	end?: string | undefined;
}

interface Ymd {
	y: number;
	m: number;
	d?: number;
}

function parse(value: string): Ymd {
	const [y = 0, m = 1, d] = value.split('-').map(Number);
	return d === undefined ? { y, m } : { y, m, d };
}

const monthIndex = ({ y, m }: Ymd) => y * 12 + (m - 1);

/** The current month in Korea (UTC+9), where the periods happened */
export function currentMonth(now: Date): number {
	const kst = new Date(now.getTime() + 9 * 3600_000);
	return kst.getUTCFullYear() * 12 + kst.getUTCMonth();
}

/** Length of one span in months */
export function months({ start, end }: Span, now: Date): number {
	const s = parse(start);
	if (!end) return currentMonth(now) - monthIndex(s) + 1;
	const e = parse(end);
	if (s.d !== undefined && e.d !== undefined) {
		// Whole months up to the day after the end
		const next = new Date(Date.UTC(e.y, e.m - 1, e.d + 1));
		let n = (next.getUTCFullYear() - s.y) * 12 + (next.getUTCMonth() + 1 - s.m);
		if (next.getUTCDate() < s.d) n--;
		return n;
	}
	return monthIndex(e) - monthIndex(s) + 1;
}

/** Total months of several spans; overlapping or adjacent months count once */
export function mergedMonths(spans: readonly Span[], now: Date): number {
	const ranges = spans
		.map(({ start, end }) => [monthIndex(parse(start)), end ? monthIndex(parse(end)) : currentMonth(now)] as [number, number])
		.sort((a, b) => a[0] - b[0]);
	let total = 0;
	let current: [number, number] | null = null;
	for (const [a, b] of ranges) {
		if (current && a <= current[1] + 1) current[1] = Math.max(current[1], b);
		else {
			if (current) total += current[1] - current[0] + 1;
			current = [a, b];
		}
	}
	if (current) total += current[1] - current[0] + 1;
	return total;
}

/** Months of `inner` that fall within `outer`; when `inner` lies entirely inside, its own length */
export function overlapMonths(outer: Span, inner: Span, now: Date): number {
	const os = monthIndex(parse(outer.start));
	const oe = outer.end ? monthIndex(parse(outer.end)) : currentMonth(now);
	const is = monthIndex(parse(inner.start));
	const ie = inner.end ? monthIndex(parse(inner.end)) : currentMonth(now);
	if (os <= is && ie <= oe) return months(inner, now);
	return Math.max(0, Math.min(oe, ie) - Math.max(os, is) + 1);
}

/** '2022-03' or '2022-03-15' → '2022.03' */
export function formatMonth(value: string): string {
	const { y, m } = parse(value);
	return `${y}.${String(m).padStart(2, '0')}`;
}
