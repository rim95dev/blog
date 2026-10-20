# Plan: decisions and remaining phases

## Decisions (2026-10-20)

| Topic | Decision |
|---|---|
| Domain | `rim95.dev`; the apex is canonical, `www` → 301 |
| Stack | Astro 7 static build + Cloudflare Workers (static assets + a small Worker) + GitHub Actions |
| Languages | Korean and English. People get one language-free URL; crawlers get `/ko/` and `/en/` URLs. See [architecture.md](architecture.md) |
| Repository | Public. Everything in English; Korean only in Korean notes (`ko.mdx`) and translated UI strings |
| Content | Everything except the resume (devlog, essays, projects) lives under `/notes`. Grouping comes later; tags only for now |
| Comments | None |
| AI crawlers | Search, citation and training all allowed |
| Design | Terminal style, GitHub (Primer) colors, light and dark themes, a pixel character that scatters under the pointer. JetBrains Mono for headings and code, Pretendard for text (both OFL 1.1, self-hosted, licenses at `/licenses/`) |
| Career | `src/content/resume.yaml` (experience, education, etc.); durations computed at build time. Profile text in `src/content/profile.yaml` |
| Navigation | Notes, Career; the language switch shows the current language's flag; ⌘K jumps between pages |

## Phases

### 0. Foundation (done, except deployment setup)

- [x] Astro 7, content schemas (notes, resume), per-language pages (home, note list, note, resume, 404, RSS), sitemap, robots.txt
- [x] Language-picking Worker, address bar cleanup, language switch, dev-server equivalent
- [x] Checks (`npm run check`), unit tests, GitHub Actions (production, previews, daily scheduled notes)
- [ ] First deploy, token, secrets, dashboard settings: owner, see [deploy.md](deploy.md) §2 and §4

### 1. Design (done 2026-10-21)

- [x] Terminal design applied everywhere: header, footer, home (hero, career box, Contribution Defense wall, recent notes), notes with tag filter, note page, career page, 404
- [x] Fonts, light/dark theme, favicon and touch icon from the sprite, console greeting
- [x] Code blocks (Shiki, file name, copy), table of contents, reading progress, footnotes
- [x] Home heading and paragraph, career summary (`src/content/profile.yaml`)
- [x] Console greeting (`greeting` in `src/content/profile.yaml`)
- [x] Share card (og:image) per language for every page: character, rim95.dev, name and role in a dark terminal window
- [ ] Per-note share cards with the note title, if wanted. Preview bots usually get English for a shared clean URL; share `/ko/…` for a Korean card
- [ ] Image zoom in notes

### 2. Career

- [x] LinkedIn-style entries with logos, places, nested companies, computed durations
- [ ] Print layout check (one or two pages)

### 3. SEO and GEO

- JSON-LD: `BlogPosting`, `ProfilePage` + `Person` (`sameAs`), `BreadcrumbList`, `WebSite`
- `/llms.txt`, a raw `.md` per note, full-content RSS
- Search engine registration, Crawler Hints, Web Analytics: see [deploy.md](deploy.md) §4 and §5
- Confirm in Search Console that both language URLs get indexed

### 4. Interaction

- Full-text search in the ⌘K palette (Pagefind, one index per language)
- Reactions and view counts (Worker + D1), not decided yet

### 5. Later

- Grouping notes (series, projects), newsletter, Unity WebGL demos (R2)
