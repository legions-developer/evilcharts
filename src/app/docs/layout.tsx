import {
  SidebarHeader,
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { DocsSidebar } from "@/components/docs/sidebar";
import React from "react";

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <DocsSidebar />
      <SidebarInset>
        <SidebarHeader className="h-14 border-b"></SidebarHeader>
        <>{children}</>
      </SidebarInset>
    </SidebarProvider>
  );
}
