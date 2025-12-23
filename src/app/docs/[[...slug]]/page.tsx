import { DocsTableOfContents } from "@/components/docs/mdx/table-of-content";
import { findNeighbour } from "fumadocs-core/page-tree";
import { mdxComponents } from "@/components/docs/mdx";
import { notFound } from "next/navigation";
import { source } from "@/lib/source";

export function generateStaticParams() {
  return source.generateParams();
}

export default async function Page(props: { params: Promise<{ slug: string[] }> }) {
  const params = await props.params;
  const page = source.getPage(params.slug);

  if (!page) {
    notFound();
  }

  const doc = page.data;
  const MDX = doc.body;
  const neighbours = findNeighbour(source.pageTree, page.url);

  console.log("NEIGHBOURS", neighbours);

  return (
    <div className="relative flex">
      <div className="docs-container flex flex-col py-28">
        <div className="flex flex-col gap-1">
          <h1 className="scroll-m-20 text-4xl font-semibold tracking-tight sm:text-3xl xl:text-4xl">{doc.title}</h1>
          {doc.description && <p className="text-muted-foreground text-[15px] text-balance">{doc.description}</p>}
        </div>
        <div className="text-primary/85 mt-8 w-full flex-1 text-[14px] *:data-[slot=alert]:first:mt-0">
          <MDX components={mdxComponents} />
        </div>
      </div>
      <div className="sticky top-28 hidden h-fit self-start xl:flex">
        {doc.toc?.length ? (
          <div className="no-scrollbar w-72 overflow-y-auto px-8">
            <DocsTableOfContents toc={doc.toc} />
            <div className="h-12" />
          </div>
        ) : null}
      </div>
    </div>
  );
}
