import type { Analysis } from "./github";
import { loadViewer } from "./github";

const CACHE_TTL_MS = 30 * 60 * 1000; // 30 min — saves GitHub req/h
const INDEX_KEY_SUFFIX = ":cache-index";

export type CachedRun = {
  fullName: string;
  cachedAt: number;
  analysis: Analysis;
  aiInsight: string | null;
  fromCache?: boolean;
};

function ns(): string {
  return loadViewer()?.login ?? "anon";
}

function cacheKey(fullName: string) {
  return `gitfiles:${ns()}:cache:${fullName.toLowerCase()}`;
}

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function isCacheFresh(cachedAt: number): boolean {
  return Date.now() - cachedAt < CACHE_TTL_MS;
}

export function getCachedAnalysis(fullName: string): CachedRun | null {
  return readJson<CachedRun | null>(cacheKey(fullName), null);
}

export function saveCachedAnalysis(
  fullName: string,
  analysis: Analysis,
  aiInsight: string | null = null,
): CachedRun {
  const entry: CachedRun = {
    fullName,
    cachedAt: Date.now(),
    analysis,
    aiInsight,
  };
  if (typeof window !== "undefined") {
    localStorage.setItem(cacheKey(fullName), JSON.stringify(entry));
    const index = loadCacheIndex()
      .filter((r) => r.fullName.toLowerCase() !== fullName.toLowerCase())
      .slice(0, 19);
    index.unshift({ fullName, cachedAt: entry.cachedAt, analysis, aiInsight });
    localStorage.setItem(`gitfiles:${ns()}${INDEX_KEY_SUFFIX}`, JSON.stringify(index));
  }
  return entry;
}

export function loadCacheIndex(): CachedRun[] {
  return readJson<CachedRun[]>(`gitfiles:${ns()}${INDEX_KEY_SUFFIX}`, []);
}

export function deleteCachedRun(fullName: string): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(cacheKey(fullName));
  const next = loadCacheIndex().filter((r) => r.fullName.toLowerCase() !== fullName.toLowerCase());
  localStorage.setItem(`gitfiles:${ns()}${INDEX_KEY_SUFFIX}`, JSON.stringify(next));
}

export function clearAllCache(): void {
  if (typeof window === "undefined") return;
  for (const run of loadCacheIndex()) {
    localStorage.removeItem(cacheKey(run.fullName));
  }
  localStorage.removeItem(`gitfiles:${ns()}${INDEX_KEY_SUFFIX}`);
}
