import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ConnectGitHubModal } from "@/components/ConnectGitHubModal";
import {
  analyzeRepo,
  clearHistory,
  formatCompact,
  isTracked,
  loadHistory,
  loadToken,
  loadTracked,
  loadViewer,
  maybeSnapshot,
  pushHistory,
  saveToken,
  saveViewer,
  trackRepo,
  untrackRepo,
  type Analysis,
  type CommitRow,
  type HistoryItem,
  type TrackedRepo,
  type Viewer,
} from "@/lib/github";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "GitFiles — Understand Your Code Evolution" },
      {
        name: "description",
        content:
          "Deep GitHub analytics: LOC growth, commit-level table, languages, contributors, and AI-impact scoring.",
      },
      { property: "og:title", content: "GitFiles — Understand Your Code Evolution" },
      {
        property: "og:description",
        content:
          "Deep GitHub analytics: LOC growth, commit-level table, languages, contributors, and AI-impact scoring.",
      },
    ],
    links: [
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Geist:wght@500;600&family=Hanken+Grotesk:wght@700;800;900&family=Inter:wght@400&display=swap",
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<Analysis | null>(null);
  const [overlay, setOverlay] = useState({ commits: true, locAdded: false, velocity: false });

  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [token, setToken] = useState("");
  const [viewer, setViewer] = useState<Viewer | null>(null);
  const [tracked, setTracked] = useState<TrackedRepo[]>([]);
  const [showConnect, setShowConnect] = useState(false);

  useEffect(() => {
    setToken(loadToken());
    setViewer(loadViewer());
    setHistory(loadHistory());
    setTracked(loadTracked());
  }, []);

  function handleConnected(newToken: string, newViewer: Viewer) {
    setToken(newToken);
    setViewer(newViewer);
    // Storage is namespaced per account — reload under the new identity.
    setHistory(loadHistory());
    setTracked(loadTracked());
  }

  function handleDisconnect() {
    saveToken("");
    saveViewer(null);
    setToken("");
    setViewer(null);
    setHistory(loadHistory());
    setTracked(loadTracked());
  }

  async function run(value: string) {
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const result = await analyzeRepo(value, token || null);
      setData(result);
      pushHistory(result.fullName);
      setHistory(loadHistory());
      setTracked(maybeSnapshot(result));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (input.trim()) run(input);
  }

  return (
    <div
      className="min-h-screen flex flex-col bg-[#000] text-white"
      style={{ fontFamily: "Inter, sans-serif" }}
    >
      {/* Header */}
      <header className="w-full sticky top-0 bg-black/90 backdrop-blur-md z-50 border-b border-[#303030]/60">
        <div className="max-w-[1280px] mx-auto px-6 md:px-12 flex flex-col sm:flex-row justify-between items-center h-auto sm:h-24 py-4 sm:py-0 gap-4">
          <div
            className="text-2xl font-black tracking-tighter"
            style={{ fontFamily: "Hanken Grotesk, sans-serif" }}
          >
            GitFiles
          </div>
          <nav className="flex flex-wrap justify-center items-center gap-3">
            <button
              onClick={() => setShowConnect(true)}
              className={`flex items-center gap-2 border px-4 py-2.5 rounded-full text-xs font-semibold tracking-wider transition ${
                viewer
                  ? "border-[#00e639]/50 text-[#00e639] bg-[#00e639]/5"
                  : "border-[#303030] bg-[#121212] hover:bg-[#1a1a1a]"
              }`}
              style={{ fontFamily: "Geist, sans-serif" }}
            >
              {viewer ? (
                <>
                  <img
                    src={viewer.avatar}
                    alt=""
                    className="w-5 h-5 rounded-full border border-[#00e639]/40"
                  />
                  @{viewer.login}
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[16px]">key</span>
                  Connect GitHub
                </>
              )}
            </button>
            <a
              href="https://github.com/David-glitc/gitfiles"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 bg-transparent border border-[#303030] px-4 py-2.5 rounded-full text-xs font-semibold tracking-wider hover:bg-[#121212] transition"
              style={{ fontFamily: "Geist, sans-serif" }}
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
              GitHub
            </a>
          </nav>
        </div>
      </header>

      <ConnectGitHubModal
        open={showConnect}
        onClose={() => setShowConnect(false)}
        viewer={viewer}
        onConnected={handleConnected}
        onDisconnect={handleDisconnect}
      />

      <main className="flex-grow flex flex-col items-center p-4 md:p-12 gap-12 w-full max-w-[1280px] mx-auto">
        {/* Hero */}
        <section className="w-full max-w-4xl text-center flex flex-col items-center gap-8 pt-8 md:pt-16">
          <h1
            className="text-4xl md:text-6xl font-black"
            style={{
              fontFamily: "Hanken Grotesk, sans-serif",
              letterSpacing: "-0.04em",
              lineHeight: 1.1,
            }}
          >
            Understand Your Code Evolution.
          </h1>
          <p className="text-base md:text-lg text-[#c6c6c6] max-w-2xl leading-relaxed">
            Visualize repository growth, drill into commit-level LOC churn, and score AI-assisted
            authorship. Type <code className="text-[#00e639]">owner/repo</code> or a GitHub
            username.
          </p>
          <form
            onSubmit={onSubmit}
            className="w-full max-w-xl flex flex-col sm:flex-row gap-3 mt-4"
          >
            <div className="relative flex-grow">
              <span className="material-symbols-outlined absolute left-6 top-1/2 -translate-y-1/2 text-[#848484]">
                account_circle
              </span>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={loading}
                className="w-full h-16 pl-14 pr-6 bg-[#121212] border border-[#303030] rounded-full text-white placeholder:text-[#848484] focus:outline-none focus:border-[#00e639] focus:ring-4 focus:ring-[#00e639]/10 transition disabled:opacity-60"
                placeholder="facebook/react  or  torvalds"
                type="text"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="h-16 px-8 bg-[#00e639] text-black font-semibold tracking-wider rounded-full hover:bg-[#00d033] transition whitespace-nowrap flex items-center justify-center gap-2 disabled:opacity-60"
              style={{ fontFamily: "Geist, sans-serif" }}
            >
              {loading ? "Analyzing…" : "Analyze"}
              {!loading && <span className="material-symbols-outlined">arrow_forward</span>}
            </button>
          </form>
          {error && (
            <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 px-4 py-2 rounded-full">
              {error}
            </div>
          )}

          {tracked.length > 0 && (
            <div className="w-full max-w-3xl flex flex-col gap-2">
              <div className="text-[10px] uppercase tracking-widest text-[#848484] text-left pl-2">
                Tracked repos{viewer ? ` · @${viewer.login}` : ""}
              </div>
              <div className="flex flex-col gap-2">
                {tracked.map((t) => (
                  <TrackedRepoRow
                    key={t.fullName}
                    t={t}
                    onOpen={() => {
                      setInput(t.fullName);
                      run(t.fullName);
                    }}
                    onRemove={() => setTracked(untrackRepo(t.fullName))}
                  />
                ))}
              </div>
            </div>
          )}

          {history.length > 0 && (
            <div className="w-full flex flex-wrap items-center justify-center gap-2 text-xs">
              <span className="text-[#848484] uppercase tracking-widest mr-1">Recent:</span>
              {history.map((h) => (
                <button
                  key={h.fullName}
                  onClick={() => {
                    setInput(h.fullName);
                    run(h.fullName);
                  }}
                  className="px-3 py-1.5 rounded-full bg-[#121212] border border-[#303030] text-[#c6c6c6] hover:border-[#00e639]/40 hover:text-white transition"
                >
                  {h.fullName}
                </button>
              ))}
              <button
                onClick={() => {
                  clearHistory();
                  setHistory([]);
                }}
                className="text-[#848484] hover:text-red-400 ml-1"
                title="Clear history"
              >
                ✕
              </button>
            </div>
          )}
        </section>

        {loading && (
          <div className="text-sm text-[#848484] animate-pulse">
            Fetching repo metadata, weekly stats, and per-commit diffs…
          </div>
        )}

        {data && (
          <Dashboard
            data={data}
            overlay={overlay}
            setOverlay={setOverlay}
            tracked={isTracked(data.fullName)}
            onTrack={() => setTracked(trackRepo(data))}
            onUntrack={() => setTracked(untrackRepo(data.fullName))}
          />
        )}
      </main>

      <footer className="w-full bg-[#0a0a0a] py-12 border-t border-[#303030] mt-12">
        <div className="max-w-[1280px] mx-auto px-6 md:px-12 flex flex-col md:flex-row justify-between items-center gap-4">
          <div
            className="text-2xl font-black tracking-tighter"
            style={{ fontFamily: "Hanken Grotesk, sans-serif" }}
          >
            GitFiles
          </div>
          <div className="text-xs text-[#848484]" style={{ fontFamily: "Geist, sans-serif" }}>
            © 2026 GitFiles · Powered by the GitHub REST API
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ───────────────────────── Dashboard ───────────────────────── */

function Dashboard({
  data,
  overlay,
  setOverlay,
  tracked,
  onTrack,
  onUntrack,
}: {
  data: Analysis;
  overlay: { commits: boolean; locAdded: boolean; velocity: boolean };
  setOverlay: (o: { commits: boolean; locAdded: boolean; velocity: boolean }) => void;
  tracked: boolean;
  onTrack: () => void;
  onUntrack: () => void;
}) {
  return (
    <section className="w-full flex flex-col gap-8">
      {/* Repo header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-widest text-[#848484]">Analyzing</div>
          <h2
            className="text-2xl md:text-3xl font-black mt-1"
            style={{ fontFamily: "Hanken Grotesk, sans-serif" }}
          >
            <a href={data.url} target="_blank" rel="noreferrer" className="hover:text-[#00e639]">
              {data.owner}
              <span className="text-[#848484]">/</span>
              {data.repo}
            </a>
          </h2>
          {data.description && (
            <p className="text-sm text-[#c6c6c6] mt-2 max-w-2xl">{data.description}</p>
          )}
        </div>
        <div className="flex flex-wrap gap-2 text-xs items-center">
          <button
            onClick={tracked ? onUntrack : onTrack}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full border font-semibold transition ${
              tracked
                ? "border-[#00e639]/50 text-[#00e639] bg-[#00e639]/10 hover:bg-[#00e639]/5"
                : "border-[#303030] bg-[#121212] hover:border-[#00e639]/40"
            }`}
            style={{ fontFamily: "Geist, sans-serif" }}
          >
            <span className="material-symbols-outlined text-[16px]">
              {tracked ? "bookmark_added" : "bookmark_add"}
            </span>
            {tracked ? "Tracking" : "Track repo"}
          </button>
          {data.primaryLanguage && (
            <Chip>
              <span className="w-2 h-2 rounded-full bg-[#00e639] mr-1.5" />
              {data.primaryLanguage}
            </Chip>
          )}
          <Chip>★ {data.stars.toLocaleString()}</Chip>
          <Chip>⑂ {data.forks.toLocaleString()}</Chip>
          <Chip>{data.openIssues.toLocaleString()} open issues</Chip>
          <Chip>default: {data.defaultBranch}</Chip>
        </div>
      </div>

      {/* Chart */}
      <Card>
        <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
          <div>
            <div className="text-xs uppercase tracking-widest text-[#848484]">
              Cumulative Lines of Code
            </div>
            <div
              className="text-3xl font-black mt-1"
              style={{ fontFamily: "Hanken Grotesk, sans-serif" }}
            >
              {data.netLocYear.toLocaleString()}
              <span className="text-base text-[#848484] ml-2">net LOC (last year)</span>
            </div>
          </div>
          <div className="hidden sm:flex gap-4 text-xs">
            <Legend color="#00e639" label="Cumulative LOC" />
            {overlay.commits && <Legend color="#ffffff" label="Commits/week" dashed />}
            {overlay.locAdded && <Legend color="#7df9ff" label="LOC added" dashed />}
            {overlay.velocity && <Legend color="#ffb84d" label="Velocity (4w)" dashed />}
          </div>
        </div>

        <div className="w-full h-[360px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.series} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="loc" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00e639" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#00e639" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#1f1f1f" vertical={false} />
              <XAxis
                dataKey="label"
                stroke="#848484"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                minTickGap={40}
              />
              <YAxis
                stroke="#848484"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => formatCompact(v as number)}
              />
              <Tooltip
                contentStyle={{
                  background: "#121212",
                  border: "1px solid #303030",
                  borderRadius: 12,
                  fontSize: 12,
                }}
                labelStyle={{ color: "#c6c6c6" }}
              />
              <Area
                type="monotone"
                dataKey="cumulative"
                stroke="#00e639"
                strokeWidth={3}
                fill="url(#loc)"
                name="Cumulative LOC"
              />
              {overlay.commits && (
                <Line
                  type="monotone"
                  dataKey="commits"
                  stroke="#ffffff"
                  strokeDasharray="6 6"
                  strokeWidth={2}
                  dot={false}
                  name="Commits"
                />
              )}
              {overlay.locAdded && (
                <Line
                  type="monotone"
                  dataKey="additions"
                  stroke="#7df9ff"
                  strokeDasharray="6 6"
                  strokeWidth={2}
                  dot={false}
                  name="LOC added"
                />
              )}
              {overlay.velocity && (
                <Line
                  type="monotone"
                  dataKey="velocity"
                  stroke="#ffb84d"
                  strokeDasharray="6 6"
                  strokeWidth={2}
                  dot={false}
                  name="Velocity"
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Toggles + metric grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1 flex flex-col gap-4">
          <h3
            className="text-xs uppercase tracking-widest text-[#848484] pl-2"
            style={{ fontFamily: "Geist, sans-serif" }}
          >
            Overlay Metrics
          </h3>
          <ToggleRow
            label="Commits per Week"
            on={overlay.commits}
            onChange={(v) => setOverlay({ ...overlay, commits: v })}
          />
          <ToggleRow
            label="LOC Added per Week"
            on={overlay.locAdded}
            onChange={(v) => setOverlay({ ...overlay, locAdded: v })}
          />
          <ToggleRow
            label="Weekly LOC Velocity"
            on={overlay.velocity}
            onChange={(v) => setOverlay({ ...overlay, velocity: v })}
          />
        </div>

        <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-6">
          <MetricCard
            icon="commit"
            label="Total Commits (1y)"
            value={data.totalCommitsYear.toLocaleString()}
            sub={
              <span className={data.monthlyCommitChange >= 0 ? "text-[#00e639]" : "text-red-400"}>
                <span className="material-symbols-outlined text-[16px] align-middle">
                  {data.monthlyCommitChange >= 0 ? "trending_up" : "trending_down"}
                </span>{" "}
                {data.monthlyCommitChange >= 0 ? "+" : ""}
                {data.monthlyCommitChange}% vs prev month
              </span>
            }
          />
          <MetricCard
            icon="code"
            label="Avg LOC / Commit"
            value={data.avgLocPerCommit.toLocaleString()}
            sub={`median ${data.medianLocPerCommit.toLocaleString()} · ${data.commitsAnalyzed} sampled`}
          />
          <MetricCard
            icon="psychology"
            label="AI Impact Score"
            value={
              <>
                {data.aiScore}
                <span className="text-2xl text-[#848484]">/100</span>
              </>
            }
            sub={data.aiReason}
            highlight
          />
        </div>
      </div>

      {/* Deeper metrics row: AI breakdown + languages + contributors */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <SectionTitle icon="psychology">AI score breakdown</SectionTitle>
          <div className="flex flex-col gap-3 mt-4">
            {data.aiBreakdown.map((b) => (
              <div key={b.label}>
                <div className="flex justify-between text-xs text-[#c6c6c6] mb-1">
                  <span>{b.label}</span>
                  <span className="text-[#848484]">
                    {b.value}/{b.weight}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-[#1a1a1a] overflow-hidden">
                  <div
                    className="h-full bg-[#00e639]"
                    style={{ width: `${(b.value / b.weight) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <SectionTitle icon="data_object">Languages</SectionTitle>
          <div className="flex flex-col gap-3 mt-4">
            {data.languages.length === 0 && (
              <div className="text-xs text-[#848484]">No language data.</div>
            )}
            {data.languages.map((l, i) => (
              <div key={l.name}>
                <div className="flex justify-between text-xs mb-1">
                  <span>{l.name}</span>
                  <span className="text-[#848484]">{l.pct.toFixed(1)}%</span>
                </div>
                <div className="h-2 rounded-full bg-[#1a1a1a] overflow-hidden">
                  <div
                    className="h-full"
                    style={{
                      width: `${l.pct}%`,
                      background: LANG_COLORS[i % LANG_COLORS.length],
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <SectionTitle icon="groups">Top contributors</SectionTitle>
          <div className="flex flex-col gap-3 mt-4">
            {data.contributors.length === 0 && (
              <div className="text-xs text-[#848484]">No contributor data.</div>
            )}
            {data.contributors.map((c) => (
              <div key={c.login} className="flex items-center gap-3">
                {c.avatar && (
                  <img
                    src={c.avatar}
                    alt=""
                    className="w-8 h-8 rounded-full border border-[#303030]"
                  />
                )}
                <div className="flex-grow min-w-0">
                  <div className="text-sm truncate">{c.login}</div>
                  <div className="text-[10px] text-[#848484]">
                    {c.commits} commits · +{formatCompact(c.additions)} / −
                    {formatCompact(c.deletions)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Commit-level table */}
      <Card>
        <SectionTitle icon="table_rows">
          Commit-level breakdown
          <span className="text-xs text-[#848484] font-normal ml-2">
            (latest {data.recentCommits.length} commits on {data.defaultBranch})
          </span>
        </SectionTitle>
        <div className="mt-4 overflow-x-auto -mx-4 md:-mx-6">
          <table className="w-full text-sm min-w-[760px]">
            <thead>
              <tr className="text-[10px] uppercase tracking-widest text-[#848484] border-b border-[#1f1f1f]">
                <th className="text-left py-3 px-4">Commit</th>
                <th className="text-left py-3 px-4">Author</th>
                <th className="text-left py-3 px-4">Message</th>
                <th className="text-right py-3 px-4">+ LOC</th>
                <th className="text-right py-3 px-4">− LOC</th>
                <th className="text-right py-3 px-4">Files</th>
                <th className="text-left py-3 px-4">AI signals</th>
              </tr>
            </thead>
            <tbody>
              {data.recentCommits.map((c) => (
                <CommitRowView key={c.sha} c={c} />
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {data.largestWeek && (
        <div className="text-xs text-[#848484] text-center">
          Largest growth week: <span className="text-[#c6c6c6]">{data.largestWeek.label}</span> · +
          {data.largestWeek.additions.toLocaleString()} LOC across {data.largestWeek.commits}{" "}
          commits
        </div>
      )}
    </section>
  );
}

function TrackedRepoRow({
  t,
  onOpen,
  onRemove,
}: {
  t: TrackedRepo;
  onOpen: () => void;
  onRemove: () => void;
}) {
  const first = t.snapshots[0];
  const last = t.snapshots[t.snapshots.length - 1];
  const locDelta =
    first && last && t.snapshots.length > 1 ? last.netLocYear - first.netLocYear : null;
  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-[#0a0a0a] border border-[#303030] hover:border-[#00e639]/40 transition text-left">
      <button onClick={onOpen} className="flex-grow min-w-0 flex items-center gap-3 text-left">
        <span className="material-symbols-outlined text-[#00e639] text-[18px]">bookmark</span>
        <span className="text-sm truncate">{t.fullName}</span>
        {last && (
          <span className="hidden sm:flex items-center gap-3 ml-auto text-[10px] text-[#848484] whitespace-nowrap">
            <span>{formatCompact(last.netLocYear)} net LOC</span>
            <span>AI {last.aiScore}/100</span>
            {locDelta !== null && (
              <span className={locDelta >= 0 ? "text-[#00e639]" : "text-red-400"}>
                {locDelta >= 0 ? "+" : ""}
                {formatCompact(locDelta)} since tracked
              </span>
            )}
            <span>{new Date(last.at).toLocaleDateString()}</span>
          </span>
        )}
      </button>
      <button
        onClick={onRemove}
        className="text-[#848484] hover:text-red-400 flex-shrink-0"
        title="Stop tracking"
      >
        <span className="material-symbols-outlined text-[18px]">close</span>
      </button>
    </div>
  );
}

function CommitRowView({ c }: { c: CommitRow }) {
  return (
    <tr className="border-b border-[#1f1f1f] hover:bg-[#0f0f0f]">
      <td className="py-3 px-4 font-mono text-xs">
        <a
          href={c.url}
          target="_blank"
          rel="noreferrer"
          className="text-[#c6c6c6] hover:text-[#00e639]"
        >
          {c.shortSha}
        </a>
        <div className="text-[10px] text-[#848484] mt-0.5">
          {c.date ? new Date(c.date).toLocaleDateString() : "—"}
        </div>
      </td>
      <td className="py-3 px-4">
        <div className="flex items-center gap-2 min-w-0">
          {c.avatar && (
            <img src={c.avatar} alt="" className="w-6 h-6 rounded-full border border-[#303030]" />
          )}
          <span className="truncate max-w-[120px]">{c.authorLogin ?? c.author}</span>
        </div>
      </td>
      <td className="py-3 px-4 max-w-[360px]">
        <div className="truncate">{c.firstLine || "(no message)"}</div>
      </td>
      <td className="py-3 px-4 text-right text-[#00e639] font-mono">
        +{c.additions.toLocaleString()}
      </td>
      <td className="py-3 px-4 text-right text-red-400 font-mono">
        −{c.deletions.toLocaleString()}
      </td>
      <td className="py-3 px-4 text-right text-[#c6c6c6]">{c.files}</td>
      <td className="py-3 px-4">
        {c.aiSignals.length ? (
          <div className="flex flex-wrap gap-1">
            {c.aiSignals.map((s) => (
              <span
                key={s}
                className="text-[10px] px-2 py-0.5 rounded-full bg-[#00e639]/10 text-[#00e639] border border-[#00e639]/30"
              >
                {s}
              </span>
            ))}
          </div>
        ) : (
          <span className="text-[10px] text-[#848484]">—</span>
        )}
      </td>
    </tr>
  );
}

/* ───────────────────────── UI primitives ───────────────────────── */

const LANG_COLORS = ["#00e639", "#7df9ff", "#ffb84d", "#c084fc", "#f472b6", "#ffffff"];

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-[#303030] bg-[#0a0a0a] p-4 md:p-6 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.8)]">
      {children}
    </div>
  );
}

function SectionTitle({ icon, children }: { icon: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 text-sm font-semibold">
      <span className="material-symbols-outlined text-[#00e639] text-[20px]">{icon}</span>
      {children}
    </div>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="bg-[#121212] border border-[#303030] px-3 py-1.5 rounded-full flex items-center">
      {children}
    </span>
  );
}

function Legend({ color, label, dashed }: { color: string; label: string; dashed?: boolean }) {
  return (
    <div className="flex items-center gap-2 text-[#c6c6c6]">
      <span
        className="inline-block w-6 h-[2px]"
        style={{
          background: dashed
            ? `repeating-linear-gradient(to right, ${color} 0 4px, transparent 4px 8px)`
            : color,
        }}
      />
      {label}
    </div>
  );
}

function ToggleRow({
  label,
  on,
  onChange,
}: {
  label: string;
  on: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!on)}
      className={`w-full flex items-center justify-between p-5 rounded-3xl border border-[#303030] bg-[#121212] transition hover:border-[#00e639]/40 ${
        on ? "" : "opacity-70"
      }`}
    >
      <span
        className="text-sm font-semibold tracking-wider"
        style={{ fontFamily: "Geist, sans-serif" }}
      >
        {label}
      </span>
      <div
        className={`w-14 h-7 rounded-full p-1 flex transition-colors ${
          on ? "bg-[#00e639] justify-end" : "bg-[#303030] justify-start"
        }`}
      >
        <div className={`w-5 h-5 rounded-full shadow-sm ${on ? "bg-black" : "bg-[#848484]"}`} />
      </div>
    </button>
  );
}

function MetricCard({
  icon,
  label,
  value,
  sub,
  highlight,
}: {
  icon: string;
  label: string;
  value: React.ReactNode;
  sub: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-3xl p-6 flex flex-col justify-between min-h-[12rem] bg-[#0a0a0a] border relative overflow-hidden shadow-[0_10px_30px_-10px_rgba(0,0,0,0.8)] ${
        highlight ? "border-[#00e639]" : "border-[#303030]"
      }`}
    >
      {highlight && (
        <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-[#00e639] opacity-10 blur-3xl rounded-full pointer-events-none" />
      )}
      <div className="flex items-center gap-3 relative z-10">
        <div
          className={`p-3 rounded-2xl border ${
            highlight ? "bg-[#00e639]/10 border-[#00e639]/30" : "bg-[#121212] border-[#303030]"
          }`}
        >
          <span
            className={`material-symbols-outlined ${
              highlight ? "text-[#00e639]" : "text-[#c6c6c6]"
            }`}
          >
            {icon}
          </span>
        </div>
        <span
          className={`text-xs font-semibold uppercase tracking-widest ${
            highlight ? "text-[#00e639]" : "text-[#848484]"
          }`}
          style={{ fontFamily: "Geist, sans-serif" }}
        >
          {label}
        </span>
      </div>
      <div className="relative z-10">
        <div className="text-4xl font-black" style={{ fontFamily: "Hanken Grotesk, sans-serif" }}>
          {value}
        </div>
        <div className="text-xs text-[#c6c6c6] mt-2">{sub}</div>
      </div>
    </div>
  );
}
