import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import DocsHeader from "@/components/docs/sidebar/header";
import { DocsSidebar } from "@/components/docs/sidebar";
import React from "react";

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <DocsSidebar />
      <SidebarInset>
        <DocsHeader />
        <>{children}</>
      </SidebarInset>
    </SidebarProvider>
  );
}

export const dynamic = "force-static";
export const revalidate = 86400; // 1 day – we need to rebuild the page so that it refreshes the GitHub stars daily
