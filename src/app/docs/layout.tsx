import { SidebarHeader, SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { DocsSidebar } from "@/components/docs/sidebar";
import React from "react";

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <DocsSidebar />
      <SidebarInset>
        <SidebarHeader className="bg-background fixed z-50 h-14 w-full border-b"></SidebarHeader>
        <>{children}</>
      </SidebarInset>
    </SidebarProvider>
  );
}
