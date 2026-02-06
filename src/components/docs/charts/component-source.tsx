import { CodeCollapsibleWrapper } from "@/components/docs/charts/code-collapsible-wrapper";
import { CodeBlock } from "@/components/docs/mdx/components/code";
import { getRegistryItem } from "@/lib/registry";
import type { ComponentProps } from "react";
import fs from "node:fs/promises";
import { cn } from "@/lib/utils";
import path from "node:path";

export async function ComponentSource({
  name,
  src,
  title,
  language,
  collapsible = true,
  className,
}: ComponentProps<"div"> & {
  name?: string;
  src?: string;
  title?: string;
  language?: string;
  collapsible?: boolean;
}) {
  if (!name && !src) {
    return null;
  }

  let code: string | undefined;

  if (name) {
    const item = await getRegistryItem(name);
    code = item?.files?.[0]?.content;
  }

  if (src) {
    try {
      const file = await fs.readFile(path.join(process.cwd(), src), "utf-8");
      code = file;
    } catch {
      console.error(`[ComponentSource] Failed to read source file: ${src}`);
      return null;
    }
  }

  if (!code) {
    return null;
  }

  const lang = language ?? title?.split(".").pop() ?? "tsx";

  if (!collapsible) {
    return (
      <div className={cn("relative", className)}>
        <CodeBlock code={code} language={lang} title={title} />
      </div>
    );
  }

  return (
    <CodeCollapsibleWrapper className={className}>
      <CodeBlock withWrapper code={code} language={lang} title={title} />
    </CodeCollapsibleWrapper>
  );
}
