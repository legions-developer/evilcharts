import { DocsTableOfContents } from "@/components/docs/mdx/components/table-of-content";
import { FeedbackButtons } from "@/components/docs/mdx/components/feedback-buttons";
import { MDXNavigation } from "@/components/docs/mdx/components/navigation";
import { DocsCopyPage } from "@/components/docs/layout/docs-copy-button";
import { findNeighbour } from "fumadocs-core/page-tree";
import { mdxComponents } from "@/components/docs/mdx";
import { PROVIDER_META, PROVIDERS } from "@/globals/constants/providers";
import { processMdxForLLMs } from "@/lib/llm";
import { notFound } from "next/navigation";
import { absoluteUrl, SITE_URL } from "@/lib/utils";
import { LinkIcon } from "lucide-react";
import { source } from "@/lib/source";
import type { Metadata } from "next";

export function generateStaticParams() {
  return source.generateParams();
}

export async function generateMetadata(props: {
  params: Promise<{ slug?: string[] }>;
}): Promise<Metadata> {
  const params = await props.params;
  const page = source.getPage(params.slug);

  if (!page) return {};

  const { title, description, image } = page.data;

  const url = absoluteUrl(page.url);
  const ogImage = absoluteUrl(image ?? "/og/og-image.png");

  return {
    title,
    description,
    alternates: {
      canonical: url,
      types: {
        "text/markdown": page.url === "/docs" ? "/docs.md" : `${page.url}.md`,
      },
    },
    openGraph: {
      type: "article",
      url,
      title,
      description,
      siteName: "Evil Charts",
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: `${title} — Evil Charts`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}

type DocsPage = NonNullable<ReturnType<typeof source.getPage>>;

// Breadcrumb skips the chart-folder segment (it only redirects) and points the
// provider crumb at its components overview — every crumb must resolve to a 200.
function buildDocsJsonLd(page: DocsPage) {
  const { title, description, image } = page.data;
  const url = absoluteUrl(page.url);

  const crumbs = [{ name: "Docs", url: absoluteUrl("/docs") }];
  const provider = PROVIDERS.find((id) => id === page.slugs[0]);
  if (provider) {
    crumbs.push({
      name: PROVIDER_META[provider].name,
      url: absoluteUrl(`/docs/${provider}/components`),
    });
  }
  if (page.url !== "/docs") {
    crumbs.push({ name: title, url });
  }

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "TechArticle",
        headline: title,
        description,
        url,
        mainEntityOfPage: url,
        image: absoluteUrl(image ?? "/og/og-image.png"),
        inLanguage: "en",
        author: {
          "@type": "Person",
          name: "Gurbinder",
          url: "https://x.com/legionsdev",
        },
        publisher: { "@id": `${SITE_URL}/#organization` },
        isPartOf: { "@id": `${SITE_URL}/#website` },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: crumbs.map((crumb, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: crumb.name,
          item: crumb.url,
        })),
      },
    ],
  };
}

export default async function Page(props: { params: Promise<{ slug: string[] }> }) {
  const params = await props.params;
  const page = source.getPage(params.slug);

  if (!page) {
    notFound();
  }

  const doc = page.data;
  const MDX = doc.body;
  const links = doc.links;
  const neighbours = findNeighbour(source.pageTree, page.url);

  const raw = await page.data.getText("raw");

  // Getting MDX with components replaced code for LLMs friendly :3
  const mdx = processMdxForLLMs(raw);

  return (
    <div className="relative mt-10 flex sm:mt-0">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildDocsJsonLd(page)) }}
      />
      <div className="docs-container flex flex-col py-12 pb-32">
        <div className="flex flex-row items-start gap-4">
          <div className="flex flex-1 flex-col gap-1">
            <h1 className="scroll-m-20 text-3xl font-semibold tracking-tight xl:text-4xl">
              {doc.title}
            </h1>
            <blockquote className="sr-only">
              <h2>Documentation Index</h2>
              <p>
                Fetch the complete documentation index at: <a href="/llms.txt">/llms.txt</a>.
                Use this file to discover all available pages before exploring further.
              </p>
            </blockquote>
            {doc.description && (
              <p className="text-muted-foreground text-[15px]">{doc.description}</p>
            )}
            {links && (
              <div className="mt-3 flex flex-row gap-3 select-none">
                {Object.entries(links).map(([key, value]) => (
                  <a
                    className="text-muted-foreground bg-muted/50 hover:text-primary flex flex-row items-center gap-2 rounded-md px-2 py-0.5 text-[11px] capitalize"
                    href={value}
                    target="_blank"
                    key={key}
                  >
                    <LinkIcon className="size-2.5" />
                    {key}
                  </a>
                ))}
              </div>
            )}
          </div>
          <div>{raw && <DocsCopyPage mdx={mdx} url={absoluteUrl(page.url)} path={page.url} />}</div>
        </div>
        <div className="text-primary/80 mt-8 w-full flex-1 text-[14px] *:data-[slot=alert]:first:mt-0">
          <MDX components={mdxComponents} />
        </div>
        <div className="mt-40 flex flex-col gap-8">
          <div className="flex flex-row items-center justify-between">
            <FeedbackButtons />
          </div>
          <div className="grid grid-cols-2 gap-4 sm:gap-8">
            <div>
              {neighbours.previous ? (
                <MDXNavigation
                  $id={neighbours.previous.$id}
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
                  $id={neighbours.next.$id}
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
