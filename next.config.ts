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
    ];
  },
};

const withMDX = createMDX();

export default withMDX(nextConfig);
