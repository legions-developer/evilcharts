import { AppShell } from "@/components/docs/layout/app-shell";
import { DocsSidebar } from "@/components/docs/sidebar";
import type { ReactNode } from "react";

export default function DocsLayout({ children }: { children: ReactNode }) {
  return <AppShell sidebar={<DocsSidebar />}>{children}</AppShell>;
}

export const dynamic = "force-static";
export const revalidate = 86400; // 1 day – we need to rebuild the page so that it refreshes the GitHub stars daily
