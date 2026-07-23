// The rendering engine a chart is built on. EvilCharts ships one file per chart per
// provider — you install `@evilcharts/area-chart` or its ECharts counterpart, never
// both — so this is an install-time choice, not a runtime prop.
//
// Docs mirror that split: everything provider-specific lives under /docs/<provider>/*.
// The exceptions are the intro (/docs) and Chart Config (/docs/chart-config), which
// documents the one contract both engines share.

export const PROVIDERS = ["recharts", "echarts"] as const;

export type Provider = (typeof PROVIDERS)[number];

export const DEFAULT_PROVIDER: Provider = "recharts";

interface ProviderMeta {
  /** Folder name under src/content/docs, and the URL segment. */
  id: Provider;
  /** Display name, as the upstream project spells it. */
  name: string;
  /** One-line pitch shown under the name in the switcher. */
  tagline: string;
  /** Charts aren't installable until the provider ships; gates the "Soon" badge. */
  available: boolean;
}

// Icons live in the switcher rather than here — this module is imported by
// next.config.ts, which can't resolve JSX.

export const PROVIDER_META: Record<Provider, ProviderMeta> = {
  recharts: {
    id: "recharts",
    name: "Recharts",
    tagline: "SVG · the original Evil charts",
    available: true,
  },
  echarts: {
    id: "echarts",
    name: "ECharts",
    tagline: "Canvas · built for scale",
    available: false,
  },
};

// localStorage key remembering the last provider the reader was in, so shared
// pages (/docs, /docs/chart-config) keep the switcher on their engine across reloads.
export const PROVIDER_STORAGE_KEY = "evilcharts-provider";

export function providerHref(provider: Provider) {
  // The shared intro lives at /docs for both engines. Recharts still has its own
  // index page; ECharts does not — its landing is the components overview.
  return provider === "echarts" ? "/docs/echarts/components" : `/docs/${provider}`;
}

/**
 * Resolve the active provider from a pathname.
 *
 * Returns null — rather than DEFAULT_PROVIDER — on shared pages like /docs and
 * /docs/chart-config, so the switcher can show "no engine selected" instead of
 * falsely implying you're reading Recharts docs.
 */
export function providerFromPathname(pathname: string): Provider | null {
  const segment = pathname.split("/").filter(Boolean)[1];
  return PROVIDERS.includes(segment as Provider) ? (segment as Provider) : null;
}
