import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const DEMO_REPO = "David-glitc/gitfiles";

const CHART_DATA = [
  { label: "Jan", cumulative: 4200 },
  { label: "Mar", cumulative: 8900 },
  { label: "May", cumulative: 12400 },
  { label: "Jul", cumulative: 15800 },
  { label: "Sep", cumulative: 19200 },
  { label: "Nov", cumulative: 23100 },
];

const LANGUAGES = [
  { name: "TypeScript", pct: 62 },
  { name: "CSS", pct: 22 },
  { name: "Other", pct: 16 },
];

const ROADMAP = [
  {
    icon: "groups",
    title: "Team dashboards",
    status: "Coming soon",
    blurb: "Shared views for org repos with role-based access.",
  },
  {
    icon: "merge",
    title: "PR & review analytics",
    status: "Coming soon",
    blurb: "Cycle time, review depth, and merge velocity per repo.",
  },
  {
    icon: "notifications",
    title: "Webhooks & alerts",
    status: "Planned",
    blurb: "Slack/email when LOC velocity or AI score shifts sharply.",
  },
  {
    icon: "compare",
    title: "Repo comparisons",
    status: "Planned",
    blurb: "Side-by-side evolution for forks, monorepos, and competitors.",
  },
  {
    icon: "download",
    title: "Export reports",
    status: "Planned",
    blurb: "PDF/CSV snapshots for investors, audits, and standups.",
  },
  {
    icon: "schedule",
    title: "Scheduled scans",
    status: "Planned",
    blurb: "Nightly refresh of tracked repos with trend digests.",
  },
];

