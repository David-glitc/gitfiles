# GitFiles — Development Log

## 2026-06-12 — Initial fork → gitfiles repo

- Cloned `commit-bloom-tracker`, reset git history, pushed to new repo `David-glitc/gitfiles`.
- Added server-side GitHub proxy (`GITHUB_TOKEN`) so anonymous visitors get 5,000 req/h via owner PAT fallback.
- Added Connect GitHub modal: PAT instructions (pre-filled token URL) + optional OAuth Device Flow (`GITHUB_OAUTH_CLIENT_ID`).
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

After either path: app settings → Advanced → **Enable Device Flow** → Save. Verify: `bun run setup:oauth -- --check`.

Repo secret `GITFILES_GITHUB_TOKEN` set via `gh secret set` for CI/deploy.

### Env

| Variable                 | Required   | Purpose                                   |
| ------------------------ | ---------- | ----------------------------------------- |
| `GITHUB_TOKEN`           | Yes (prod) | Server PAT for unauthenticated API proxy  |
| `GITHUB_OAUTH_CLIENT_ID` | No         | Enables "Sign in with GitHub" device flow |
