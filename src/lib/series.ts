import type { WeekPoint } from "./github";

type CommitActWeek = { week: number; total: number };
type CommitListItem = { commit?: { author?: { date?: string } } };

function weekLabel(unixSec: number): string {
  const d = new Date(unixSec * 1000);
  return `${d.toLocaleString("en", { month: "short" })} '${String(d.getFullYear()).slice(2)}`;
}

/** Build chart data from /stats/commit_activity when code_frequency is empty. */
export function seriesFromCommitActivity(rows: CommitActWeek[]): WeekPoint[] {
  if (!Array.isArray(rows) || !rows.length) return [];
  const slice = rows.slice(-104);
  let cumulative = 0;
  return slice.map((w, i) => {
    const commits = w.total ?? 0;
    const additions = commits * 12; // proxy scale so the area chart is visible
    cumulative += additions;
    const win = slice.slice(Math.max(0, i - 3), i + 1);
    const velocity = Math.round(win.reduce((s, x) => s + (x.total ?? 0) * 12, 0) / win.length);
    return {
      weekIdx: i,
      date: new Date(w.week * 1000).toISOString().slice(0, 10),
      label: weekLabel(w.week),
      additions,
      deletions: 0,
      net: additions,
      cumulative,
      commits,
      velocity,
    };
  });
}

/** Last-resort: bucket recent commit dates by week. */
export function seriesFromRecentCommits(commits: CommitListItem[]): WeekPoint[] {
  const buckets = new Map<number, number>();
  for (const c of commits) {
    const date = c.commit?.author?.date;
    if (!date) continue;
    const d = new Date(date);
    d.setUTCHours(0, 0, 0, 0);
    const weekStart = d.getTime() - d.getUTCDay() * 86_400_000;
    buckets.set(weekStart, (buckets.get(weekStart) ?? 0) + 1);
  }
  const keys = [...buckets.keys()].sort((a, b) => a - b).slice(-52);
  if (!keys.length) return [];
  let cumulative = 0;
  return keys.map((weekMs, i) => {
    const commits = buckets.get(weekMs) ?? 0;
    const additions = commits * 15;
    cumulative += additions;
    const unix = Math.floor(weekMs / 1000);
    return {
      weekIdx: i,
      date: new Date(weekMs).toISOString().slice(0, 10),
      label: weekLabel(unix),
      additions,
      deletions: 0,
      net: additions,
      cumulative,
      commits,
      velocity: additions,
    };
  });
}
