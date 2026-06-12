import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const inputSchema = z.object({
  fullName: z.string(),
  stars: z.number(),
  forks: z.number(),
  primaryLanguage: z.string().nullable(),
  totalCommitsYear: z.number(),
  netLocYear: z.number(),
  aiScore: z.number(),
  topLanguages: z.array(z.string()).max(6),
  recentCommitSamples: z.array(z.string()).max(8),
});

function heuristicInsight(d: z.infer<typeof inputSchema>): string {
  const langs = d.topLanguages.length ? d.topLanguages.join(", ") : "unknown";
  const pace =
    d.totalCommitsYear > 200 ? "very active" : d.totalCommitsYear > 50 ? "steady" : "quiet";
  const ai =
    d.aiScore >= 60
      ? "Commit patterns suggest notable AI-assisted or batch-style changes."
      : d.aiScore >= 35
        ? "Some commits look batchy; mixed human/AI workflow is possible."
        : "Commit style looks iterative and hand-driven.";
  return `${d.fullName} is ${pace} (${d.totalCommitsYear} commits in the last year, net ~${d.netLocYear.toLocaleString()} LOC). Main stack: ${langs}. ${ai} ${d.stars.toLocaleString()} stars · ${d.forks} forks.`;
}

export const generateRepoInsight = createServerFn({ method: "POST" })
  .inputValidator(inputSchema)
  .handler(async ({ data }) => {
    const groqKey = process.env.GROQ_API_KEY?.trim();
    if (!groqKey) {
      return { ok: true as const, provider: "heuristic" as const, insight: heuristicInsight(data) };
    }

    const prompt = `You are a concise repo analyst. In 3-4 sentences, summarize health, activity, and engineering style. Be specific, no bullet lists.

Repo: ${data.fullName}
Stars: ${data.stars}, Forks: ${data.forks}
Language: ${data.primaryLanguage ?? "mixed"} (${data.topLanguages.join(", ")})
Last-year commits: ${data.totalCommitsYear}, net LOC delta: ${data.netLocYear}
AI-impact heuristic score: ${data.aiScore}/100
Sample commit messages: ${data.recentCommitSamples.slice(0, 5).join(" | ") || "n/a"}`;

    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${groqKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",
          messages: [
            { role: "system", content: "Short, factual GitHub repo summaries only." },
            { role: "user", content: prompt },
          ],
          max_tokens: 220,
          temperature: 0.4,
        }),
      });
      if (!res.ok) {
        return {
          ok: true as const,
          provider: "heuristic" as const,
          insight: heuristicInsight(data),
        };
      }
      const json = (await res.json()) as {
        choices?: { message?: { content?: string } }[];
      };
      const text = json.choices?.[0]?.message?.content?.trim();
      return {
        ok: true as const,
        provider: "groq" as const,
        insight: text || heuristicInsight(data),
      };
    } catch {
      return { ok: true as const, provider: "heuristic" as const, insight: heuristicInsight(data) };
    }
  });
