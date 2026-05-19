import DecorativeBorder from "@/components/docs/layout/decorative-border-svg";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import DocsHeader from "@/components/docs/sidebar/header";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

/**
 * Shared chrome for the /docs and /tools route trees — the sidebar provider,
 * decorative border, sticky header and rounded content surface. Each route
 * passes its own sidebar so the two stay visually identical without drifting.
 */
export function AppShell({ sidebar, children }: { sidebar: ReactNode; children: ReactNode }) {
  return (
    <SidebarProvider>
      {sidebar}
      <div className={cn("bg-sidebar w-full", "p-0 sm:p-2")}>
        <DecorativeBorder />
        <div
          className={cn(
            "no-scrollbar bg-background overflow-scroll sm:h-[calc(100vh-1rem)] sm:overscroll-none sm:border",
            "sm:rounded-tl-md sm:rounded-br-xl sm:rounded-bl-md", // bottom-right is XL to match mac-os browser radius (fk winodws :p)
          )}
        >
          <SidebarInset>
            <DocsHeader />
            {children}
          </SidebarInset>
        </div>
      </div>
    </SidebarProvider>
  );
}
