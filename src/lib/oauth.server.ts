import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

const DEFAULT_SITE = "https://gitfiles.chessonchain.online";
const STATE_MAX_AGE_MS = 10 * 60 * 1000;

export function getOAuthRedirectUri(): string {
  const base = (process.env.SITE_URL ?? DEFAULT_SITE).replace(/\/$/, "");
  return `${base}/auth/github/callback`;
}

function signPayload(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("hex");
}

export function createOAuthState(secret: string): string {
  const nonce = randomBytes(16).toString("hex");
  const ts = Date.now().toString();
  const payload = `${nonce}.${ts}`;
  return `${payload}.${signPayload(payload, secret)}`;
}

export function verifyOAuthState(state: string, secret: string): boolean {
  const parts = state.split(".");
  if (parts.length !== 3) return false;
  const [nonce, tsStr, sig] = parts;
  if (!nonce || !tsStr || !sig) return false;
  const ts = Number(tsStr);
  if (!Number.isFinite(ts) || Date.now() - ts > STATE_MAX_AGE_MS) return false;
  const payload = `${nonce}.${tsStr}`;
  const expected = signPayload(payload, secret);
  try {
    return timingSafeEqual(Buffer.from(sig, "hex"), Buffer.from(expected, "hex"));
  } catch {
    return false;
  }
}

export function buildAuthorizeUrl(clientId: string, state: string): string {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: getOAuthRedirectUri(),
    scope: "repo",
    state,
  });
  return `https://github.com/login/oauth/authorize?${params}`;
}

export async function exchangeOAuthCode(code: string): Promise<
  | { ok: true; token: string }
  | { ok: false; error: string }
> {
  const clientId = process.env.GITHUB_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GITHUB_OAUTH_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return { ok: false, error: "GitHub sign-in is not configured on this server." };
  }

  const res = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: getOAuthRedirectUri(),
    }),
  });

  if (!res.ok) {
    return { ok: false, error: `GitHub token exchange failed (${res.status}).` };
  }

  const json = (await res.json()) as {
    access_token?: string;
    error?: string;
    error_description?: string;
  };

  if (json.access_token) return { ok: true, token: json.access_token };
  return {
    ok: false,
    error: json.error_description ?? json.error ?? "Could not complete GitHub sign-in.",
  };
}
