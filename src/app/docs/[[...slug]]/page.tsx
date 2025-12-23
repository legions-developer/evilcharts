import { DocsTableOfContents } from "@/components/docs/mdx/components/table-of-content";
import { MDXNavigation } from "@/components/docs/mdx/components/navigation";
import { ThumbsDownIcon, ThumbsUpIcon } from "@/assets/icons";
import { findNeighbour } from "fumadocs-core/page-tree";
import { mdxComponents } from "@/components/docs/mdx";
import { Button } from "@/components/ui/button";
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
        <div className="mt-40 flex flex-col gap-8">
          <div className="flex flex-row items-center justify-between">
            <div className="flex flex-row items-center gap-4">
              <span className="text-muted-foreground text-sm">Did you like the content?</span>
              <div className="space-x-2">
                <Button className="text-muted-foreground hover:text-primary" variant="outline" size="sm">
                  <ThumbsUpIcon />
                  <span>Good</span>
                </Button>
                <Button className="text-muted-foreground hover:text-primary" variant="outline" size="sm">
                  <ThumbsDownIcon />
                  <span>Bad</span>
                </Button>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-8">
            <div>
              {neighbours.previous ? (
                <MDXNavigation
                  type="previous"
                  title={neighbours.previous.name}
                  url={neighbours.previous.url}
                  description={neighbours.previous.description}
                />
              ) : (
                <div className="h-full rounded-md border border-dashed" />
              )}
            </div>
            <div>
              {neighbours.next ? (
                <MDXNavigation
                  type="next"
                  title={neighbours.next.name}
                  url={neighbours.next.url}
                  description={neighbours.next.description}
                />
              ) : (
                <div className="h-full rounded-md border border-dashed" />
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
