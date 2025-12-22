import { source } from "@/lib/source";
import { notFound } from "next/navigation";
import fm from "front-matter";
import { z } from "zod";
import { findNeighbour } from "fumadocs-core/page-tree";

export function generateStaticParams() {
  return source.generateParams();
}

export default async function Page(props: {
  params: Promise<{ slug: string[] }>;
}) {
  const params = await props.params;
  const page = source.getPage(params.slug);

  if (!page) {
    notFound();
  }

  const doc = page.data;
  const MDX = doc.body;
  const neighbours = findNeighbour(source.pageTree, page.url);

  const raw = await page.data.getText("raw");
  const { attributes } = fm(raw);
  const { links } = z
    .object({
      links: z
        .object({
          doc: z.string().optional(),
          api: z.string().optional(),
        })
        .optional(),
    })
    .parse(attributes);

  console.log("source,", source.pageTree);

  console.log("LINKS", links);
  console.log("NEIGHBOURS", neighbours);

  return (
    <div className="flex items-stretch text-[1.05rem] sm:text-[15px] xl:w-full flex-col gap-10 p-10">
      <div>{doc.title}</div>
      <MDX />
    </div>
  );
}
