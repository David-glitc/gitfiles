import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { completeOAuth } from "@/lib/api/github.functions";
import { fetchViewer, saveToken, saveViewer } from "@/lib/github";

export const Route = createFileRoute("/auth/github/callback")({
  validateSearch: (s: Record<string, unknown>) => ({
    code: typeof s.code === "string" ? s.code : undefined,
    state: typeof s.state === "string" ? s.state : undefined,
    error: typeof s.error === "string" ? s.error : undefined,
    error_description: typeof s.error_description === "string" ? s.error_description : undefined,
  }),
  component: GitHubOAuthCallback,
});

function GitHubOAuthCallback() {
  const { code, state, error, error_description } = Route.useSearch();
  const navigate = useNavigate();
  const [message, setMessage] = useState("Linking your GitHub account…");
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (error) {
      setMessage(
        error === "access_denied"
          ? "Sign-in was cancelled on GitHub."
          : (error_description ?? error),
      );
      setDone(true);
      return;
    }
    if (!code || !state) {
      setMessage("Missing authorization data from GitHub. Try signing in again.");
      setDone(true);
      return;
    }

    let cancelled = false;
    (async () => {
      const res = await completeOAuth({ data: { code, state } });
      if (cancelled) return;
      if (!res.ok) {
        setMessage(res.error);
        setDone(true);
        return;
      }
      try {
        const viewer = await fetchViewer(res.token);
        saveToken(res.token);
        saveViewer(viewer);
        navigate({ to: "/", replace: true });
      } catch (err: unknown) {
        setMessage(err instanceof Error ? err.message : "Could not verify GitHub account.");
        setDone(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [code, state, error, error_description, navigate]);

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center bg-black text-white p-6"
      style={{ fontFamily: "Inter, sans-serif" }}
    >
      <div className="max-w-md w-full text-center flex flex-col items-center gap-6">
        <img src="/favicon.png" alt="" className="w-12 h-12 rounded-xl" width={48} height={48} />
        {!done && (
          <span className="material-symbols-outlined text-[#00e639] text-4xl animate-pulse">
            link
          </span>
        )}
        <p className="text-sm text-[#c6c6c6] leading-relaxed">{message}</p>
        {done && (
          <Link
            to="/"
            className="h-11 px-6 bg-[#00e639] text-black text-xs font-semibold rounded-full flex items-center hover:bg-[#00d033] transition"
            style={{ fontFamily: "Geist, sans-serif" }}
          >
            Back to GitFiles
          </Link>
        )}
      </div>
    </div>
  );
}
