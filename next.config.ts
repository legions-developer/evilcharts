import { createMDX } from "fumadocs-mdx/next";
import type { NextConfig } from "next";

import { PROVIDERS as PROVIDER_IDS } from "./src/globals/constants/providers";

const PROVIDERS = PROVIDER_IDS.join("|");

// Chart doc folders live under a provider segment (/docs/<provider>/<chart>).
// Recharts predates the provider split, so its charts were served from /docs/<chart>.
// This alternation is what keeps the legacy rules below from swallowing /docs/recharts
// and /docs/echarts themselves — never widen it to a bare :chart param.
const RECHARTS_CHARTS = [
  "area-chart",
  "line-chart",
  "bar-chart",
  "composed-chart",
  "radar-chart",
  "pie-chart",
  "radial-chart",
  "sankey-chart",
].join("|");

// Plural spellings from a much older version of the site, still cached by Google.
// They can't be regex-folded into the singular rules, so they stay enumerated.
const LEGACY_PLURAL_CHARTS = [
  "area-charts",
  "line-charts",
  "bar-charts",
  "pie-charts",
  "radar-charts",
  "radial-charts",
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      {
        source: "/",
        destination: "/docs/",
        permanent: false,
      },

      // Neither provider has an index page — the intro is shared at /docs — so a
      // bare provider URL lands on that engine's components overview. /docs/recharts
      // was a real page until the Recharts-only pitch folded into the shared intro,
      // so this rule is also what keeps anything still linking to it out of a 404.
      {
        source: `/docs/:provider(${PROVIDERS})`,
        destination: "/docs/:provider/components",
        permanent: false,
      },

      // ── Chart folders have no index page; land on the default variant ─────
      // /docs/recharts/area-chart → /docs/recharts/area-chart/static
      {
        source: `/docs/:provider(${PROVIDERS})/:chart(${RECHARTS_CHARTS})`,
        destination: "/docs/:provider/:chart/static",
        permanent: true,
      },

      // ── Pre-provider-split chart URLs → /docs/recharts/* ──────────────────
      // Order matters: the bare rule must precede the :slug* rule, since
      // Next.js takes the first match and both would otherwise claim /docs/area-chart.
      {
        source: `/docs/:chart(${RECHARTS_CHARTS})`,
        destination: "/docs/recharts/:chart/static",
        permanent: true,
      },
      {
        source: `/docs/:chart(${RECHARTS_CHARTS})/:slug*`,
        destination: "/docs/recharts/:chart/:slug*",
        permanent: true,
      },

      // ── Pre-provider-split top-level pages ───────────────────────────────
      // chart-config stays shared at /docs/chart-config, so it is absent here.
      {
        source: "/docs/:page(installation|components)",
        destination: "/docs/recharts/:page",
        permanent: true,
      },
      {
        source: "/docs/ui/:slug*",
        destination: "/docs/recharts/ui/:slug*",
        permanent: true,
      },

      // ── Older still: plural chart URLs cached on Google ───────────────────
      ...LEGACY_PLURAL_CHARTS.map((plural) => ({
        source: `/docs/${plural}`,
        destination: `/docs/recharts/${plural.replace(/-charts$/, "-chart")}/static`,
        permanent: true as const,
      })),
      {
        source: "/docs/prerequisites",
        destination: "/docs/recharts/installation",
        permanent: true,
      },
    ];
  },
  rewrites() {
    // Serve any docs page as markdown by appending .md. Depth is enumerated rather
    // than globbed because the .md suffix binds to the final segment, which
    // path-to-regexp can't express in a catch-all. Three levels covers the deepest
    // page today (/docs/<provider>/<chart>/<variant>.md).
    return [
      {
        source: "/docs.md",
        destination: "/llm",
      },
      {
        source: "/docs/:a.md",
        destination: "/llm/:a",
      },
      {
        source: "/docs/:a/:b.md",
        destination: "/llm/:a/:b",
      },
      {
        source: "/docs/:a/:b/:c.md",
        destination: "/llm/:a/:b/:c",
      },
    ];
  },
};

const withMDX = createMDX();

export default withMDX(nextConfig);
