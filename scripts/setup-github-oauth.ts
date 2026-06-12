#!/usr/bin/env bun
/**
 * GitFiles — GitHub OAuth / device-flow setup
 *
 * GitHub does NOT expose "create OAuth App" via REST (gh api returns 404).
 * This script uses the supported GitHub App manifest flow + `gh api` conversion,
 * which yields a client_id compatible with device flow.
 *
 * Usage:
 *   bun scripts/setup-github-oauth.ts          # manifest flow (one browser click)
 *   bun scripts/setup-github-oauth.ts --check  # verify GITHUB_OAUTH_CLIENT_ID in .env
 *   bun scripts/setup-github-oauth.ts --url    # print pre-filled OAuth App URL (alternative)
 */

import { spawn, spawnSync } from "node:child_process";
import { appendFile, readFile, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import { join } from "node:path";

const PORT = 3847;
const REPO_URL = "https://github.com/David-glitc/gitfiles";
const APP_NAME = "GitFiles";
const ENV_PATH = join(import.meta.dir, "..", ".env");

const OAUTH_PREFILL = new URL("https://github.com/settings/applications/new");
OAUTH_PREFILL.searchParams.set("name", APP_NAME);
OAUTH_PREFILL.searchParams.set("url", REPO_URL);
OAUTH_PREFILL.searchParams.set("callback_url", "http://localhost:8080");
OAUTH_PREFILL.searchParams.set("description", "GitFiles — repo analytics with device-flow sign-in");

function gh(args: string[]): string {
  const r = spawnSync("gh", args, { encoding: "utf8" });
  if (r.status !== 0) throw new Error(r.stderr || `gh ${args.join(" ")} failed`);
  return (r.stdout ?? "").trim();
}

async function upsertEnv(key: string, value: string) {
  const raw = await readFile(ENV_PATH, "utf8").catch(() => "");
  const line = `${key}=${value}`;
  const next = new RegExp(`^${key}=`, "m").test(raw)
    ? raw.replace(new RegExp(`^${key}=.*$`, "m"), line)
    : raw
      ? `${raw.trimEnd()}\n${line}\n`
      : `${line}\n`;
  await writeFile(ENV_PATH, next);
}

async function syncRepoSecrets(clientId: string) {
  try {
    gh([
      "secret",
      "set",
      "GITHUB_OAUTH_CLIENT_ID",
      "--repo",
      "David-glitc/gitfiles",
      "--body",
      clientId,
    ]);
    const token = await readFile(ENV_PATH, "utf8").then((r) => {
      const m = r.match(/^GITHUB_TOKEN=(.+)$/m);
      return m?.[1]?.trim();
    });
    if (token) {
      gh([
        "secret",
        "set",
        "GITFILES_GITHUB_TOKEN",
        "--repo",
        "David-glitc/gitfiles",
        "--body",
        token,
      ]);
    }
    console.log("✓ Repo secrets set via gh secret set (David-glitc/gitfiles)");
  } catch {
    console.log("(Skipped repo secrets — run manually: gh secret set GITHUB_OAUTH_CLIENT_ID ...)");
  }
}

async function check() {
  const env = await readFile(ENV_PATH, "utf8").catch(() => "");
  const m = env.match(/^GITHUB_OAUTH_CLIENT_ID=(.+)$/m);
  if (!m?.[1]) {
    console.error("GITHUB_OAUTH_CLIENT_ID not set in .env — run without --check first.");
    process.exit(1);
  }
  const clientId = m[1].trim();
  const res = await fetch("https://github.com/login/device/code", {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify(
      clientId.startsWith("Iv1.")
        ? { client_id: clientId }
        : { client_id: clientId, scope: "public_repo" },
    ),
  });
  if (!res.ok) {
    console.error(`Device flow probe failed (${res.status}). Enable Device Flow in app settings.`);
    process.exit(1);
  }
  const json = (await res.json()) as { user_code: string; verification_uri: string };
  console.log("✓ Device flow works for client_id:", clientId);
  console.log(`  Test code would be: ${json.user_code} @ ${json.verification_uri}`);
}

function openUrl(url: string) {
  for (const cmd of [["xdg-open", url], ["open", url]]) {
    const r = spawnSync(cmd[0], [cmd[1]], { stdio: "ignore" });
    if (r.status === 0) return true;
  }
  return false;
}

async function manifestFlow() {
  const redirectUrl = `http://127.0.0.1:${PORT}/callback`;
  const manifest = {
    name: APP_NAME,
    url: REPO_URL,
    description: "GitFiles — GitHub repo analytics with device-flow sign-in",
    hook_attributes: { url: REPO_URL, active: false },
    redirect_url: redirectUrl,
    callback_urls: ["http://localhost:8080"],
    public: true,
    default_permissions: { metadata: "read", contents: "read" },
    default_events: [],
  };

  const setupHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>GitFiles setup</title>
<style>body{font-family:system-ui;background:#0a0a0a;color:#fff;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0}
.card{max-width:28rem;padding:2rem;border:1px solid #303030;border-radius:1.5rem;background:#121212;text-align:center}
button{background:#00e639;color:#000;border:0;padding:.875rem 1.5rem;border-radius:999px;font-weight:600;cursor:pointer}
p{color:#c6c6c6;font-size:.875rem}</style></head><body><div class="card">
<h1>Register GitFiles</h1><p>Click to register a GitHub App on your account. After confirming, you'll return here automatically.</p>
<form action="https://github.com/settings/apps/new" method="post">
<input type="hidden" name="manifest" value='${JSON.stringify(manifest).replace(/'/g, "&#39;")}'>
<button type="submit">Register on GitHub</button></form></div></body></html>`;

  console.log("GitFiles OAuth setup — GitHub App manifest + gh api\n");
  console.log("Note: GitHub has no REST API to create OAuth Apps (gh api → 404).");
  console.log("This uses the manifest flow, then: gh api POST /app-manifests/{code}/conversions\n");

  await new Promise<void>((resolve, reject) => {
    const server = createServer(async (req, res) => {
      const url = new URL(req.url ?? "/", `http://127.0.0.1:${PORT}`);
      if (url.pathname === "/setup") {
        res.writeHead(200, { "content-type": "text/html" });
        res.end(setupHtml);
        return;
      }
      if (url.pathname === "/callback" && url.searchParams.has("code")) {
        const code = url.searchParams.get("code")!;
        res.writeHead(200, { "content-type": "text/html" });
        res.end("<p style='font-family:system-ui'>Done — check the terminal.</p>");
        server.close();
        try {
          const json = gh(["api", "-X", "POST", `/app-manifests/${code}/conversions`]);
          const app = JSON.parse(json) as { client_id: string; html_url: string };
          await upsertEnv("GITHUB_OAUTH_CLIENT_ID", app.client_id);
          console.log("\n✓ Registered via gh api");
          console.log(`  Client ID : ${app.client_id}`);
          console.log(`  App page  : ${app.html_url}`);
          console.log(`  .env      : GITHUB_OAUTH_CLIENT_ID written\n`);
          console.log("Enable Device Flow: App settings → Advanced → Enable Device Flow → Save\n");
          openUrl(app.html_url);
          await syncRepoSecrets(app.client_id);
          resolve();
        } catch (e) {
          reject(e);
        }
        return;
      }
      res.writeHead(302, { location: "/setup" });
      res.end();
    });

    server.listen(PORT, "127.0.0.1", () => {
      const setupUrl = `http://127.0.0.1:${PORT}/setup`;
      console.log(`Setup page: ${setupUrl}`);
      if (!openUrl(setupUrl)) console.log("Open that URL in your browser (must be logged into GitHub).\n");
    });

    setTimeout(() => {
      server.close();
      reject(new Error("Timed out (5 min). Re-run: bun run setup:oauth"));
    }, 5 * 60 * 1000);
  });
}

const arg = process.argv[2];
if (arg === "--check") {
  await check();
} else if (arg === "--url") {
  console.log("OAuth App pre-fill URL (manual alternative):\n");
  console.log(OAUTH_PREFILL.href);
  console.log("\nAfter registering: enable Device Flow, copy Client ID, then:");
  console.log("  echo 'GITHUB_OAUTH_CLIENT_ID=Ov23li...' >> .env");
} else {
  await manifestFlow();
}
