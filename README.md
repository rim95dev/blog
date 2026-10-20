# rim95.dev

Personal site of rim95dev: a resume and notes (devlog and essays), in Korean and English.

- Astro 7 static build served by Cloudflare Workers (static assets plus a small Worker that picks the language)
- Visitors get language-free URLs (`/notes/abc`) in their own language; search engines and AI crawlers get `/ko/…` and `/en/…` URLs
- Pushing to `main` runs GitHub Actions: check → build → deploy

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Dev server at `http://localhost:4321` (drafts included) |
| `npm run check` | Types, Worker, unit tests (same as CI) |
| `npm run build` | Static site in `dist/` |
| `npm run preview` | Build + `wrangler dev`: the deployed setup at `http://localhost:8787` |
| `npm run deploy` | Build + production deploy (normally done by Actions) |

Requires Node 22.22 or later.

## Where things are

| To change | Edit |
|---|---|
| Notes | `src/content/notes/<slug>/ko.mdx`, `en.mdx` |
| Home heading, career summary, console greeting | `src/content/profile.yaml` |
| Experience, education | `src/content/resume.yaml` (logos in `src/assets/logos`) |
| UI strings | `src/i18n.ts` |
| Styles | `src/styles/global.css` |

## Docs

- [docs/plan.md](docs/plan.md): decisions and remaining phases
- [docs/architecture.md](docs/architecture.md): two sets of URLs, language picking, the Worker, SEO/GEO signals
- [docs/writing.md](docs/writing.md): adding notes and the resume, publishing rules
- [docs/deploy.md](docs/deploy.md): first deploy, tokens, dashboard settings, operations

## License

[MIT](LICENSE), except for the third-party material below, which keeps its own terms.

| What | Where | Terms |
|---|---|---|
| Company and school logos | `src/assets/logos/` | Trademarks of their owners, shown only to identify the organizations on the career page. Not covered by the MIT license |
| Pretendard | npm package `pretendard`, license at `public/licenses/pretendard.txt` | SIL Open Font License 1.1 |
| JetBrains Mono | npm package `@fontsource-variable/jetbrains-mono`, license at `public/licenses/jetbrains-mono.txt` | SIL Open Font License 1.1 |

The flags in `src/assets/flags/` are drawn for this site from the public national flag designs.
