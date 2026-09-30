import { copyFile, mkdir, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";

import { SITE_REDIRECTS } from "../globals/constants/site-redirects";

const output = path.resolve("out");
const markdownRoot = path.join(output, "llm");
let count = 0;

async function copyMarkdown(directory: string) {
  const entries = await readdir(directory, { withFileTypes: true });
  for (const entry of entries) {
    const source = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      await copyMarkdown(source);
    } else if (entry.name.endsWith(".md")) {
      const relative = path.relative(markdownRoot, source);
      const target =
        relative === "index.md"
          ? path.join(output, "docs.md")
          : path.join(output, "docs", relative);
      await mkdir(path.dirname(target), { recursive: true });
      await copyFile(source, target);
      count++;
    }
  }
}

await copyMarkdown(markdownRoot);
if (count === 0) throw new Error("No markdown documents were exported.");
// Legacy /llm URLs are served by the Worker from their public /docs/**.md files.
await rm(markdownRoot, { recursive: true });

const redirects = SITE_REDIRECTS.flatMap((rule) =>
  rule.source.includes("*") ? [rule] : [rule, { ...rule, source: `${rule.source}/` }],
).sort((a, b) => Number(a.source.includes("*")) - Number(b.source.includes("*")));

await writeFile(
  path.join(output, "_redirects"),
  redirects
    .map(({ source, destination, status }) => `${source} ${destination} ${status}`)
    .join("\n") + "\n",
);

await writeFile(
  path.join(output, "_headers"),
  [
    "/_next/static/*",
    "  Cache-Control: public, max-age=31536000, immutable",
    "/docs.md",
    "  Content-Type: text/markdown; charset=utf-8",
    "/docs/*.md",
    "  Content-Type: text/markdown; charset=utf-8",
    "/llms.txt",
    "  Content-Type: text/markdown; charset=utf-8",
    "/llms-full.txt",
    "  Content-Type: text/markdown; charset=utf-8",
    "/skill.md",
    "  Content-Type: text/markdown; charset=utf-8",
    "/.well-known/skills/evilcharts/skill.md",
    "  Content-Type: text/markdown; charset=utf-8",
    "/.well-known/agent-skills/evilcharts/SKILL.md",
    "  Content-Type: text/markdown; charset=utf-8",
    "/mcp",
    "  Content-Type: application/json; charset=utf-8",
    "",
  ].join("\n"),
);

console.log(`Exported ${count} markdown documents and ${redirects.length} Cloudflare redirects.`);
