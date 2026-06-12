# GitFiles — Development Log

## 2026-06-12 — Initial fork → gitfiles repo

- Cloned `commit-bloom-tracker`, reset git history, pushed to new repo `David-glitc/gitfiles`.
- Added server-side GitHub proxy (`GITHUB_TOKEN`) so anonymous visitors get 5,000 req/h via owner PAT fallback.
- Added Connect GitHub modal: PAT instructions + standard OAuth redirect (`GITHUB_OAUTH_CLIENT_ID` + secret).
- Per-account localStorage: history, tracked repos with snapshot timelines (LOC, commits, AI score, stars).
- Track / untrack repos from the dashboard; tracked list on the home page.

### Run locally

```bash
bun install
cp .env.example .env   # set GITHUB_TOKEN (gh auth token works)
bun run dev
```

### OAuth setup via gh cli

GitHub has **no REST API** to create OAuth Apps (`gh api POST /user/applications/oauth` → 404). Supported path: **GitHub App manifest flow** + `gh api` conversion:

```bash
bun run setup:oauth
```

Opens a local page → one GitHub click → `gh api POST /app-manifests/{code}/conversions` → writes `GITHUB_OAUTH_CLIENT_ID` to `.env`.

Manual OAuth App alternative: `bun run setup:oauth -- --url` (pre-filled settings URL).

Set **Authorization callback URL** to `https://gitfiles.chessonchain.online/auth/github/callback`.

Repo secret `GITFILES_GITHUB_TOKEN` set via `gh secret set` for CI/deploy.

## 2026-06-12 — gitfiles.chessonchain.online live

- DNS: A `gitfiles` → 109.205.181.119 (proxied) via `cloudflare-dns.mjs`.
- Deploy: Docker `gitfiles` on `coolify` network, Traefik → port 3000, nitro `node` preset.
- Live: https://gitfiles.chessonchain.online (verified 200).

### Env

| Variable                 | Required   | Purpose                                   |
| ------------------------ | ---------- | ----------------------------------------- |
| `GITHUB_TOKEN`           | Yes (prod) | Server PAT for unauthenticated API proxy  |
| `GITHUB_OAUTH_CLIENT_ID` | No         | OAuth App client ID for GitHub redirect sign-in |
| `GITHUB_OAUTH_CLIENT_SECRET` | No     | OAuth App secret (server-only, for code exchange) |
| `GROQ_API_KEY`           | No         | Groq LLM for AI repo summaries            |

## 2026-06-12 — SEO, OG image, landing showcase, Groq redeploy

- Generated `public/og-image.png` (1200×630), favicon/apple-touch-icon from logo.
- Centralized SEO in `src/lib/seo.ts`; fixed root meta (was Lovable defaults).
- Added `public/robots.txt` + `public/sitemap.xml` (/, /dashboard).
- Landing: `LandingShowcase` preview cards for `David-glitc/gitfiles` + roadmap section.
- Redeployed Docker with `GROQ_API_KEY` in `--env-file .env`.

## 2026-06-12 — OAuth redirect flow (replaces device flow)

- "Continue with GitHub" now uses standard authorization-code redirect (no user code).
- Callback route: `/auth/github/callback` — server exchanges code with `GITHUB_OAUTH_CLIENT_SECRET`.
- Update GitHub OAuth App callback URL to match (see `.env.example`).
