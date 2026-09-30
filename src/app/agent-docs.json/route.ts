import { getAgentDocPages } from "@/lib/agent-docs";
import type { AgentDocIndex } from "@/lib/mcp";
import { processMdxForLLMs } from "@/lib/llm";
import { SITE_URL } from "@/lib/utils";

export const dynamic = "force-static";
export const revalidate = false;

export async function GET() {
  const pages = await Promise.all(
    getAgentDocPages().map(async (page) => {
      const markdown = processMdxForLLMs(await page.data.getText("raw"));
      return {
        title: page.data.title,
        description: page.data.description,
        url: page.url,
        markdownUrl: page.url === "/docs" ? "/docs.md" : `${page.url}.md`,
        searchText: [page.data.title, page.data.description, markdown].join(" ").toLowerCase(),
        snippet: markdown.replace(/\s+/g, " ").slice(0, 240),
      };
    }),
  );
  return Response.json({ siteUrl: SITE_URL, pages } satisfies AgentDocIndex);
}
