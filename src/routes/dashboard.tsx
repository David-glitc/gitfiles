import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  analyzeRepo,
  analysisInsightPayload,
  formatCompact,
  loadTracked,
  loadViewer,
  type Analysis,
  type TrackedRepo,
  type Viewer,
} from "@/lib/github";
import { generateRepoInsight } from "@/lib/api/ai.functions";
import { seoLinks, seoMeta } from "@/lib/seo";
import {
  clearAllCache,
  deleteCachedRun,
  getCachedAnalysis,
  isCacheFresh,
  loadCacheIndex,
  saveCachedAnalysis,
  type CachedRun,
} from "@/lib/cache";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: seoMeta({
      title: "Dashboard — GitFiles",
      description: "Your cached analyses and tracked repositories on GitFiles.",
      path: "/dashboard",
    }),
    links: seoLinks("/dashboard"),
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const [viewer, setViewer] = useState<Viewer | null>(null);
  const [cached, setCached] = useState<CachedRun[]>([]);
  const [tracked, setTracked] = useState<TrackedRepo[]>([]);
  const [refreshing, setRefreshing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function reload() {
    setViewer(loadViewer());
    setCached(loadCacheIndex());
    setTracked(loadTracked());
  }

  useEffect(() => {
    reload();
  }, []);

  async function refreshRun(fullName: string, force = true) {
    setRefreshing(fullName);
    setError(null);
    try {
      const token = localStorage.getItem("gitfiles:token") || "";
      const analysis = await analyzeRepo(fullName, token || null);
      let aiInsight: string | null = null;
      try {
        const ins = await generateRepoInsight({ data: analysisInsightPayload(analysis) });
        aiInsight = ins.insight;
      } catch {
        aiInsight = null;
      }
      saveCachedAnalysis(fullName, analysis, aiInsight);
      reload();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Refresh failed");
    } finally {
      setRefreshing(null);
    }
  }

  return (
    <div
      className="min-h-screen bg-[#000] text-white"
      style={{ fontFamily: "Inter, sans-serif" }}
    >
      <header className="border-b border-[#303030]/60 bg-black/90 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-[1280px] mx-auto px-6 md:px-12 h-20 flex items-center justify-between">
          <Link
            to="/"
            className="text-2xl font-black tracking-tighter hover:text-[#00e639]"
            style={{ fontFamily: "Hanken Grotesk, sans-serif" }}
          >
            GitFiles
          </Link>
          <div className="flex items-center gap-3 text-xs">
            {viewer ? (
              <span className="text-[#00e639]">@{viewer.login}</span>
            ) : (
              <span className="text-[#848484]">Not signed in</span>
            )}
            <Link
              to="/"
              className="px-4 py-2 rounded-full border border-[#303030] hover:border-[#00e639]/40"
            >
              ← Analyze
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-[1280px] mx-auto px-6 md:px-12 py-10 flex flex-col gap-10">
        <div>
          <h1
            className="text-3xl font-black"
            style={{ fontFamily: "Hanken Grotesk, sans-serif" }}
          >
            Your dashboard
          </h1>
          <p className="text-sm text-[#c6c6c6] mt-2 max-w-2xl">
            Cached analyses (30 min TTL to save API requests) and tracked repos. Refresh pulls new
            data from GitHub and updates snapshots.
          </p>
        </div>

        {error && (
          <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 px-4 py-3 rounded-2xl">
            {error}
          </div>
        )}

        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs uppercase tracking-widest text-[#848484]">Cached runs</h2>
            {cached.length > 0 && (
              <button
                onClick={() => {
                  clearAllCache();
                  reload();
                }}
                className="text-xs text-[#848484] hover:text-red-400"
              >
                Clear all cache
              </button>
            )}
          </div>
          {cached.length === 0 ? (
            <p className="text-sm text-[#848484] py-8 text-center border border-dashed border-[#303030] rounded-2xl">
              No cached analyses yet.{" "}
              <Link to="/" className="text-[#00e639] hover:underline">
                Analyze a repo
              </Link>
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {cached.map((run) => (
                <CacheCard
                  key={run.fullName}
                  run={run}
                  refreshing={refreshing === run.fullName}
                  onRefresh={() => refreshRun(run.fullName, true)}
                  onDelete={() => {
                    deleteCachedRun(run.fullName);
                    reload();
                  }}
                />
              ))}
            </div>
          )}
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="text-xs uppercase tracking-widest text-[#848484]">Tracked repos</h2>
          {tracked.length === 0 ? (
            <p className="text-sm text-[#848484] py-6">Track repos from the analysis view.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {tracked.map((t) => {
                const snap = t.snapshots[t.snapshots.length - 1];
                const cache = getCachedAnalysis(t.fullName);
                return (
                  <div
                    key={t.fullName}
                    className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-2xl border border-[#303030] bg-[#0a0a0a]"
                  >
                    <div className="flex-grow min-w-0">
                      <div className="font-semibold truncate">{t.fullName}</div>
                      {snap ? (
                        <div className="text-xs text-[#848484] mt-1">
                          {formatCompact(snap.netLocYear)} net LOC · {snap.totalCommitsYear}{" "}
                          commits/yr · AI {snap.aiScore}/100 ·{" "}
                          {new Date(snap.at).toLocaleString()}
                        </div>
                      ) : (
                        <div className="text-xs text-[#848484] mt-1">No snapshots yet</div>
                      )}
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <Link
                        to="/"
                        search={{ repo: t.fullName }}
                        className="px-4 py-2 text-xs rounded-full border border-[#303030] hover:border-[#00e639]/40"
                      >
                        Open
                      </Link>
                      <button
                        onClick={() => refreshRun(t.fullName, true)}
                        disabled={refreshing === t.fullName}
                        className="px-4 py-2 text-xs rounded-full bg-[#00e639] text-black font-semibold disabled:opacity-50"
                      >
                        {refreshing === t.fullName ? "Updating…" : "Update"}
                      </button>
                    </div>
                    {cache && (
                      <div className="text-[10px] text-[#848484] sm:w-full">
                        Cache: {isCacheFresh(cache.cachedAt) ? "fresh" : "stale"} ·{" "}
                        {new Date(cache.cachedAt).toLocaleTimeString()}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function CacheCard({
  run,
  refreshing,
  onRefresh,
  onDelete,
}: {
  run: CachedRun;
  refreshing: boolean;
  onRefresh: () => void;
  onDelete: () => void;
}) {
  const a: Analysis = run.analysis;
  const fresh = isCacheFresh(run.cachedAt);
  return (
    <div className="p-5 rounded-2xl border border-[#303030] bg-[#0a0a0a] flex flex-col gap-3">
      <div className="flex justify-between items-start gap-2">
        <div>
          <div className="font-semibold">{run.fullName}</div>
          <div className="text-[10px] text-[#848484] mt-1">
            Cached {new Date(run.cachedAt).toLocaleString()}
            <span className={fresh ? " text-[#00e639]" : " text-amber-400"}>
              {" "}
              · {fresh ? "fresh" : "stale"}
            </span>
          </div>
        </div>
        <button onClick={onDelete} className="text-[#848484] hover:text-red-400 text-xs">
          ✕
        </button>
      </div>
      <div className="text-xs text-[#c6c6c6] grid grid-cols-2 gap-2">
        <span>★ {a.stars}</span>
        <span>AI {a.aiScore}/100</span>
        <span>{a.totalCommitsYear} commits/yr</span>
        <span>{formatCompact(a.netLocYear)} net LOC</span>
      </div>
      {run.aiInsight && (
        <p className="text-xs text-[#848484] line-clamp-3 leading-relaxed">{run.aiInsight}</p>
      )}
      <div className="flex gap-2 mt-auto">
        <Link
          to="/"
          search={{ repo: run.fullName }}
          className="flex-1 text-center py-2 text-xs rounded-full border border-[#303030] hover:border-[#00e639]/40"
        >
          View
        </Link>
        <button
          onClick={onRefresh}
          disabled={refreshing}
          className="flex-1 py-2 text-xs rounded-full bg-[#121212] border border-[#303030] hover:border-[#00e639]/40 disabled:opacity-50"
        >
          {refreshing ? "…" : "Refresh"}
        </button>
      </div>
    </div>
  );
}
