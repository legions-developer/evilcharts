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
  useSidebar,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { getNavItemIcon } from "@/globals/functions/getNavItemIcon";
import { EXCLUDED_PAGES } from "@/globals/constants/docs-sidebar";
import { CaretRight } from "@carbon/icons-react";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { source } from "@/lib/source";
import { cn } from "@/lib/utils";
import { useMemo } from "react";
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
    <svg
      className={cn(
        "text-muted pointer-events-none absolute z-10 ml-[5px] flex h-full w-5! duration-200",
      )}
    >
      <ellipse
        className="text-path"
        cx="50%"
        cy="calc(100% - 15px)"
        rx="2"
        ry="2"
        fill="currentColor"
      />
      <rect
        className="text-path"
        x="9.5"
        y="0"
        width="1"
        height="calc(100% - 15px)"
        fill="currentColor"
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
              y2: activeIndex === 0 ? 11 : activeIndex * 29.5 + 11,
              opacity: 1,
            }}
            transition={{
              type: "spring",
              stiffness: 200 - activeIndex * 10,
              damping: 20,
            }}
          />
          <motion.rect
            className="text-primary"
            key="rect-1"
            x="32.10%"
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
              y: activeIndex === 0 ? 11 : activeIndex * 29.5 + 11,
              opacity: 1,
            }}
            transition={{
              type: "spring",
              stiffness: 200 - activeIndex * 10,
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

export function NavMain({
  tree,
}: React.ComponentProps<typeof Sidebar> & { tree: typeof source.pageTree }) {
  const pathname = usePathname();
  const { isMobile, setOpenMobile } = useSidebar();

  const handleLinkClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  // Derive activeTrigger from pathname - automatically resets when navigating away
  const activeTrigger = useMemo<ActiveTriggerProps>(() => {
    // Index every folder page by url once, so the active page is an O(1) lookup.
    const pageIndex = new Map<string, { index: number; id?: string }>();

    for (const item of tree.children) {
      if (item.type !== "folder") continue;
      item.children.forEach((child, index) => {
        if (child.type === "page") {
          pageIndex.set(child.url, { index, id: child.$id });
        }
      });
    }

    const active = pageIndex.get(pathname);

    return {
      url: active ? pathname : "",
      index: active ? active.index : -1,
      id: active?.id,
    };
  }, [pathname, tree.children]);

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

          // If there is only one child, show it directly as clickable element 
          if (visibleChildren.length === 1) {
            const singleChild = visibleChildren[0];
            const isActive = singleChild.type === "page" && singleChild.url === pathname;

            return (
              <SidebarMenuItem key={item.$id}>
                <SidebarMenuButton
                  className={cn(
                    !isActive &&
                      "text-muted-foreground/90 dark:text-muted-foreground/80 hover:text-primary dark:hover:text-primary",
                  )}
                  isActive={isActive}
                  asChild
                >
                  <Link
                    href={singleChild.type === "page" ? singleChild.url : "#"}
                    onClick={handleLinkClick}
                  >
                    {getNavItemIcon(item.$id)}
                    <span className="capitalize">{item.name}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          }

          return (
            <Collapsible
              key={item.$id}
              asChild
              className="group/collapsible"
              defaultOpen={hasActiveChild}
            >
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton
                    className={
                      !hasActiveChild
                        ? "text-muted-foreground/90 dark:text-muted-foreground/80 hover:text-primary dark:hover:text-primary"
                        : ""
                    }
                    isActive={hasActiveChild}
                  >
                    {getNavItemIcon(item.$id)}
                    <span className="capitalize">{item.name}</span>
                    <CaretRight
                      className={cn(
                        "ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90",
                        !hasActiveChild ? "opacity-60" : "opacity-100",
                      )}
                    />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    <TreeIndicator
                      activeTrigger={activeTrigger}
                      hasActiveChild={hasActiveChild}
                      key={item.$id}
                    />
                    {item.children.map((subItem) => {
                      if (subItem.type !== "page") return null;
                      if (EXCLUDED_PAGES.includes(subItem.url)) return null;

                      const isActive = activeTrigger.url === subItem.url;

                      if (item.name == subItem.name) {
                        subItem.name = "Default"; // for base charts
                      }

                      return (
                        <SidebarMenuSubItem
                          key={subItem.$id}
                          className={cn("relative flex w-full")}
                        >
                          <SidebarMenuSubButton
                            className={cn(
                              "w-full pl-8",
                              !isActive &&
                                "text-muted-foreground/90 dark:text-muted-foreground/80 hover:text-primary dark:hover:text-primary",
                            )}
                            asChild
                          >
                            <Link href={subItem.url} onClick={handleLinkClick}>
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
