import { PHASE_DEVELOPMENT_SERVER } from "next/constants";
import { createMDX } from "fumadocs-mdx/next";
import type { NextConfig } from "next";

import { SITE_REDIRECTS } from "./src/globals/constants/site-redirects";

const withMDX = createMDX();

export default function config(phase: string) {
  const nextConfig: NextConfig = {
    output: phase === PHASE_DEVELOPMENT_SERVER ? undefined : "export",
    reactStrictMode: true,
  };

  // Production routing is delivered by Cloudflare. Keep next dev useful for
  // authoring docs; preview the exported site with Wrangler for Worker features.
  if (phase === PHASE_DEVELOPMENT_SERVER) {
    nextConfig.redirects = async () =>
      SITE_REDIRECTS.map(({ source, destination, status }) => ({
        source: source.replace("*", ":path*"),
        destination: destination.replace(":splat", ":path*"),
        statusCode: status,
      }));
    nextConfig.rewrites = async () => [
      { source: "/docs.md", destination: "/llm/index.md" },
      { source: "/docs/:a.md", destination: "/llm/:a.md" },
      { source: "/docs/:a/:b.md", destination: "/llm/:a/:b.md" },
      { source: "/docs/:a/:b/:c.md", destination: "/llm/:a/:b/:c.md" },
    ];
  }

  return withMDX(nextConfig);
}
