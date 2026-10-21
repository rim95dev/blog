# Architecture: a static site plus a language-picking Worker

rim95.dev is static HTML built by Astro and served as Cloudflare Workers static assets.
No page is rendered on request; the Worker in front of the static files only deals with URLs, language and headers.

```
src/content (notes, resume) ─ astro build ─▶ dist/ko/…  dist/en/…  (static HTML per language)
                                                  │
visitor ─▶ rim95.dev/notes/abc    ─▶ worker/index.ts ─▶ picks a language, serves dist/ko/notes/abc.html at the same URL
crawler ─▶ rim95.dev/ko/notes/abc ─▶ worker/index.ts ─▶ passes through (fixed language)
```

## 1. Two sets of URLs

| Who | URL | Content |
|---|---|---|
| People (address bar, shared links, internal links) | `rim95.dev/notes/abc`, the **clean URL** | One language, picked for the visitor |
| Search engines and AI (sitemap, hreflang, RSS) | `rim95.dev/ko/notes/abc`, `rim95.dev/en/notes/abc`, the **language URLs** | Fixed language |

- Every internal link uses the clean URL (see the header of `src/layouts/Base.astro`), because the same HTML is served at both URLs.
- Landing on a language URL (from search results or RSS), a small script in the page head stores that language in a cookie and swaps the address bar to the clean URL (`history.replaceState`, no reload).
- The language switch links to the other language URL, which is also how crawlers find the pair. With JS it only changes the cookie and reopens the clean URL.
- Both languages share the slug. Switching language on a single-language note goes to that language's note list.

## 2. Picking a language: `src/lang.ts`

1. The `lang` cookie, if it is `ko` or `en` (the visitor pressed the switch or landed on a language URL)
2. Otherwise `ko` only when the highest-q tag in `Accept-Language` is Korean (`ko`, `ko-KR`, …)
3. Everything else, including no header at all (crawlers), is `en`

Three places use the same rules: `worker/index.ts` in production, `integrations/dev-lang.ts` on the dev server, and the language switch script in `Base.astro`.
The switch shows the flag of the current language.

On the dev server every 404 is the English `src/pages/404.astro`; the per-language 404 pages only take effect behind the Worker (`npm run preview`).

## 3. What the Worker does: `worker/index.ts`

- `www.rim95.dev` → `rim95.dev` with a 301 (path and query kept)
- Clean URLs: a trailing slash gets a 301 without it; otherwise the Worker picks a language and serves the `/ko/…` or `/en/…` static file at the same URL,
  with `Content-Language`, `Vary: Accept-Language, Cookie` and `Cache-Control: private, no-cache`. The same URL is a different language per visitor, so it must stay out of shared caches.
- Language URLs, files (`robots.txt` etc.) and Astro's own paths starting with `/_` pass through unchanged.
- Video (`.mp4`, `.webm`) is answered in byte ranges (206). The ASSETS binding ignores `Range` and always sends the whole file, and Safari will not play video without ranges.
  `/_astro/` skips the Worker, so clips live in `public/` (see [writing.md](writing.md) §4).
- Any host other than production (`PROD_HOST`) gets `X-Robots-Tag: noindex`, so workers.dev and preview URLs never become duplicate content in search.
- Security headers (`nosniff`, `Referrer-Policy`, `Permissions-Policy`).

`/_astro/` (hashed CSS, JS, images) is excluded from `run_worker_first` in `wrangler.jsonc` and skips the Worker. Static asset requests are free and unlimited; the Worker only runs for page requests.

Missing paths use `not_found_handling: "404-page"`, which serves the nearest `404.html`: `/ko/404.html` or `/en/404.html` under a language, `/404.html` (English) elsewhere.

## 4. Signals for search engines

| Signal | Value |
|---|---|
| `canonical` | The language URL (`/ko/notes/abc`), also when the page is served at the clean URL |
| `hreflang` | The language URL of every existing language, plus `x-default` = the English URL |
| Sitemap | `/sitemap-index.xml`: language URLs only, with their pairs (`xhtml:link`) |
| RSS | `/ko/rss.xml`, `/en/rss.xml`, linking to language URLs |
| `robots.txt` | All crawlers allowed, plus `Content-Signal: search=yes, ai-input=yes, ai-train=yes` |

Why `x-default` is the English URL and not the clean URL: the clean URL's `canonical` points at a language URL, and Google says hreflang should only list canonical URLs.
Crawlers send no language and get English at the clean URL anyway, so the outcome is the same.

