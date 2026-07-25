"use client";

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface SidebarOption {
  name: string;
  url: string;
  icon: React.ReactNode;
}

interface RenderDefaultOptionsProps {
  options: SidebarOption[];
  label: string;
  /** URLs present in the page tree; options pointing elsewhere are dropped. */
  existingUrls?: Set<string>;
}

export function RenderDefaultOptions({ options, label, existingUrls }: RenderDefaultOptionsProps) {
  const pathname = usePathname();
  const { isMobile, setOpenMobile } = useSidebar();

  const handleLinkClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  const visibleOptions = existingUrls
    ? options.filter((item) => existingUrls.has(item.url))
    : options;

  if (visibleOptions.length === 0) return null;

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>{label}</SidebarGroupLabel>
      <SidebarMenu>
        {visibleOptions.map((item) => {
          const isActive = pathname === item.url;

          return (
            <SidebarMenuItem key={item.name}>
              <SidebarMenuButton
                render={<Link href={item.url} onClick={handleLinkClick} />}
                className={cn(
                  !isActive &&
                    "dark:text-muted-foreground/80 text-muted-foreground/90 hover:text-primary dark:hover:text-primary",
                )}
                isActive={isActive}
              >
                {item.icon}
                <span>{item.name}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
