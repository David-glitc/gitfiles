# GitFiles

Deep GitHub repository analytics — LOC growth over time, commit-level churn, language breakdown, contributor stats, and an AI-impact score.

**Live:** analyze any public repo with `owner/repo` or a GitHub username.

## Features

- Cumulative LOC chart with overlay toggles (commits/week, LOC added, velocity)
- Commit-level table with per-commit LOC and AI signal tags
- AI impact score with breakdown
- Connect GitHub (PAT or device sign-in) for 5,000 req/h and persistent tracking
- Track repos — snapshots saved locally per connected account

## Quick start

```bash
bun install
cp .env.example .env
# Add GITHUB_TOKEN — a classic PAT with public_repo scope, or: gh auth token
bun run dev
```

Open [http://localhost:8080](http://localhost:8080).

## Environment

| Variable                 | Required    | Description                                               |
| ------------------------ | ----------- | --------------------------------------------------------- |
| `GITHUB_TOKEN`           | Recommended | Server-side PAT for visitors who haven't connected GitHub |
| `GITHUB_OAUTH_CLIENT_ID` | Optional    | OAuth App Client ID with Device Flow enabled              |

## Stack

TanStack Start · React 19 · Vite · Tailwind CSS · Recharts · GitHub REST API
