import { ToolsSidebar } from "@/components/docs/sidebar/tools-sidebar";
import { AppShell } from "@/components/docs/layout/app-shell";
import type { ReactNode } from "react";

export default function ToolsLayout({ children }: { children: ReactNode }) {
  return <AppShell sidebar={<ToolsSidebar />}>{children}</AppShell>;
}

export const dynamic = "force-static";
export const revalidate = 86400; // 1 day – keep the header's GitHub star count fresh
