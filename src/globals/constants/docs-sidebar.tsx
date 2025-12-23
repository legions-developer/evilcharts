import { HistoryIcon, HouseIcon, ShapesIcon, SquareAddon } from "@/assets/icons";

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
    icon: <SquareAddon />,
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
