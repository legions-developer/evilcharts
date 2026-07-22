import {
  BackgroundIcon,
  ChartConfigIcon,
  ChartLegendIcon,
  HouseIcon,
  ShapesIcon,
  SquareAddonIcon,
  TooltipIcon,
} from "@/assets/icons";
import type { Provider } from "@/globals/constants/providers";

interface SidebarOption {
  name: string;
  url: string;
  icon: React.ReactNode;
}

// Most sidebar links now live under a provider segment, so these are functions of
// the active provider rather than constants. Chart Config is the exception — it
// documents the config contract both engines share, so it keeps a provider-free URL.

export function getStartedOptions(provider: Provider): SidebarOption[] {
  return [
    {
      name: "Get Started",
      url: "/docs",
      icon: <HouseIcon />,
    },
    {
      name: "Installation",
      url: `/docs/${provider}/installation`,
      icon: <SquareAddonIcon />,
    },
    {
      name: "Components",
      url: `/docs/${provider}/components`,
      icon: <ShapesIcon />,
    },
  ];
}

export function getChartComponentOptions(provider: Provider): SidebarOption[] {
  return [
    {
      name: "Background",
      url: `/docs/${provider}/ui/background`,
      icon: <BackgroundIcon />,
    },
    {
      name: "Tooltip",
      url: `/docs/${provider}/ui/tooltip`,
      icon: <TooltipIcon />,
    },
    {
      name: "Legend",
      url: `/docs/${provider}/ui/legend`,
      icon: <ChartLegendIcon />,
    },
  ];
}

export const DocumentationOptions: SidebarOption[] = [
  {
    name: "Chart Config",
    url: "/docs/chart-config",
    icon: <ChartConfigIcon />,
  },
];

// Pages reachable from the hardcoded groups above; NavMain skips them so they
// don't appear twice. Provider-scoped entries are matched by suffix, since the
// leading /docs/<provider> varies.
export const EXCLUDED_PAGE_SUFFIXES: string[] = ["/installation", "/components", "/changelog"];

export function isExcludedPage(url: string): boolean {
  return EXCLUDED_PAGE_SUFFIXES.some((suffix) => url.endsWith(suffix));
}
