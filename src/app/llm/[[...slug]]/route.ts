import { NextResponse, type NextRequest } from "next/server";
import { notFound } from "next/navigation";

import { processMdxForLLMs } from "@/lib/llm";
import { source } from "@/lib/source";

export const revalidate = false;
export const dynamic = "force-static";
export const dynamicParams = false;

export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug?: string[] }> }) {
  const [{ slug }] = await Promise.all([params]);

  const segments = [...(slug ?? [])];
  const last = segments.pop()?.replace(/\.md$/, "");
  if (last && !(segments.length === 0 && last === "index")) segments.push(last);
  const page = source.getPage(segments);

  if (!page) {
    notFound();
  }

  const rawContent = await page.data.getText("raw");
  const processedContent = processMdxForLLMs(rawContent);

  return new NextResponse(processedContent, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      Vary: "Accept",
    },
  });
}

export function generateStaticParams() {
  // Every route ends in .md so the root document can coexist with nested files
  // in the exported filesystem. The export script places these at /docs/**.md.
  return source.getPages().map((page) => {
    const slug = [...page.slugs];
    const last = slug.pop();
    return { slug: [...slug, `${last ?? "index"}.md`] };
  });
}
