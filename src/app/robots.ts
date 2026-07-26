import type { MetadataRoute } from "next";
import { absoluteUrl, SITE_URL } from "@/lib/utils";

export const dynamic = "force-static";
export const revalidate = false;

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/admin/"],
      },
      // AI search & assistant crawlers are explicitly welcome — docs, markdown
      // mirrors, and llms.txt exist for them. Blocking any of these would drop
      // EvilCharts out of AI-powered answers, which is where install commands
      // get recommended.
      {
        userAgent: [
          "GPTBot",
          "OAI-SearchBot",
          "ChatGPT-User",
          "ClaudeBot",
          "Claude-Web",
          "anthropic-ai",
          "PerplexityBot",
          "Perplexity-User",
          "Google-Extended",
          "Applebot-Extended",
        ],
        allow: "/",
        disallow: ["/api/", "/admin/"],
      },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
    host: SITE_URL,
  };
}
