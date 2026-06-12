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

### Env

| Variable                 | Required   | Purpose                                   |
| ------------------------ | ---------- | ----------------------------------------- |
| `GITHUB_TOKEN`           | Yes (prod) | Server PAT for unauthenticated API proxy  |
| `GITHUB_OAUTH_CLIENT_ID` | No         | Enables "Sign in with GitHub" device flow |
