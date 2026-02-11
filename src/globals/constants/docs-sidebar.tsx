import {
  BackgroundIcon,
  ChartConfigIcon,
  ChartLegendIcon,
  HouseIcon,
  ShapesIcon,
  SquareAddonIcon,
  TooltipIcon,
} from "@/assets/icons";

interface SidebarOption {
  name: string;
  url: string;
  icon: React.ReactNode;
}

export const getStartedOptions: SidebarOption[] = [
  {
    name: "Get Started",
    url: "/docs",
    icon: <HouseIcon />,
  },
  {
    name: "Installation",
    url: "/docs/installation",
    icon: <SquareAddonIcon />,
  },
  {
    name: "Components",
    url: "/docs/components",
    icon: <ShapesIcon />,
  },
];

export const EXCLUDED_PAGES: string[] = [
  "/docs/installation",
  "/docs/components",
  "/docs/changelog",
];

export const ChartComponentOptions: SidebarOption[] = [
  {
    name: "Background",
    url: "/docs/ui/background",
    icon: <BackgroundIcon />,
  },
  {
    name: "Tooltip",
    url: "/docs/ui/tooltip",
    icon: <TooltipIcon />,
  },
  {
    name: "Legend",
    url: "/docs/ui/legend",
    icon: <ChartLegendIcon />,
  },
];

export const DocumentationOptions: SidebarOption[] = [
  {
    name: "Chart Config",
    url: "/docs/chart-config",
    icon: <ChartConfigIcon />,
  },
];
