# Writing: adding notes and the resume

## 1. A new note

One note is one folder; the folder name becomes the slug in the URL.

```
src/content/notes/<slug>/
  ko.mdx        Korean
  en.mdx        English
  cover.png     (optional) images in the folder are shared by both languages
```

- The **slug** is lowercase English, digits and hyphens (`deck-editor`, `astro-on-workers`). Korean in URLs turns into `%EC%…` when shared.
  Never change a slug once it is public; it breaks search results and links.
- A note does not need both languages. A single-language note only appears in that language's list.
- Write `.mdx`: it allows components (demos etc.) inside a note. `.md` works too.

## 2. Frontmatter

```yaml
---
title: Building the deck editor
description: Two or three sentences, same as the opening paragraph. Shown in search results, share cards and RSS.
pubDate: 2026-10-21
updatedDate: 2026-11-02   # only after an edit
tags: [unity, rcg2]
draft: false
cover: ./cover.png        # relative to the note folder
---
```

| Field | Required | Meaning |
|---|---|---|
| `title` | ✓ | Title |
| `description` | ✓ | Summary (two or three sentences) |
| `pubDate` | ✓ | Publish date: `2026-10-21` or `2026-10-21T18:00:00+09:00` |
| `updatedDate` | | Date of the last edit |
| `tags` | | Tags (lowercase English recommended, so both languages share them) |
| `draft` | | `true` for a draft |
| `cover` | | Cover image |

A missing or invalid field stops the build with a message saying what is wrong.
While there are no notes at all, the build logs one warning (`No files found matching …`); it goes away with the first note.

## 3. Publishing rules

- `draft: true` → never on the live site; shown only on the dev server and in previews (branches other than main).
- `pubDate` in the future → hidden on the live site until then. A build runs every day at 09:10 KST and publishes notes whose time has come.
  A date-only `pubDate` (`2026-10-21`) is due from 09:00 KST (00:00 UTC) that day, so it goes live with that day's 09:10 build.
- Pushing to main deploys right away.

## 4. Writing details

- The first paragraph is set slightly larger; make it the summary.
- `##` headings form the table of contents (shown when there are two or more). Use `###` below them.
- Code blocks: put the file name on the opening fence, `` ```ts title="worker/index.ts" ``. Without one, the caption shows the language.
- Footnotes: `text[^1]`, then `[^1]: note` anywhere; they collect at the end.
- An image with light and dark versions: `<img class="only-light" …>` and `<img class="only-dark" …>`.

## 5. Translation

Notes are written in Korean; Claude drafts the English version (`en.mdx`) and checks it for context and natural phrasing, then the author reviews it.
Titles and descriptions are written per language, using the words people would search for in that language rather than a literal translation.

## 6. GEO: notes that AI answers can cite

- Open with the conclusion or a two-to-three-sentence summary (same as `description`)
- Write headings as the questions readers would ask
- Be specific about versions, numbers and dates ("2026-10" instead of "recently", "build 4.2 s → 1.1 s" instead of "faster")
- Set `updatedDate` after an edit

## 7. Profile and career

| File | What it holds | Shown on |
|---|---|---|
| `src/content/profile.yaml` | Name, role, the home heading and paragraph, the career summary, the console greeting | Home, career page, developer console |
| `src/content/resume.yaml` | Experience, education, etc. (military service) | Career page, the career box on the home page |

- Text shown to readers is `{ ko: …, en: … }`. Company names may be a plain string when both languages use the same name.
- Dates are `YYYY-MM`, or `YYYY-MM-DD` when the exact day matters. Leave `end` out while it is ongoing.
- Durations, the career total and "+ blockchain M.S." are computed at build time (`src/period.ts`, `src/career.ts`); the daily build keeps them current.
- Logos are 128 × 128 (or larger) square PNGs in `src/assets/logos`, referenced by file name without `.png`.
  They keep a white background in dark mode. Flags are SVGs in `src/assets/flags` (adding one: see `src/assets.ts`).
- `within` nests a company inside another (NEXPACE within Nexon Universe); `now` shows the company's current name and icon.

## 8. Checking locally

```bash
npm run dev
```

At `http://localhost:4321`, clean URLs open in the browser's language. Open `/ko/…` or `/en/…` directly, or use the language switch, for the other language.
