import { createMDX } from "fumadocs-mdx/next";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      {
        source: "/",
        destination: "/docs/",
        permanent: true,
      },
      {
        source: "/docs/area-chart",
        destination: "/docs/area-chart/default",
        permanent: true,
      },
      {
        source: "/docs/bar-chart",
        destination: "/docs/bar-chart/default",
        permanent: true,
      },
      {
        source: "/docs/composed-chart",
        destination: "/docs/composed-chart/default",
        permanent: true,
      },
      {
        source: "/docs/line-chart",
        destination: "/docs/line-chart/default",
        permanent: true,
      },
      {
        source: "/docs/pie-chart",
        destination: "/docs/pie-chart/default",
        permanent: true,
      },
      {
        source: "/docs/radar-chart",
        destination: "/docs/radar-chart/default",
        permanent: true,
      },
      {
        source: "/docs/radial-chart",
        destination: "/docs/radial-chart/default",
        permanent: true,
      },
      {
        source: "/docs/sankey-chart",
        destination: "/docs/sankey-chart/default",
        permanent: true,
      },
    ];
  },
};

const withMDX = createMDX();

export default withMDX(nextConfig);
