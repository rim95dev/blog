import { describe, expect, it } from 'vitest';
import { currentMonth, formatMonth, mergedMonths, months, overlapMonths } from './period';

// 2026-10-21 12:00 KST
const now = new Date('2026-10-21T03:00:00Z');

describe('months', () => {
	it('counts both the first and the last month', () => {
		expect(months({ start: '2022-02', end: '2022-08' }, now)).toBe(7);
		expect(months({ start: '2020-03', end: '2022-02' }, now)).toBe(24);
	});

	it('counts whole months when both ends have days', () => {
		expect(months({ start: '2015-09-15', end: '2017-06-14' }, now)).toBe(21);
		expect(months({ start: '2015-09-15', end: '2017-06-13' }, now)).toBe(20);
	});

	it('runs to the current month while ongoing', () => {
		expect(months({ start: '2024-04' }, now)).toBe(31);
	});
});

describe('currentMonth', () => {
	it('uses Korean time', () => {
		// 2026-10-31 23:00 UTC is already November in Korea
		expect(currentMonth(new Date('2026-10-31T23:00:00Z'))).toBe(2026 * 12 + 10);
	});
});

describe('mergedMonths', () => {
	it('counts overlapping and adjacent months once', () => {
		const spans = [{ start: '2022-02', end: '2022-08' }, { start: '2022-08', end: '2024-04' }, { start: '2024-04' }, { start: '2025-01' }];
		// 2022-02 to 2026-10
		expect(mergedMonths(spans, now)).toBe(57);
	});

	it('adds separate spans', () => {
		expect(mergedMonths([{ start: '2020-01', end: '2020-03' }, { start: '2021-01', end: '2021-02' }], now)).toBe(5);
	});
});

describe('overlapMonths', () => {
	it("uses the inner span's own length when it lies inside", () => {
		expect(overlapMonths({ start: '2014-04', end: '2020-02' }, { start: '2015-09-15', end: '2017-06-14' }, now)).toBe(21);
	});

	it('counts only the shared months otherwise', () => {
		expect(overlapMonths({ start: '2020-01', end: '2020-06' }, { start: '2020-05', end: '2020-12' }, now)).toBe(2);
		expect(overlapMonths({ start: '2020-01', end: '2020-06' }, { start: '2021-01', end: '2021-02' }, now)).toBe(0);
	});
});

it('formats months', () => {
	expect(formatMonth('2022-03')).toBe('2022.03');
	expect(formatMonth('2015-09-15')).toBe('2015.09');
});
