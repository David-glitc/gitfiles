import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

// Server-side GitHub helpers.
//
// 1. fetchGitHubProxy — proxies GitHub REST calls using the server-side
//    GITHUB_TOKEN (the app owner's PAT). Used as a fallback when the
//    visitor has not connected their own token, so anonymous users get
//    5,000 req/h instead of 60. The owner token never reaches the browser.
//
// 2. startDeviceFlow / pollDeviceFlow — GitHub OAuth Device Flow.
//    github.com/login/* endpoints don't send CORS headers, so the browser
//    can't call them directly; these server functions relay the handshake.
//    Requires GITHUB_OAUTH_CLIENT_ID (an OAuth App with device flow
//    enabled). The resulting user token is returned to the client and
//    stored in their browser only.

const ALLOWED_GH_PATH = /^\/(repos|users|search|rate_limit)\b/;

export const fetchGitHubProxy = createServerFn({ method: "POST" })
  .inputValidator(z.object({ path: z.string().min(1).max(500) }))
  .handler(async ({ data }) => {
    if (!ALLOWED_GH_PATH.test(data.path) || data.path.includes("..")) {
      return { status: 400, bodyJson: null as string | null, rateLimited: false };
    }
    const token = process.env.GITHUB_TOKEN;
    const res = await fetch(`https://api.github.com${data.path}`, {
      headers: {
        Accept: "application/vnd.github+json",
        "User-Agent": "gitfiles-app",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    const rateLimited = res.status === 403 && res.headers.get("x-ratelimit-remaining") === "0";
    const bodyJson: string | null = res.status === 204 ? null : await res.text();
    return { status: res.status, bodyJson, rateLimited };
  });

export const getDeviceFlowAvailability = createServerFn({ method: "GET" }).handler(async () => {
  return { available: Boolean(process.env.GITHUB_OAUTH_CLIENT_ID) };
});

export const startDeviceFlow = createServerFn({ method: "POST" }).handler(async () => {
  const clientId = process.env.GITHUB_OAUTH_CLIENT_ID;
  if (!clientId) {
    return { ok: false as const, error: "GitHub sign-in is not configured on this server." };
  }
  const res = await fetch("https://github.com/login/device/code", {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({ client_id: clientId, scope: "public_repo" }),
  });
  if (!res.ok) {
    return { ok: false as const, error: `GitHub device flow failed (${res.status}).` };
  }
  const json = (await res.json()) as {
    device_code: string;
    user_code: string;
    verification_uri: string;
    expires_in: number;
    interval: number;
  };
  return {
    ok: true as const,
    deviceCode: json.device_code,
    userCode: json.user_code,
    verificationUri: json.verification_uri,
    expiresIn: json.expires_in,
    interval: json.interval,
  };
});

export const pollDeviceFlow = createServerFn({ method: "POST" })
  .inputValidator(z.object({ deviceCode: z.string().min(1) }))
  .handler(async ({ data }) => {
    const clientId = process.env.GITHUB_OAUTH_CLIENT_ID;
    if (!clientId) {
      return { status: "error" as const, error: "GitHub sign-in is not configured." };
    }
    const res = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: clientId,
        device_code: data.deviceCode,
        grant_type: "urn:ietf:params:oauth:grant-type:device_code",
      }),
    });
    const json = (await res.json()) as {
      access_token?: string;
      error?: string;
      interval?: number;
    };
    if (json.access_token) return { status: "success" as const, token: json.access_token };
    if (json.error === "authorization_pending") return { status: "pending" as const };
    if (json.error === "slow_down")
      return { status: "slow_down" as const, interval: json.interval ?? 10 };
    if (json.error === "expired_token")
      return { status: "error" as const, error: "Code expired — start over." };
    if (json.error === "access_denied")
      return { status: "error" as const, error: "Sign-in was cancelled on GitHub." };
    return { status: "error" as const, error: json.error ?? "Unknown device flow error." };
  });
