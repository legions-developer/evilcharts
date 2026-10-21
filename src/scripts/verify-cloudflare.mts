import { readFile, readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";

// Run after build:cloudflare and preview:cloudflare; an explicit staging URL also works.
// Requests stay on this origin and never follow redirects to production services.
const base = new URL(process.argv[2] ?? "http://localhost:8787");
assert(["http:", "https:"].includes(base.protocol), "Expected an HTTP(S) base URL");
const root = new URL("../../", import.meta.url);
let requests = 0;

async function response(path: string, accept = "*/*") {
  const result = await fetch(new URL(path, base), {
    headers: { Accept: accept },
    redirect: "manual",
    signal: AbortSignal.timeout(30_000),
  });
  requests += 1;
  return result;
}

async function content(path: string, type: string, accept = "*/*") {
  const result = await response(path, accept);
  assert.equal(result.status, 200, `${path} (${accept}): HTTP ${result.status}`);
  assert(result.headers.get("content-type")?.includes(type), `${path}: expected ${type}`);
  const body = await result.text();
  assert(body.length > 20, `${path}: empty response`);
  return body;
}

async function batches<T>(items: T[], check: (item: T) => Promise<void>) {
  for (let i = 0; i < items.length; i += 4) {
    await Promise.all(items.slice(i, i + 4).map(check));
  }
}

for (const path of ["/", "/docs"]) {
  assert.match(await content(path, "text/html", "text/html"), /EvilCharts/i);
}

const docs = (await readdir(new URL("src/content/docs/", root), { recursive: true }))
  .filter((path) => path.endsWith(".mdx"))
  .map((path) =>
    `/docs/${path.replace(/\\/g, "/").replace(/(?:\/)?index\.mdx$|\.mdx$/g, "")}`.replace(
      /\/$/,
      "",
    ),
  );

await batches(docs, async (path) => {
  const markdown = await content(`${path}.md`, "text/markdown");
  assert(!markdown.includes("<ComponentSource"), `${path}: unresolved component source`);
  assert(!markdown.includes("<ComponentPreview"), `${path}: unresolved component preview`);
});
console.log(`Verified ${docs.length} documentation markdown routes.`);

for (const [provider, sourceMarker] of [
  ["recharts", "EvilExampleAreaChart"],
  ["echarts", "EChartsExampleAreaChart"],
]) {
  const path = `/docs/${provider}/area-chart/static`;
  const direct = await content(`${path}.md`, "text/markdown");
  assert(direct.includes(sourceMarker), `${path}: example source missing from markdown`);
  assert(!direct.includes("@/registry/"), `${path}: repository-only import path in chart source`);
  // Alternate representations on the same URL to catch cache-key collisions.
  assert.equal(await content(path, "text/markdown", "text/markdown"), direct);
  const html = await content(path, "text/html", "text/html");
  assert(html.includes(sourceMarker), `${path}: example source missing from server response`);
  assert(!html.includes("Component not found"), `${path}: missing preview`);
  assert.equal(await content(path, "text/markdown", "text/markdown"), direct);
}

const skill = await content("/skill.md", "text/markdown");
assert.match(skill, /name: evilcharts/);
for (const path of [
  "/.well-known/skills/evilcharts/skill.md",
  "/.well-known/agent-skills/evilcharts/SKILL.md",
]) {
  assert.equal(await content(path, "text/markdown"), skill, `${path}: inconsistent skill`);
}
for (const path of ["/.well-known/skills/index.json", "/.well-known/agent-skills/index.json"]) {
  const index = JSON.parse(await content(path, "application/json"));
  assert(
    index.skills.some((entry: { name: string }) => entry.name === "evilcharts"),
    path,
  );
}
const llms = await content("/llms.txt", "text/markdown");
const full = await content("/llms-full.txt", "text/markdown");
assert.match(llms, /recharts\/area-chart\/static\.md/);
assert.match(full, /EvilExampleAreaChart/);
assert(full.length > llms.length, "Full documentation snapshot is incomplete");
const sitemap = await content("/sitemap.xml", "xml");
for (const path of docs)
  assert(sitemap.includes(`${path}</loc>`), `${path}: missing sitemap entry`);
assert.match(
  await content("/robots.txt", "text/plain"),
  /Sitemap: https:\/\/evilcharts\.com\/sitemap\.xml/,
);

const redirects: [string, number, string][] = [
  ["/docs/recharts", 307, "/docs/recharts/components"],
  ["/docs/echarts", 307, "/docs/echarts/components"],
  ["/docs/recharts/area-chart", 308, "/docs/recharts/area-chart/static"],
  ["/docs/echarts/sankey-chart", 308, "/docs/echarts/sankey-chart/static"],
  ["/docs/area-chart", 308, "/docs/recharts/area-chart/static"],
  ["/docs/bar-chart/blocks", 308, "/docs/recharts/bar-chart/blocks"],
  ["/docs/installation", 308, "/docs/recharts/installation"],
  ["/docs/components", 308, "/docs/recharts/components"],
  ["/docs/ui/tooltip", 308, "/docs/recharts/ui/tooltip"],
  ["/docs/area-charts", 308, "/docs/recharts/area-chart/static"],
  ["/docs/prerequisites", 308, "/docs/recharts/installation"],
];
await batches(redirects, async ([path, status, destination]) => {
  const result = await response(path, "text/html");
  assert.equal(result.status, status, `${path}: redirect status`);
  const location = result.headers.get("location");
  assert(location, `${path}: missing redirect location`);
  assert.equal(new URL(location, base).pathname, destination, `${path}: redirect destination`);
  await result.body?.cancel();
});
for (const path of [
  "/docs/nonexistent-migration-check",
  "/docs/nonexistent-migration-check.md",
  "/r/nonexistent-migration-check.json",
]) {
  const result = await response(path);
  assert.equal(result.status, 404, `${path}: expected a 404`);
  await result.body?.cancel();
}

type RegistryItem = {
  name: string;
  type: string;
  files?: { path: string; type: string; target?: string; content?: string }[];
};
const registry: { items: RegistryItem[] } = JSON.parse(
  await readFile(new URL("registry.json", root), "utf8"),
);
assert(registry.items.length > 0, "Registry manifest is empty; run build:cloudflare first");
await batches(registry.items, async (item) => {
  const path = `/r/${item.name}.json`;
  const actual: RegistryItem = JSON.parse(await content(path, "application/json"));
  const expected = JSON.parse(await readFile(new URL(`public${path}`, root), "utf8"));
  assert.deepEqual(actual, expected, `${path}: differs from built installable artifact`);
  assert.equal(actual.name, item.name, `${path}: name`);
  assert.equal(actual.type, item.type, `${path}: type`);
  assert(actual.files?.length, `${path}: missing installable files`);
  for (const file of actual.files) {
    assert(file.content?.trim(), `${path}: empty source for ${file.path}`);
    assert(file.type.startsWith("registry:"), `${path}: invalid file type`);
  }
});
console.log(
  `Verified ${registry.items.length} registry artifacts, including their source and dependencies.`,
);
console.log(`Passed ${requests} HTTP checks against ${base.origin} (${fileURLToPath(root)}).`);
