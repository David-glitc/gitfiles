export const SITE_URL = "https://gitfiles.chessonchain.online";
export const SITE_NAME = "GitFiles";
export const DEFAULT_TITLE = `${SITE_NAME} — Understand Your Code Evolution`;
export const DEFAULT_DESCRIPTION =
  "Deep GitHub analytics: LOC growth, commit-level breakdown, languages, contributors, and AI-impact scoring for any public repository.";

export const OG_IMAGE = `${SITE_URL}/og-image.png`;

export function seoMeta(opts?: { title?: string; description?: string; path?: string }) {
  const title = opts?.title ?? DEFAULT_TITLE;
  const description = opts?.description ?? DEFAULT_DESCRIPTION;
  const url = opts?.path ? `${SITE_URL}${opts.path}` : SITE_URL;

  return [
    { title },
    { name: "description", content: description },
    {
      name: "keywords",
      content:
        "github analytics, lines of code, commit analysis, repository insights, ai code scoring, gitfiles",
    },
    { name: "author", content: "GitFiles" },
    { name: "robots", content: "index, follow" },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:type", content: "website" },
    { property: "og:url", content: url },
    { property: "og:image", content: OG_IMAGE },
    { property: "og:image:width", content: "1200" },
    { property: "og:image:height", content: "630" },
    { property: "og:site_name", content: SITE_NAME },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
    { name: "twitter:image", content: OG_IMAGE },
    { name: "theme-color", content: "#000000" },
  ];
}

export function seoLinks(path = "/") {
  return [{ rel: "canonical", href: `${SITE_URL}${path}` }];
}

export const FAVICON_LINKS = [
  { rel: "icon", href: "/favicon.png", type: "image/png" },
  { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
];
