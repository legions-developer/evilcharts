import {
  DEFAULT_PROVIDER,
  PROVIDERS,
  PROVIDER_META,
  type Provider,
} from "@/globals/constants/providers";
import { processMdxForLLMs } from "@/lib/llm";
import { absoluteUrl } from "@/lib/utils";
import { source } from "@/lib/source";

// Pages that belong to no provider: the intro, and the config contract both engines share.
const SHARED_DOCS = new Set(["/docs", "/docs/chart-config"]);

// Agent surfaces advertise only what can actually be installed today. A provider whose
// docs are still a placeholder is omitted entirely — listing it would invite agents to
// recommend components that don't exist yet. Flipping `available` in PROVIDER_META is
// all it takes to publish one.
const AVAILABLE_PROVIDERS = PROVIDERS.filter((id) => PROVIDER_META[id].available);

// The provider skill.md points agents at for setup and examples. Deliberately not
// DEFAULT_PROVIDER — that one drives which engine the docs UI leads with, which may be an
// engine that hasn't shipped yet. Citing it here would contradict the constraint below.
const AGENT_PROVIDER = AVAILABLE_PROVIDERS[0] ?? DEFAULT_PROVIDER;

type Page = ReturnType<typeof source.getPages>[number];

// Neither provider has a landing page — /docs/<provider> only ever redirects to that
// engine's components overview — so everything real sits beneath the prefix.
function isProviderPage(url: string, provider: Provider) {
  return url.startsWith(`/docs/${provider}/`);
}

// Derived rather than enumerated: an added chart or provider shows up on its own.
// The old hardcoded path lists failed silently — a missed entry dropped the page from
// llms.txt and MCP with nothing to notice it.
function providerPages(pages: Page[], provider: Provider) {
  const prefix = `/docs/${provider}/`;
  const inProvider = pages.filter((page) => isProviderPage(page.url, provider));

  return {
    guides: inProvider.filter((page) =>
      [`${prefix}installation`, `${prefix}components`].includes(page.url),
    ),
    charts: inProvider.filter((page) => /\/[a-z]+-chart\//.test(page.url)),
    ui: inProvider.filter((page) => page.url.startsWith(`${prefix}ui/`)),
  };
}

function getMarkdownUrl(pageUrl: string) {
  return pageUrl === "/docs" ? "/docs.md" : `${pageUrl}.md`;
}

function getPageSummary(page: ReturnType<typeof source.getPages>[number]) {
  return {
    title: page.data.title,
    description: page.data.description,
    url: page.url,
    markdownUrl: getMarkdownUrl(page.url),
  };
}

function renderLinks(pages: ReturnType<typeof source.getPages>) {
  return pages
    .map((page) => {
      const summary = getPageSummary(page);
      const description = summary.description ? ` - ${summary.description}` : "";
      return `- [${summary.title}](${summary.markdownUrl})${description}`;
    })
    .join("\n");
}

/**
 * Pages exposed to agents: everything shared, plus every shippable provider's docs.
 * Placeholder providers are filtered out here, so llms-full.txt and the MCP server
 * inherit the same guarantee without repeating the rule.
 */
export function getAgentDocPages() {
  return source.getPages().filter((page) => {
    if (SHARED_DOCS.has(page.url)) return true;

    return AVAILABLE_PROVIDERS.some((id) => isProviderPage(page.url, id));
  });
}

export function generateLlmsTxt() {
  const pages = getAgentDocPages();
  const startHere = pages.filter((page) => SHARED_DOCS.has(page.url));

  const providerSections = AVAILABLE_PROVIDERS.map((id) => {
    const meta = PROVIDER_META[id];
    const { guides, charts, ui } = providerPages(pages, id);

    return `## ${meta.name}

> ${meta.tagline}. Install with \`npx shadcn@latest add @evilcharts/{component}\`.

### Setup
${renderLinks(guides)}

### Chart Components
${renderLinks(charts)}

### UI Components
${renderLinks(ui)}`;
  }).join("\n\n");

  return `# EvilCharts Documentation

> EvilCharts is an open-source chart UI website built with shadcn and Recharts, beautifully designed and handcrafted.

## Start Here
${renderLinks(startHere)}

${providerSections}

## Agent Resources
- [Full documentation snapshot](/llms-full.txt)
- [Agent skill](/skill.md)
- [MCP server](/mcp)
`;
}

export async function generateLlmsFullTxt() {
  const pages = getAgentDocPages();
  const sections = await Promise.all(
    pages.map(async (page) => {
      const raw = await page.data.getText("raw");
      const content = processMdxForLLMs(raw).trim();
      const summary = getPageSummary(page);
      const description = summary.description ? `\n\n> ${summary.description}` : "";

      return `## ${summary.title}${description}

Source: ${absoluteUrl(summary.url)}
Markdown: ${absoluteUrl(summary.markdownUrl)}

${content}`;
    }),
  );

  return `# EvilCharts Full Documentation

> Full markdown snapshot of the EvilCharts documentation generated from the same MDX source as evilcharts.com.

${sections.join("\n\n---\n\n")}
`;
}

export function generateSkillMd() {
  return `---
name: evilcharts
description: Add and customize EvilCharts chart components in shadcn/ui and Recharts projects.
license: MIT
compatibility: Requires a React/Next.js project with shadcn/ui and Recharts.
metadata:
  source: ${absoluteUrl("/llms.txt")}
---

# EvilCharts

Use this skill when a user wants to install, add, customize, or debug EvilCharts chart components.

## Workflow

1. Read \`/llms.txt\` to find the relevant documentation page.
2. For setup, follow \`/docs/${AGENT_PROVIDER}/installation.md\`.
3. For chart usage, read the matching chart page such as \`/docs/${AGENT_PROVIDER}/bar-chart/static.md\`.
4. For shared options, read \`/docs/chart-config.md\`, \`/docs/${AGENT_PROVIDER}/ui/tooltip.md\`, \`/docs/${AGENT_PROVIDER}/ui/legend.md\`, and \`/docs/${AGENT_PROVIDER}/ui/background.md\`.
5. Add components with the shadcn CLI pattern documented by EvilCharts: \`npx shadcn@latest add @evilcharts/{chart-name}\`.

## Constraints

- Do not assume EvilCharts is a separate charting runtime library.
- Treat Recharts as the underlying chart dependency.
- Docs are grouped by rendering engine under \`/docs/{provider}/\`. Only ${AVAILABLE_PROVIDERS.map(
    (id) => PROVIDER_META[id].name,
  ).join(
    " and ",
  )} ${AVAILABLE_PROVIDERS.length === 1 ? "is" : "are"} installable — never suggest components from a provider that is not listed in \`/llms.txt\`.
- \`chartConfig\` is the one contract shared across engines; see \`/docs/chart-config.md\`.
- Preserve the user's existing shadcn/ui and Tailwind setup.
`;
}

export function getAgentSkillsIndex() {
  return {
    $schema: "https://schemas.agentskills.io/discovery/0.2.0/schema.json",
    skills: [
      {
        name: "evilcharts",
        type: "skill-md",
        description:
          "Add and customize EvilCharts chart components in shadcn/ui and Recharts projects.",
        url: "/.well-known/agent-skills/evilcharts/SKILL.md",
      },
    ],
  };
}
