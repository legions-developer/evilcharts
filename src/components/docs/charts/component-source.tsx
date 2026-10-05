import { CodeCollapsibleWrapper } from "@/components/docs/charts/code-collapsible-wrapper";
import { CodeBlock } from "@/components/docs/mdx/components/code";
import { getRegistryItem } from "@/lib/registry";
import { getSourceContent } from "@/lib/content";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

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
    code = getSourceContent(src);
    if (code === undefined) {
      console.error(`[ComponentSource] Source file is missing from the content build: ${src}`);
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
