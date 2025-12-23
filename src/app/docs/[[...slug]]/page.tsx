import { DocsTableOfContents } from "@/components/docs/mdx/table-of-content";
import { MDXNavigation } from "@/components/docs/mdx/navigation";
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

  return (
    <div className="relative flex">
      <div className="docs-container flex flex-col py-12 pb-32">
        <div className="flex flex-col gap-1">
          <h1 className="scroll-m-20 text-4xl font-semibold tracking-tight sm:text-3xl xl:text-4xl">{doc.title}</h1>
          {doc.description && <p className="text-muted-foreground text-[15px]">{doc.description}</p>}
        </div>
        <div className="text-primary/80 mt-8 w-full flex-1 text-[14px] *:data-[slot=alert]:first:mt-0">
          <MDX components={mdxComponents} />
        </div>
        <div className="mt-40">
          <div className="grid grid-cols-2 gap-10">
            <div>
              {neighbours.previous && (
                <MDXNavigation
                  type="previous"
                  title={neighbours.previous.name}
                  url={neighbours.previous.url}
                  description={neighbours.previous.description}
                />
              )}
            </div>
            <div>
              {neighbours.next && (
                <MDXNavigation
                  type="next"
                  title={neighbours.next.name}
                  url={neighbours.next.url}
                  description={neighbours.next.description}
                />
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="sticky top-26 hidden h-fit self-start xl:flex">
        {doc.toc?.length ? (
          <div className="no-scrollbar w-72 overflow-y-auto px-8">
            <DocsTableOfContents toc={doc.toc} />
          </div>
        ) : null}
      </div>
    </div>
  );
}
