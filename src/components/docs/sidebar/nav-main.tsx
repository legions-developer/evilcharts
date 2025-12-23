"use client";

import {
  Sidebar,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { getNavItemIcon } from "@/globals/functions/getNavItemIcon";
import { EXCLUDED_PAGES } from "@/globals/constants/docs-sidebar";
import { CaretRight } from "@carbon/icons-react";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { source } from "@/lib/source";
import { cn } from "@/lib/utils";
import { useState } from "react";
import Link from "next/link";

function TreeIndicator({
  activeTrigger,
  hasActiveChild,
}: {
  activeTrigger: ActiveTriggerProps;
  hasActiveChild: boolean;
}) {
  const activeIndex = activeTrigger.index;

  return (
    <svg className={cn("text-muted pointer-events-none absolute z-10 ml-[5px] flex h-full w-5! duration-200")}>
      <ellipse
        className="dark:text-muted text-[#DFDFDF]"
        cx="50%"
        cy="calc(100% - 15px)"
        rx="2"
        ry="2"
        fill="currentColor"
      />
      <line
        className="dark:text-muted text-[#DFDFDF]"
        x1="50%"
        y1="0%"
        x2="50%"
        y2="calc(100% - 15px)"
        stroke="currentColor"
        strokeWidth="1"
      />
      {hasActiveChild && (
        <>
          <motion.line
            key="line-1"
            className="text-primary"
            x1="50%"
            y1="0"
            x2="50%"
            stroke="currentColor"
            strokeWidth="1"
            initial={{
              y2: 0,
              opacity: 0,
            }}
            animate={{
              y2: activeIndex === 0 ? 11 : activeIndex * 34 + 11,
              opacity: 1,
            }}
            transition={{
              type: "spring",
              stiffness: 180 + activeIndex * 5,
              damping: 20,
            }}
          />
          <motion.rect
            className="text-primary"
            key="rect-1"
            x="32.5%"
            width="7"
            height="7"
            rx="1"
            fill="currentColor"
            style={{
              rotate: 45,
              transformOrigin: "center",
              transformBox: "fill-box",
            }}
            initial={{
              y: 0,
              opacity: 0,
            }}
            animate={{
              y: activeIndex === 0 ? 11 : activeIndex * 34 + 11,
              opacity: 1,
            }}
            transition={{
              type: "spring",
              stiffness: 180 + activeIndex * 5,
              damping: 20,
            }}
          />
        </>
      )}
    </svg>
  );
}

interface ActiveTriggerProps {
  url: string;
  index: number;
  id?: string;
}

export function NavMain({ tree }: React.ComponentProps<typeof Sidebar> & { tree: typeof source.pageTree }) {
  const pathname = usePathname();

  const [activeTrigger, setActiveTrigger] = useState<ActiveTriggerProps>(() => {
    // Find the folder containing the active page
    let childIndex = -1;
    let activeUrl = pathname;
    let activeId: string | undefined = undefined;

    for (const item of tree.children) {
      if (item.type === "folder") {
        const foundIndex = item.children.findIndex((child) => child.type === "page" && child.url === pathname);
        if (foundIndex !== -1) {
          childIndex = foundIndex;
          const child = item.children[foundIndex];
          if (child.type === "page") {
            activeUrl = child.url;
            activeId = child.$id;
          }
          break;
        }
      }
    }

    return {
      url: activeUrl,
      index: childIndex,
      id: activeId,
    };
  });

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Components</SidebarGroupLabel>
      <SidebarMenu>
        {tree.children.map((item) => {
          if (item.type !== "folder") return null;

          // Filter out pages that are in EXCLUDED_PAGES
          const visibleChildren = item.children.filter(
            (child) => child.type === "page" && !EXCLUDED_PAGES.includes(child.url),
          );

          // Skip folder if no visible children
          if (visibleChildren.length === 0) return null;

          // Check if any child is active (matches current pathname)
          const hasActiveChild = item.children.some(
            (child) => child.type === "page" && child.url === activeTrigger?.url,
          );

          return (
            <Collapsible key={item.$id} asChild className="group/collapsible" defaultOpen={hasActiveChild}>
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton
                    className={!hasActiveChild ? "text-muted-foreground hover:text-primary" : ""}
                    isActive={hasActiveChild}
                  >
                    {getNavItemIcon(item.$id)}
                    <span className="capitalize">{item.name}</span>
                    <CaretRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    <TreeIndicator activeTrigger={activeTrigger} hasActiveChild={hasActiveChild} key={item.$id} />
                    {item.children.map((subItem, index) => {
                      if (subItem.type !== "page") return null;
                      if (EXCLUDED_PAGES.includes(subItem.url)) return null;

                      const isActive = activeTrigger.url === subItem.url;

                      return (
                        <SidebarMenuSubItem key={subItem.$id} className={cn("relative flex w-full")}>
                          <SidebarMenuSubButton
                            className={cn("w-full pl-8", !isActive && "text-muted-foreground")}
                            onClick={() =>
                              setActiveTrigger({
                                url: subItem.url,
                                index: index,
                                id: subItem.$id,
                              })
                            }
                            asChild
                          >
                            <Link href={subItem.url}>
                              <span>{subItem.name}</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      );
                    })}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
