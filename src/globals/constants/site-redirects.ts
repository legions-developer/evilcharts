import { PROVIDERS } from "./providers";

// Keep this explicit so legacy chart URLs never capture provider or shared pages.
const CHARTS = [
  "area-chart",
  "line-chart",
  "bar-chart",
  "composed-chart",
  "radar-chart",
  "pie-chart",
  "radial-chart",
  "sankey-chart",
];

const LEGACY_PLURAL_CHARTS = [
  "area-charts",
  "line-charts",
  "bar-charts",
  "pie-charts",
  "radar-charts",
  "radial-charts",
];

type SiteRedirect = {
  source: string;
  destination: string;
  status: 307 | 308;
};

export const SITE_REDIRECTS: SiteRedirect[] = [
  ...PROVIDERS.map((provider) => ({
    source: `/docs/${provider}`,
    destination: `/docs/${provider}/components`,
    status: 307 as const,
  })),
  ...PROVIDERS.flatMap((provider) =>
    CHARTS.map((chart) => ({
      source: `/docs/${provider}/${chart}`,
      destination: `/docs/${provider}/${chart}/static`,
      status: 308 as const,
    })),
  ),
  ...CHARTS.flatMap((chart) => [
    {
      source: `/docs/${chart}`,
      destination: `/docs/recharts/${chart}/static`,
      status: 308 as const,
    },
    {
      source: `/docs/${chart}/*`,
      destination: `/docs/recharts/${chart}/:splat`,
      status: 308 as const,
    },
  ]),
  ...["installation", "components"].map((page) => ({
    source: `/docs/${page}`,
    destination: `/docs/recharts/${page}`,
    status: 308 as const,
  })),
  { source: "/docs/ui", destination: "/docs/recharts/ui", status: 308 },
  { source: "/docs/ui/*", destination: "/docs/recharts/ui/:splat", status: 308 },
  ...LEGACY_PLURAL_CHARTS.map((chart) => ({
    source: `/docs/${chart}`,
    destination: `/docs/recharts/${chart.replace(/-charts$/, "-chart")}/static`,
    status: 308 as const,
  })),
  { source: "/docs/prerequisites", destination: "/docs/recharts/installation", status: 308 },
];
