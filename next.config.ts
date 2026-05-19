import { createMDX } from "fumadocs-mdx/next";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      {
        source: "/",
        destination: "/docs/",
        permanent: false,
      },
      {
        source: "/docs/area-chart",
        destination: "/docs/area-chart/static",
        permanent: true,
      },
      {
        source: "/docs/bar-chart",
        destination: "/docs/bar-chart/static",
        permanent: true,
      },
      {
        source: "/docs/composed-chart",
        destination: "/docs/composed-chart/static",
        permanent: true,
      },
      {
        source: "/docs/line-chart",
        destination: "/docs/line-chart/static",
        permanent: true,
      },
      {
        source: "/docs/pie-chart",
        destination: "/docs/pie-chart/static",
        permanent: true,
      },
      {
        source: "/docs/radar-chart",
        destination: "/docs/radar-chart/static",
        permanent: true,
      },
      {
        source: "/docs/radial-chart",
        destination: "/docs/radial-chart/static",
        permanent: true,
      },
      {
        source: "/docs/sankey-chart",
        destination: "/docs/sankey-chart/static",
        permanent: true,
      },
      // Some old projects redirects cached on google
      {
        source: "/docs/line-charts",
        destination: "/docs/line-chart/static",
        permanent: true,
      },
      {
        source: "/docs/area-charts",
        destination: "/docs/area-chart/static",
        permanent: true,
      },
      {
        source: "/docs/bar-charts",
        destination: "/docs/bar-chart/static",
        permanent: true,
      },
      {
        source: "/docs/pie-charts",
        destination: "/docs/pie-chart/static",
        permanent: true,
      },
      {
        source: "/docs/radar-charts",
        destination: "/docs/radar-chart/static",
        permanent: true,
      },
      {
        source: "/docs/radial-charts",
        destination: "/docs/radial-chart/static",
        permanent: true,
      },
      {
        source: "/docs/prerequisites",
        destination: "/docs/installation",
        permanent: true,
      },
      // The star-history tool moved out of /docs into its own /tools route.
      {
        source: "/docs/tools/star-history",
        destination: "/tools/star-history",
        permanent: true,
      },
    ];
  },
  rewrites() {
    return [
      {
        source: "/docs.md",
        destination: "/llm",
      },
      {
        source: "/docs/:slug.md",
        destination: "/llm/:slug",
      },
      {
        source: "/docs/:chart/:slug.md",
        destination: "/llm/:chart/:slug",
      },
      {
        source: "/docs/:chart/:slug/blocks.md",
        destination: "/llm/:chart/:slug/blocks",
      },
    ];
  },
};

const withMDX = createMDX();

export default withMDX(nextConfig);
