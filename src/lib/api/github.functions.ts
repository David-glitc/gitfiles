import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  buildAuthorizeUrl,
  createOAuthState,
  exchangeOAuthCode,
  verifyOAuthState,
} from "../oauth.server";

// Server-side GitHub helpers.
//
// 1. fetchGitHubProxy — proxies GitHub REST calls using the server-side
//    GITHUB_TOKEN (the app owner's PAT). Used as a fallback when the
//    visitor has not connected their own token, so anonymous users get
//    5,000 req/h instead of 60. The owner token never reaches the browser.
//
// 2. OAuth authorization-code flow — redirect to GitHub, callback exchanges
//    code for a user token server-side (client secret never reaches browser).
//    Requires GITHUB_OAUTH_CLIENT_ID + GITHUB_OAUTH_CLIENT_SECRET.

const ALLOWED_GH_PATH = /^\/(repos|users|search|rate_limit)\b/;
const STATS_POLL_ATTEMPTS = 30;

function statsPollDelay(attempt: number): number {
  const retryAfter = 2;
  return Math.min((retryAfter + attempt * 0.4) * 1000, 6000);
}

async function ghFetch(path: string, token: string | undefined) {
  return fetch(`https://api.github.com${path}`, {
    headers: {
      Accept: "application/vnd.github+json",
      "User-Agent": "gitfiles-app",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
}

export const fetchGitHubProxy = createServerFn({ method: "POST" })
  .inputValidator(z.object({ path: z.string().min(1).max(500) }))
  .handler(async ({ data }) => {
    if (!ALLOWED_GH_PATH.test(data.path) || data.path.includes("..")) {
      return {
        status: 400,
        bodyJson: null as string | null,
        rateLimited: false,
        rateLimitRemaining: null,
        rateLimitLimit: null,
        rateLimitReset: null,
      };
    }
    const token = process.env.GITHUB_TOKEN;
    const isStats = data.path.includes("/stats/");
    const maxAttempts = isStats ? STATS_POLL_ATTEMPTS : 1;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const res = await ghFetch(data.path, token);
      if (res.status === 202) {
        const hdr = res.headers.get("retry-after");
        const waitMs = hdr ? Math.min(parseInt(hdr, 10) * 1000, 10000) : statsPollDelay(attempt);
        await new Promise((r) => setTimeout(r, waitMs));
        continue;
      }
      const rateLimited = res.status === 403 && res.headers.get("x-ratelimit-remaining") === "0";
      const bodyJson: string | null = res.status === 204 ? null : await res.text();
      return { status: res.status, bodyJson, rateLimited, ...parseRateHeaders(res) };
    }

    return {
      status: 202,
      bodyJson: null,
      rateLimited: false,
      rateLimitRemaining: null,
      rateLimitLimit: null,
      rateLimitReset: null,
    };
  });

function parseRateHeaders(res: Response) {
  const remaining = res.headers.get("x-ratelimit-remaining");
  const limit = res.headers.get("x-ratelimit-limit");
  const reset = res.headers.get("x-ratelimit-reset");
  return {
    rateLimitRemaining: remaining != null ? parseInt(remaining, 10) : null,
    rateLimitLimit: limit != null ? parseInt(limit, 10) : null,
    rateLimitReset: reset != null ? parseInt(reset, 10) : null,
  };
}

export const getOAuthAvailability = createServerFn({ method: "GET" }).handler(async () => {
  return {
    available: Boolean(
      process.env.GITHUB_OAUTH_CLIENT_ID && process.env.GITHUB_OAUTH_CLIENT_SECRET,
    ),
  };
});

export const getOAuthAuthorizeUrl = createServerFn({ method: "POST" }).handler(async () => {
  const clientId = process.env.GITHUB_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GITHUB_OAUTH_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return { ok: false as const, error: "GitHub sign-in is not configured on this server." };
  }
  const state = createOAuthState(clientSecret);
  return { ok: true as const, url: buildAuthorizeUrl(clientId, state) };
});

export const completeOAuth = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      code: z.string().min(1),
      state: z.string().min(1),
    }),
  )
  .handler(async ({ data }) => {
    const clientSecret = process.env.GITHUB_OAUTH_CLIENT_SECRET;
    if (!clientSecret) {
      return { ok: false as const, error: "GitHub sign-in is not configured." };
    }
    if (!verifyOAuthState(data.state, clientSecret)) {
      return { ok: false as const, error: "Invalid or expired sign-in session. Try again." };
    }
    return exchangeOAuthCode(data.code);
  });
