import { NextResponse, type NextRequest } from "next/server";
import { notFound } from "next/navigation";

import { source } from "@/lib/source";
import { processMdxForLLMs } from "@/lib/llm";

export const revalidate = false;

export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug?: string[] }> }) {
  const [{ slug }] = await Promise.all([params]);

  const page = source.getPage(slug);

  if (!page) {
    notFound();
  }

  const rawContent = await page.data.getText("raw");
  const processedContent = processMdxForLLMs(rawContent);

  return new NextResponse(processedContent, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
    },
  });
}

export function generateStaticParams() {
  return source.generateParams();
}
