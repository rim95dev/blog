/* career.ts — reads src/content/profile.yaml and resume.yaml, and turns their dates into the text shown on the home and career pages.
 * Durations are computed when the site is built; the daily build keeps ongoing periods current.
 */

import { getEntry } from 'astro:content';
import { formatDuration, formatYears, t } from './i18n';
import type { Lang } from './lang';
import { formatMonth, mergedMonths, months, overlapMonths, type Span } from './period';

const now = new Date();

export async function getProfile() {
	const entry = await getEntry('profile', 'main');
	if (!entry) throw new Error('could not read src/content/profile.yaml');
	return entry.data;
}

export async function getResume() {
	const entry = await getEntry('resume', 'main');
	if (!entry) throw new Error('could not read src/content/resume.yaml');
	return entry.data;
}

export type Resume = Awaited<ReturnType<typeof getResume>>;
export type Job = Resume['experience'][number];
export type School = Resume['education'][number];

/** '2022.02 – 2022.08', '2024.04 – Present' */
export function range(lang: Lang, { start, end }: Span): string {
	return `${formatMonth(start)} – ${end ? formatMonth(end) : t(lang, 'resume.present')}`;
}

/** '1 yr 9 mos' */
export function duration(lang: Lang, span: Span): string {
	return formatDuration(lang, months(span, now));
}

/** Every company period, companies within included; overlapping months count once */
export function careerTotal(lang: Lang, resume: Resume): string {
	const spans = resume.experience.flatMap((job) => [job, ...job.within]);
	return spans.length > 0 ? formatDuration(lang, mergedMonths(spans, now)) : '';
}

/** '+ 2 yrs blockchain M.S.' for education marked `research`, or '' */
export function researchNote(lang: Lang, resume: Resume): string {
	const research = resume.education.filter((school) => school.research);
	const label = research[0]?.research?.[lang];
	if (!label) return '';
	const total = research.reduce((sum, school) => sum + months(school, now), 0);
	return t(lang, 'resume.research', { label, d: formatDuration(lang, total) });
}

/** Years of a degree (rounded), minus the `exclude` entry's months, and the note saying so */
export function schoolLength(lang: Lang, resume: Resume, school: School): { years: string; note: string } {
	let total = months(school, now);
	let note = '';
	if (school.exclude) {
		const other = resume.etc.find((item) => item.id === school.exclude);
		if (!other) throw new Error(`resume.yaml: education exclude '${school.exclude}' matches no etc id`);
		const overlap = overlapMonths(school, other, now);
		if (overlap > 0) {
			total -= overlap;
			note = t(lang, 'resume.exclude', { label: (other.short ?? other.title)[lang], d: formatDuration(lang, overlap) });
		}
	}
	return { years: formatYears(lang, total), note };
}

/** Anchor on the career page for a company */
export function jobId(job: Job): string {
	return job.company.en
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-|-$/g, '');
}
