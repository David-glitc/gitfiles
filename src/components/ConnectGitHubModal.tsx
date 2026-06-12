import { useEffect, useState } from "react";
import { getOAuthAuthorizeUrl, getOAuthAvailability } from "@/lib/api/github.functions";
import { fetchViewer, saveToken, saveViewer, type Viewer } from "@/lib/github";

const PAT_URL =
  "https://github.com/settings/tokens/new?scopes=repo&description=GitFiles%20analytics";

export function ConnectGitHubModal({
  open,
  onClose,
  viewer,
  onConnected,
  onDisconnect,
}: {
  open: boolean;
  onClose: () => void;
  viewer: Viewer | null;
  onConnected: (token: string, viewer: Viewer) => void;
  onDisconnect: () => void;
}) {
  const [tab, setTab] = useState<"signin" | "pat">("signin");
  const [oauthAvailable, setOauthAvailable] = useState(false);
  const [pat, setPat] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    getOAuthAvailability()
      .then(({ available }) => {
        setOauthAvailable(available);
        if (!available) setTab("pat");
      })
      .catch(() => setTab("pat"));
  }, [open]);

  if (!open) return null;

  async function connectWithToken(token: string) {
    setBusy(true);
    setError(null);
    try {
      const v = await fetchViewer(token.trim());
      saveToken(token.trim());
      saveViewer(v);
      onConnected(token.trim(), v);
      setPat("");
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not verify the token.");
    } finally {
      setBusy(false);
    }
  }

  async function signInWithGitHub() {
    setError(null);
    setBusy(true);
    try {
      const res = await getOAuthAuthorizeUrl();
      if (!res.ok) {
        setError(res.error);
        return;
      }
      window.location.href = res.url;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not start GitHub sign-in.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-3xl border border-[#303030] bg-[#0a0a0a] p-6 md:p-8 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.9)]">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#848484] hover:text-white"
          aria-label="Close"
        >
          <span className="material-symbols-outlined">close</span>
        </button>

        {viewer ? (
          <div className="flex flex-col gap-6">
            <h3
              className="text-2xl font-black"
              style={{ fontFamily: "Hanken Grotesk, sans-serif" }}
            >
              GitHub connected
            </h3>
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-[#121212] border border-[#303030]">
              <img
                src={viewer.avatar}
                alt=""
                className="w-12 h-12 rounded-full border border-[#00e639]/40"
              />
              <div className="min-w-0">
                <div className="font-semibold truncate">{viewer.name ?? viewer.login}</div>
                <div className="text-xs text-[#848484]">@{viewer.login}</div>
              </div>
              <span className="ml-auto text-[10px] px-2.5 py-1 rounded-full bg-[#00e639]/10 text-[#00e639] border border-[#00e639]/30 whitespace-nowrap">
                5,000 req/h
              </span>
            </div>
            <p className="text-xs text-[#848484] leading-relaxed">
              Your token lives only in this browser's local storage. Your analysis history and
              tracked repos are saved under @{viewer.login} on this device.
            </p>
            <button
              onClick={() => {
                onDisconnect();
                onClose();
              }}
              className="h-11 px-5 border border-red-500/40 text-red-400 text-xs font-semibold rounded-full hover:bg-red-500/10 transition"
              style={{ fontFamily: "Geist, sans-serif" }}
            >
              Disconnect GitHub
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            <div>
              <h3
                className="text-2xl font-black"
                style={{ fontFamily: "Hanken Grotesk, sans-serif" }}
              >
                Connect GitHub
              </h3>
              <p className="text-sm text-[#c6c6c6] mt-2 leading-relaxed">
                Unlock 5,000 requests/hour, private-repo analysis under your identity, and
                persistent tracking of repos you care about.
              </p>
            </div>

            {oauthAvailable && (
              <div className="flex gap-2 p-1 rounded-full bg-[#121212] border border-[#303030] text-xs font-semibold">
                <TabBtn active={tab === "signin"} onClick={() => setTab("signin")}>
                  Sign in with GitHub
                </TabBtn>
                <TabBtn active={tab === "pat"} onClick={() => setTab("pat")}>
                  Use a token
                </TabBtn>
              </div>
            )}

            {tab === "signin" && oauthAvailable ? (
              <div className="flex flex-col gap-4">
                <button
                  onClick={signInWithGitHub}
                  disabled={busy}
                  className="h-12 bg-white text-black font-semibold text-sm rounded-full flex items-center justify-center gap-3 hover:bg-[#e6e6e6] transition disabled:opacity-50"
                  style={{ fontFamily: "Geist, sans-serif" }}
                >
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                  </svg>
                  {busy ? "Redirecting…" : "Continue with GitHub"}
                </button>
                <p className="text-[11px] text-[#848484] leading-relaxed text-center">
                  You'll be sent to GitHub to authorize GitFiles, then returned here with your
                  account linked.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <ol className="flex flex-col gap-3 text-sm text-[#c6c6c6]">
                  <Step n={1}>
                    Open{" "}
                    <a
                      href={PAT_URL}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[#00e639] underline underline-offset-2 hover:opacity-80"
                    >
                      github.com/settings/tokens/new
                    </a>{" "}
                    — the <code className="text-[#00e639]">repo</code> scope (for private repos) and a
                    description are pre-filled for you.
                  </Step>
                  <Step n={2}>
                    Pick an expiry (90 days is fine) and hit{" "}
                    <span className="text-white font-semibold">Generate token</span>.
                  </Step>
                  <Step n={3}>Copy the token and paste it below. That's it.</Step>
                </ol>
                <input
                  type="password"
                  value={pat}
                  placeholder="ghp_… or github_pat_…"
                  onChange={(e) => setPat(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && pat.trim()) connectWithToken(pat);
                  }}
                  className="h-12 px-5 bg-[#121212] border border-[#303030] rounded-full text-sm placeholder:text-[#848484] focus:outline-none focus:border-[#00e639]"
                />
                <button
                  onClick={() => connectWithToken(pat)}
                  disabled={busy || !pat.trim()}
                  className="h-12 bg-[#00e639] text-black font-semibold text-sm rounded-full hover:bg-[#00d033] transition disabled:opacity-50"
                  style={{ fontFamily: "Geist, sans-serif" }}
                >
                  {busy ? "Verifying…" : "Verify & connect"}
                </button>
                <p className="text-[11px] text-[#848484] leading-relaxed">
                  The token is stored only in your browser's local storage and sent straight to
                  api.github.com — never to our server. Without a token you still get the shared app
                  rate limit.
                </p>
              </div>
            )}
            {error && (
              <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/30 px-4 py-2.5 rounded-2xl">
                {error}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function TabBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 h-9 rounded-full transition ${
        active ? "bg-[#00e639] text-black" : "text-[#c6c6c6] hover:text-white"
      }`}
      style={{ fontFamily: "Geist, sans-serif" }}
    >
      {children}
    </button>
  );
}

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <li className="flex gap-3 items-start">
      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#00e639]/10 border border-[#00e639]/30 text-[#00e639] text-xs font-bold flex items-center justify-center mt-0.5">
        {n}
      </span>
      <span className="leading-relaxed">{children}</span>
    </li>
  );
}
