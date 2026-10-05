import { NextResponse, type NextRequest } from "next/server";
import { notFound } from "next/navigation";

import { getDocContent } from "@/lib/content";
import { processMdxForLLMs } from "@/lib/llm";
import { source } from "@/lib/source";

export const revalidate = false;

export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug?: string[] }> }) {
  const [{ slug }] = await Promise.all([params]);

  const page = source.getPage(slug);

  if (!page) {
    notFound();
  }

  const rawContent = getDocContent(page.path);
  const processedContent = processMdxForLLMs(rawContent);

  return new NextResponse(processedContent, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      Vary: "Accept",
    },
  });
}

export function generateStaticParams() {
  return source.generateParams();
}
