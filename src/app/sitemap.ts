import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/utils";
import { source } from "@/lib/source";

export const dynamic = "force-static";
export const revalidate = false;

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = [
    {
      url: absoluteUrl("/"),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: absoluteUrl("/docs"),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
  ];

  const docsEntries: MetadataRoute.Sitemap = source.getPages().map((page) => {
    const segments = page.slugs.length;
    const priority = segments === 0 ? 0.9 : segments === 1 ? 0.8 : 0.7;

    return {
      url: absoluteUrl(page.url),
      lastModified: now,
      changeFrequency: "weekly",
      priority,
    };
  });

  const seen = new Set<string>();
  return [...staticEntries, ...docsEntries].filter((entry) => {
    if (seen.has(entry.url)) return false;
    seen.add(entry.url);
    return true;
  });
}
