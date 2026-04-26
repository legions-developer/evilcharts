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
        disallow: ["/api/", "/_next/", "/admin/"],
      },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
    host: SITE_URL,
  };
}