export function LandingShowcase({ onTryDemo }: { onTryDemo: () => void }) {
  return (
    <section className="w-full flex flex-col gap-16">
      {/* Live preview cards */}
      <div className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="text-left">
            <div className="text-[10px] uppercase tracking-widest text-[#00e639]">
              Live preview
            </div>
            <h2
              className="text-2xl md:text-3xl font-black mt-1"
              style={{ fontFamily: "Hanken Grotesk, sans-serif" }}
            >
              What you get for{" "}
              <span className="text-[#00e639]">{DEMO_REPO}</span>
            </h2>
            <p className="text-sm text-[#848484] mt-2 max-w-xl">
              Mini previews of the same panels you see after a full analysis — chart, AI score,
              commits, and languages.
            </p>
          </div>
          <button
            onClick={onTryDemo}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#00e639] text-black text-xs font-semibold tracking-wider hover:bg-[#00d033] transition whitespace-nowrap"
            style={{ fontFamily: "Geist, sans-serif" }}
          >
            Analyze {DEMO_REPO}
            <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <PreviewCard title="LOC growth" icon="show_chart" className="md:col-span-2">
            <div className="h-[140px] w-full">
              <ResponsiveContainer width="100%" height={140}>
                <AreaChart data={CHART_DATA} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="preview-loc" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#00e639" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#00e639" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="label" stroke="#848484" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis
                    stroke="#848484"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `${Math.round((v as number) / 1000)}k`}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "#121212",
                      border: "1px solid #303030",
                      borderRadius: 8,
                      fontSize: 11,
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="cumulative"
                    stroke="#00e639"
                    strokeWidth={2}
                    fill="url(#preview-loc)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="text-xs text-[#848484] mt-2">23,100 net LOC · last 12 months</div>
          </PreviewCard>

          <PreviewCard title="AI impact score" icon="psychology" highlight>
            <div className="flex items-end gap-2">
              <span
                className="text-5xl font-black text-[#00e639]"
                style={{ fontFamily: "Hanken Grotesk, sans-serif" }}
              >
                68
              </span>
              <span className="text-xl text-[#848484] mb-1">/100</span>
            </div>
            <p className="text-xs text-[#c6c6c6] mt-3 leading-relaxed">
              Steady commit cadence with moderate batch sizes — typical of AI-assisted refactors.
            </p>
            <div className="mt-4 flex flex-col gap-2">
              {[
                { label: "Commit size", pct: 72 },
                { label: "Message patterns", pct: 58 },
                { label: "File churn", pct: 74 },
              ].map((b) => (
                <div key={b.label}>
                  <div className="flex justify-between text-[10px] text-[#848484] mb-0.5">
                    <span>{b.label}</span>
                    <span>{b.pct}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-[#1a1a1a] overflow-hidden">
                    <div className="h-full bg-[#00e639]" style={{ width: `${b.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </PreviewCard>

          <PreviewCard title="Recent commits" icon="table_rows">
            <div className="flex flex-col gap-2">
              {[
                { sha: "a3f9c2d", msg: "feat: GitHub proxy + device flow auth", add: 412, del: 28 },
                { sha: "91be04a", msg: "fix: stats polling + chart fallbacks", add: 186, del: 94 },
                { sha: "c7d21e0", msg: "chore: nitro node preset for deploy", add: 52, del: 11 },
              ].map((c) => (
                <div
                  key={c.sha}
                  className="flex items-center gap-2 text-[11px] py-1.5 border-b border-[#1f1f1f] last:border-0"
                >
                  <span className="font-mono text-[#00e639]">{c.sha}</span>
                  <span className="truncate text-[#c6c6c6] flex-grow">{c.msg}</span>
                  <span className="text-[#00e639] font-mono">+{c.add}</span>
                </div>
              ))}
            </div>
          </PreviewCard>

          <PreviewCard title="Languages" icon="data_object">
            <div className="flex flex-col gap-3">
              {LANGUAGES.map((l, i) => (
                <div key={l.name}>
                  <div className="flex justify-between text-xs mb-1">
                    <span>{l.name}</span>
                    <span className="text-[#848484]">{l.pct}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-[#1a1a1a] overflow-hidden">
                    <div
                      className="h-full"
                      style={{
                        width: `${l.pct}%`,
                        background: ["#00e639", "#7df9ff", "#ffb84d"][i],
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </PreviewCard>

          <PreviewCard title="AI repo summary" icon="auto_awesome">
            <p className="text-xs text-[#c6c6c6] leading-relaxed">
              GitFiles is a TanStack Start app focused on repository evolution: LOC trends, commit
              sampling, contributor stats, and Groq-powered narrative summaries when configured.
            </p>
            <p className="text-[10px] text-[#848484] mt-3">Powered by Groq · llama-3.1-8b-instant</p>
          </PreviewCard>
        </div>
      </div>

      {/* Roadmap */}
      <div className="flex flex-col gap-6">
        <div className="text-left">
          <div className="text-[10px] uppercase tracking-widest text-[#848484]">Roadmap</div>
          <h2
            className="text-2xl md:text-3xl font-black mt-1"
            style={{ fontFamily: "Hanken Grotesk, sans-serif" }}
          >
            Coming soon
          </h2>
          <p className="text-sm text-[#848484] mt-2 max-w-xl">
            We ship in small slices. Here is what is next on the GitFiles roadmap.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {ROADMAP.map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-[#303030] bg-[#0a0a0a] p-5 flex flex-col gap-3 hover:border-[#00e639]/30 transition"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="material-symbols-outlined text-[#00e639] text-[22px]">
                  {item.icon}
                </span>
                <span className="text-[10px] uppercase tracking-widest text-[#848484] border border-[#303030] px-2 py-0.5 rounded-full">
                  {item.status}
                </span>
              </div>
              <h3
                className="text-sm font-bold"
                style={{ fontFamily: "Geist, sans-serif" }}
              >
                {item.title}
              </h3>
              <p className="text-xs text-[#848484] leading-relaxed">{item.blurb}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function PreviewCard({
  title,
  icon,
  children,
  highlight,
  className = "",
}: {
  title: string;
  icon: string;
  children: React.ReactNode;
  highlight?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border bg-[#0a0a0a] p-4 md:p-5 flex flex-col ${
        highlight ? "border-[#00e639]/50" : "border-[#303030]"
      } ${className}`}
    >
      <div className="flex items-center gap-2 text-xs font-semibold mb-4">
        <span className="material-symbols-outlined text-[#00e639] text-[18px]">{icon}</span>
        {title}
      </div>
      <div className="flex-grow">{children}</div>
    </div>
  );
}
