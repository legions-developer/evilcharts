import { HistoryIcon, HouseIcon, ShapesIcon, SquareAddonIcon } from "@/assets/icons";

export const getStartedOptions: {
  name: string;
  url: string;
  icon: React.ReactNode;
}[] = [
  {
    name: "Get Started",
    url: "/docs",
    icon: <HouseIcon />,
  },
  {
    name: "Installation",
    url: "/installation",
    icon: <SquareAddonIcon />,
  },
  {
    name: "Components",
    url: "/components",
    icon: <ShapesIcon />,
  },
  {
    name: "Changelog",
    url: "/changelog",
    icon: <HistoryIcon />,
  },
];
