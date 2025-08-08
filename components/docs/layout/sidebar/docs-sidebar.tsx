"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { SIDEBAR_OPTIONS } from "@/constants/docs/sidebar-options";
import DocsSidebarHeader from "./sidebar-header";
import Link from "next/link";
import { SidebarOptionsProps } from "@/types/docs/sidebar-types";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function DocsSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const { isMobile, setOpenMobile } = useSidebar();

  const handleLinkClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  const getActiveItem = (items: SidebarOptionsProps) => {
    return [...items.gettingStarted, ...items.components]
      .flatMap((group) => group.items)
      .find((item) => item.url === pathname);
  };

  return (
    <Sidebar className="z-50" {...props}>
      <DocsSidebarHeader />
      <SidebarContent className="mt-2">
        {SIDEBAR_OPTIONS.gettingStarted.map((item) => (
          <SidebarGroup key={item.title}>
            <SidebarGroupLabel>{item.title}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {item.items.map((item) => {
                  const isActive =
                    getActiveItem(SIDEBAR_OPTIONS)?.url === item.url;

                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        className={cn(
                          "border border-transparent",
                          isActive &&
                            "shadow-[inset_0px_0px_0px_1px_#fff] dark:shadow-[inset_0px_0px_0px_1px_#000] border"
                        )}
                      >
                        <Link href={item.url} onClick={handleLinkClick}>
                          {item.icon}
                          <span>{item.title}</span>
                          {item.badge && (
                            <Badge variant={item.badge.variant}>
                              <span
                                className={cn(
                                  item.badge.sparkles && "sparkles-bg"
                                )}
                              >
                                {item.badge.label}
                              </span>
                            </Badge>
                          )}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
        {SIDEBAR_OPTIONS.components.map((item) => (
          <SidebarGroup key={item.title}>
            <SidebarGroupLabel>{item.title}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {item.items.map((item) => {
                  const isActive =
                    getActiveItem(SIDEBAR_OPTIONS)?.url === item.url;

                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        className={cn(
                          "border border-transparent",
                          isActive &&
                            "shadow-[inset_0px_0px_0px_1px_#fff] dark:shadow-[inset_0px_0px_0px_1px_#000] border"
                        )}
                      >
                        <Link href={item.url} onClick={handleLinkClick}>
                          {item.icon}
                          <span>{item.title}</span>
                          {item.badge && (
                            <Badge variant={item.badge.variant}>
                              <span className="">{item.badge.label}</span>
                            </Badge>
                          )}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenuButton
          variant="outline"
          className="border border-dashed flex justify-center text-xs"
          asChild
        >
          <Link
            href="https://x.com/legionsdev"
            target="_blank"
            rel="noopener noreferrer"
          >
            + Request Chart
          </Link>
        </SidebarMenuButton>
      </SidebarFooter>
    </Sidebar>
  );
}
