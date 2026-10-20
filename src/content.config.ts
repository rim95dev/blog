/* content.config.ts — schemas for notes, the profile and the career data. A missing or invalid field stops the build (docs/writing.md). */

import { defineCollection } from 'astro:content';
import { file, glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { parse } from 'yaml';
import { FLAGS } from './assets';

// One note = one folder (its name is the slug) holding ko.mdx and/or en.mdx
const notes = defineCollection({
	loader: glob({
		base: './src/content/notes',
		pattern: '*/{ko,en}.{md,mdx}',
		generateId: ({ entry }) => entry.replace(/\.mdx?$/, ''),
	}),
	schema: ({ image }) =>
		z.object({
			title: z.string(),
			description: z.string(),
			pubDate: z.coerce.date(),
			updatedDate: z.coerce.date().optional(),
			tags: z.array(z.string()).default([]),
			draft: z.boolean().default(false),
			cover: image().optional(),
		}),
});

/** Text per language */
const text = z.object({ ko: z.string(), en: z.string() });
/** Text that is often the same in both languages (company names): a plain string, or per language */
const label = z.union([z.string().transform((value) => ({ ko: value, en: value })), text]);
const date = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])(-(0[1-9]|[12]\d|3[01]))?$/, 'expected YYYY-MM or YYYY-MM-DD');
/** A file name in src/assets/logos without the extension */
const logo = z.string();
const place = z.object({ flag: z.enum(FLAGS), city: text });

/** A YAML file loaded as one entry with id 'main' */
const single = (path: string) => file(path, { parser: (raw) => ({ main: parse(raw) ?? {} }) });

// Who the site belongs to: src/content/profile.yaml
const profile = defineCollection({
	loader: single('src/content/profile.yaml'),
	schema: z.object({
		name: text,
		role: text,
		hero: z.object({ title: text, body: text }),
		summary: text,
		greeting: z.array(text).default([]),
	}),
});

// Career, education and the rest: src/content/resume.yaml
const resume = defineCollection({
	loader: single('src/content/resume.yaml'),
	schema: z.object({
		experience: z
			.array(
				z.object({
					company: label,
					logo,
					/** What the company is called now */
					now: z.object({ name: label, logo }).optional(),
					role: text,
					start: date,
					end: date.optional(),
					place,
					/** Companies within this one (an affiliate or subsidiary you were placed at) */
					within: z.array(z.object({ company: label, logo, start: date, end: date.optional(), place })).default([]),
					work: z.array(z.object({ project: label.optional(), detail: text })).default([]),
					stack: z.array(z.string()).default([]),
				}),
			)
			.default([]),
		education: z
			.array(
				z.object({
					school: text,
					logo,
					degree: text,
					/** One line for the summary box at the top of the career page; the first entry's is shown */
					short: text.optional(),
					start: date,
					end: date.optional(),
					/** Shown next to the career total as "+ <label> <duration>" */
					research: text.optional(),
					/** id of an `etc` entry whose months are subtracted (military service during the degree) */
					exclude: z.string().optional(),
				}),
			)
			.default([]),
		etc: z
			.array(
				z.object({
					id: z.string().optional(),
					title: text,
					/** Name used in "excl. … of <short>" */
					short: text.optional(),
					logo,
					detail: text,
					start: date,
					end: date.optional(),
				}),
			)
			.default([]),
	}),
});

export const collections = { notes, profile, resume };
