# Deploy: Cloudflare Workers and GitHub Actions

## 1. Flow

```
git push
 ├─ main           → Actions: check → build → wrangler deploy → https://rim95.dev
 └─ other branches → Actions: check → build (drafts included) → wrangler preview → preview URL (noindex)
daily 09:10 KST    → rebuild and deploy main (publishes scheduled notes)
```

See `.github/workflows/deploy.yml`. If the check fails (`npm run check`: Worker type generation, `astro check`, Worker type check, unit tests), nothing is deployed.
Without the Cloudflare secrets the workflow checks and builds, then skips deploying without failing.

## 2. One-time setup (done by the owner)

### 2-1. Token and secrets for GitHub Actions

1. Cloudflare dashboard → My Profile → API Tokens → Create Token → template **Edit Cloudflare Workers**
   - Add one permission to the zone policy: DNS → Edit (custom domains own DNS records; the template has no DNS permission).
   - Account resources: only this account. Zone resources: all zones of this account, or only `rim95.dev`.
   - Leave client IP filtering empty: GitHub Actions runners have changing IPs.
   - The token is shown once; copy it before leaving the page.
2. Copy the **Account ID**: the 32-character part of the dashboard URL after `dash.cloudflare.com/`, or the API box on the `rim95.dev` overview.
3. GitHub `rim95dev/blog` → Settings → Secrets and variables → Actions → **Secrets** → New repository secret
   (not Variables: the workflow reads `secrets.*`)
   - `CLOUDFLARE_API_TOKEN`
   - `CLOUDFLARE_ACCOUNT_ID`

### 2-2. First deploy

Push to main. Actions deploys the Worker and attaches the `rim95.dev` and `www.rim95.dev` custom domains; Cloudflare creates the DNS records and certificates.

- Pushed before the secrets were set: that run skipped deploying. Actions → Deploy → **Run workflow** on main.
- A custom domain cannot be created on a hostname that already has a CNAME record. Delete it under DNS in the Cloudflare dashboard and run the workflow again.
- `.dev` is HTTPS-only. For a few minutes before the certificate is issued, browsers may fail to connect.

If Actions cannot attach the domains, deploy once from a local machine with the broad browser login, then go back to pushing:

```bash
npx wrangler login
```

```bash
npm run deploy
```

## 3. Operations

| Task | How |
|---|---|
| Roll back | `npx wrangler rollback` (or dashboard → Workers → Deployments → an earlier version) |
| Delete a preview | `npx wrangler preview delete` |
| See the deployed setup locally | `npm run preview` → `http://localhost:8787` (build + `wrangler dev`) |
| Logs | Dashboard → Workers → rim95-dev → Logs (`observability` is enabled) |

Local `wrangler dev` rewrites the request Host to the production domain, so the www redirect and noindex cannot be seen locally; `worker/index.test.ts` covers them.

## 4. Cloudflare dashboard settings for SEO and GEO

| Where | Setting | Why |
|---|---|---|
| AI Crawl Control | Allow every category (search, agent, training) | Defaults for new domains changed on 2026-09-15; check them explicitly |
| Managed robots.txt ("Instruct AI bot traffic with robots.txt") | **Off** | When on, it blocks GPTBot, ClaudeBot and Google-Extended and adds `ai-train=no`. `public/robots.txt` in this repo is the source of truth |
| Caching → Configuration → Crawler Hints | On | Notifies Bing, Naver and others of new pages through IndexNow |

## 5. Search engine registration (after launch)

| Where | Register | Submit |
|---|---|---|
| Google Search Console | Domain property `rim95.dev` (DNS TXT, added automatically through Cloudflare) | `https://rim95.dev/sitemap-index.xml` |
| Bing Webmaster Tools | Import from Search Console | Sitemap |
| Naver Search Advisor | `https://rim95.dev` (HTML tag: `SITE.verification.naver` in `src/site.ts`, printed in the head by `Base.astro`) | Sitemap, RSS `https://rim95.dev/ko/rss.xml` |
| Daum Webmaster Tools | `https://rim95.dev` (the `#DaumWebMasterTool:…` line in `public/robots.txt`) | Sitemap, RSS `https://rim95.dev/ko/rss.xml` |