**Why two sets of URLs at all.** Googlebot sends no `Accept-Language`, and Google does not guarantee indexing every language of a page that changes content by language (locale-adaptive pages).
Separate URLs per language plus hreflang is the recommended setup ([Google docs](https://developers.google.com/search/docs/specialty/international/locale-adaptive-pages)).
With a single URL, Korean notes would be missing from Google and from AI answers.

## 5. GEO (being cited in AI answers)

- Crawlers: search, AI search and AI training are all allowed (decided 2026-10-20). For the Cloudflare side see [deploy.md](deploy.md) §4; the managed robots.txt stays off because it blocks AI crawlers.
- One identity: the site name and author are `rim95dev` (`src/site.ts`), and the GitHub link carries `rel="me"`. The GitHub profile's Website field should be `https://rim95.dev`.
- Writing guidelines: [writing.md](writing.md) §5.
- Coming in phase 3: JSON-LD (`BlogPosting`, `ProfilePage`, `Person`), `/llms.txt`, a raw `.md` per note. See [plan.md](plan.md).

## 6. Front end

No framework: Astro components render HTML at build time, and a few small scripts run in the browser.

| Piece | Where | Notes |
|---|---|---|
| Styles | `src/styles/global.css` | One stylesheet. Colors are tokens with `light-dark()`; the theme follows the system unless the theme button set `html[data-theme]` (stored in `localStorage`, applied by an inline script before the first paint) |
| Fonts | `pretendard`, `@fontsource-variable/jetbrains-mono` (npm) | Self-hosted, split by unicode range so only the needed subsets download. Licenses (OFL 1.1) are served at `/licenses/` |
| Wide screens | `global.css` | The root font size grows at 1920, 2560 and 3400 CSS px, so everything sized in rem scales evenly. Size layout in rem, not px |
| Pixel character | `src/character/` | Canvas pieces that scatter under the pointer (`mount.ts`), drawn from one sprite (`sprite.ts`) that also produces the favicon, touch icon, share card and console image at build time (`icons.ts`). The console greeting inlines its image as a data URL, the only kind DevTools draws |
| Code blocks | `astro.config.mjs`, `integrations/code-figure.ts` | Shiki with GitHub light and dark themes through `light-dark()`, wrapped in a captioned figure with a copy button |
| Clips | `src/components/Video.astro` | GIF-like muted loops from `public/notes/<slug>/`, played while on screen |
| ⌘K palette | `src/layouts/Base.astro` | Jumps between pages. Full-text search (Pagefind) is planned |
| Share card | `src/og.ts`, `src/pages/og/[lang].png.ts` | `og:image` for every page, one per language (`/og/ko.png`, `/og/en.png`): the whole character and rim95.dev in a dark terminal window. Built with satori (layout, text as paths, static font files from npm) and sharp (PNG) |
| Career periods | `src/period.ts`, `src/career.ts` | Computed at build time from `src/content/resume.yaml` |

Every browser script is bundled by Astro into `/_astro/`, so pages carry no inline code except the theme and address bar snippets in the head and the console greeting text (JSON).

## 7. File map

| File | Role |
|---|---|
| `src/lang.ts` | Languages, language picking, URL conversion (shared by Astro and the Worker, no dependencies) |
| `src/i18n.ts` | UI strings per language, date and duration formats |
| `src/site.ts` | Site name, URL, author, email, the Contribution Defense wall |
| `src/content.config.ts` | Schemas for notes, the profile and the career data |
| `src/content/profile.yaml`, `resume.yaml` | Profile text and career data (see [writing.md](writing.md) §7) |
| `src/notes.ts` | Note lists, whether a note is public (draft, scheduled), reading time |
| `src/career.ts`, `src/period.ts` | Career text and period math |
| `src/assets.ts`, `src/assets/` | Logos and flags referenced by name from `resume.yaml` |
| `src/character/` | Pixel character, icons |
| `src/layouts/Base.astro` | Head (canonical, hreflang, OG, theme), header, footer, palette, address bar cleanup |
| `src/components/` | Note list, place (flag and city), company name, 404 |
| `src/pages/[lang]/…` | Pages built per language (home, notes, note, career, RSS, 404) |
| `src/pages/*.svg.ts`, `favicon.ico.ts`, `apple-touch-icon.png.ts` | Icons generated from the sprite |
| `src/og.ts`, `src/pages/og/[lang].png.ts` | Share card (og:image) |
| `worker/index.ts` | Clean URLs, www, noindex, security headers |
| `integrations/dev-lang.ts` | Mimics the Worker's language picking on the dev server |
| `integrations/code-figure.ts` | Code block caption and copy button |
| `wrangler.jsonc` | Worker, static assets and custom domain config |
| `.github/workflows/deploy.yml` | Check → build → deploy (main), previews (other branches), daily scheduled notes |
