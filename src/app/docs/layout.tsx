import DecorativeBorder from "@/components/docs/layout/decorative-border-svg";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import DocsHeader from "@/components/docs/sidebar/header";
import { DocsSidebar } from "@/components/docs/sidebar";
import { cn } from "@/lib/utils";
import React from "react";

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <DocsSidebar />
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
            <>{children}</>
          </SidebarInset>
        </div>
      </div>
    </SidebarProvider>
  );
}

export const dynamic = "force-static";
export const revalidate = 86400; // 1 day – we need to rebuild the page so that it refreshes the GitHub stars daily
