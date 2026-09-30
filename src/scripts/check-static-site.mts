import { readFile } from "node:fs/promises";
import assert from "node:assert/strict";

import { PROVIDERS, PROVIDER_META } from "../globals/constants/providers";
import { SITE_REDIRECTS } from "../globals/constants/site-redirects";
import type { AgentDocIndex } from "../lib/mcp";

const origin = process.argv[2] ?? "http://localhost:8787";
let checks = 0;

async function get(path: string, init?: RequestInit) {
  return fetch(new URL(path, origin), { redirect: "manual", ...init });
}

async function expectOk(path: string, contentType: string) {
  const response = await get(path);
  assert.equal(response.status, 200, path);
  assert.ok(response.headers.get("Content-Type")?.includes(contentType), `${path} content type`);
  assert.ok((await response.text()).length > 0, `${path} body`);
  checks++;
}

await Promise.all([
  expectOk("/", "text/html"),
  expectOk("/docs", "text/html"),
  expectOk("/docs.md", "text/markdown"),
  expectOk("/llms.txt", "text/markdown"),
  expectOk("/llms-full.txt", "text/markdown"),
  expectOk("/skill.md", "text/markdown"),
  expectOk("/sitemap.xml", "xml"),
  expectOk("/robots.txt", "text/plain"),
  expectOk("/.well-known/skills/index.json", "application/json"),
  expectOk("/.well-known/skills/evilcharts/skill.md", "text/markdown"),
  expectOk("/.well-known/agent-skills/index.json", "application/json"),
  expectOk("/.well-known/agent-skills/evilcharts/SKILL.md", "text/markdown"),
  expectOk("/mcp", "application/json"),
]);

const indexResponse = await get("/agent-docs.json");
assert.equal(indexResponse.status, 200);
const index = (await indexResponse.json()) as AgentDocIndex;
assert.ok(index.pages.length > 0);
for (const provider of PROVIDERS.filter((id) => !PROVIDER_META[id].available)) {
  assert.ok(index.pages.every((page) => !page.url.startsWith(`/docs/${provider}/`)));
  checks++;
}

for (const page of index.pages) {
  await expectOk(page.url, "text/html");
  const markdown = await get(page.markdownUrl);
  assert.equal(markdown.status, 200, page.markdownUrl);
  assert.ok(markdown.headers.get("Content-Type")?.includes("text/markdown"));
  const content = await markdown.text();
  assert.ok(content.length > 0);
  assert.ok(
    !/<Component(?:Preview|Source)\b/.test(content),
    `${page.markdownUrl} embeds registry source`,
  );
  const negotiated = await get(page.url, { headers: { Accept: "text/markdown" } });
  assert.equal(negotiated.status, 200);
  assert.match(negotiated.headers.get("Vary") ?? "", /Accept/i);
  assert.equal(await negotiated.text(), content, `${page.url} negotiated markdown`);
  // An HTML request after markdown must still receive HTML at the same URL.
  await expectOk(page.url, "text/html");
  checks += 2;
}

// Verify markdown for all exported docs, including directly accessible providers
// that are intentionally excluded from the published agent index.
const sitemap = await (await get("/sitemap.xml")).text();
const docsUrls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)]
  .map((match) => new URL(match[1]).pathname)
  .filter((path) => path === "/docs" || path.startsWith("/docs/"));
for (const path of docsUrls) {
  await expectOk(path === "/docs" ? "/docs.md" : `${path}.md`, "text/markdown");
}

for (const redirect of SITE_REDIRECTS) {
  const path = redirect.source.replace("*", "static");
  const destination = redirect.destination.replace(":splat", "static");
  for (const accept of ["text/html", "text/markdown"]) {
    const response = await get(path, { headers: { Accept: accept } });
    assert.equal(response.status, redirect.status, `${path} redirect (${accept})`);
    assert.equal(new URL(response.headers.get("Location")!, origin).pathname, destination);
    checks++;
  }
  if (!redirect.source.includes("*")) {
    const response = await get(`${redirect.source}/`);
    assert.equal(response.status, redirect.status, `${redirect.source}/ redirect`);
    assert.equal(new URL(response.headers.get("Location")!, origin).pathname, destination);
    checks++;
  }
}

const registry = JSON.parse(await readFile("registry.json", "utf8")) as {
  items: { name: string }[];
};
for (const item of registry.items) {
  const response = await get(`/r/${item.name}.json`);
  assert.equal(response.status, 200, item.name);
  assert.equal((await response.json()).name, item.name);
  checks++;
}

for (const path of [
  "/missing-page",
  "/docs/missing-page",
  "/docs/missing-page.md",
  "/r/missing.json",
]) {
  assert.equal((await get(path)).status, 404, path);
  checks++;
}
await expectOk("/llm", "text/markdown");
await expectOk("/llm/recharts/bar-chart/static", "text/markdown");

const qZero = await get("/docs", { headers: { Accept: "text/html, text/markdown;q=0" } });
assert.ok(qZero.headers.get("Content-Type")?.includes("text/html"));
const etag = qZero.headers.get("ETag");
if (etag) {
  const conditionalMarkdown = await get("/docs", {
    headers: { Accept: "text/markdown", "If-None-Match": etag },
  });
  assert.equal(conditionalMarkdown.status, 200, "An HTML ETag must not validate markdown");
  assert.ok(conditionalMarkdown.headers.get("Content-Type")?.includes("text/markdown"));
  checks++;
}
const markdownHead = await get("/docs", { method: "HEAD", headers: { Accept: "text/markdown" } });
assert.equal(markdownHead.status, 200);
assert.ok(markdownHead.headers.get("Content-Type")?.includes("text/markdown"));
assert.equal(await markdownHead.text(), "");
checks += 2;

async function rpc(method: string, params?: Record<string, unknown>, id: number | null = 1) {
  return get("/mcp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id, method, params }),
  });
}

const initialize = await rpc("initialize");
assert.equal(initialize.status, 200);
assert.equal((await initialize.json()).result.serverInfo.name, "evilcharts-docs");
const tools = await rpc("tools/list");
assert.deepEqual(
  (await tools.json()).result.tools.map((tool: { name: string }) => tool.name),
  ["search_docs", "read_doc"],
);
const search = await rpc("tools/call", { name: "search_docs", arguments: { query: "bar chart" } });
assert.equal(search.status, 200);
const results = JSON.parse((await search.json()).result.content[0].text) as { url: string }[];
assert.ok(results.length > 0);
assert.ok(
  results.every((result) =>
    index.pages.some((page) => `${index.siteUrl}${page.url}` === result.url),
  ),
);
const read = await rpc("tools/call", {
  name: "read_doc",
  arguments: { path: "/docs/recharts/bar-chart/static.md" },
});
assert.equal(read.status, 200);
assert.match(
  (await read.json()).result.content[0].text,
  /Source: .*\/docs\/recharts\/bar-chart\/static/,
);
const missing = await rpc("tools/call", { name: "read_doc", arguments: { path: "/docs/missing" } });
assert.equal((await missing.json()).result.isError, true);
const wrongArgs = await rpc("tools/call", { name: "search_docs", arguments: { query: 42 } });
assert.equal((await wrongArgs.json()).error.code, -32602);
const unknown = await rpc("unknown-method");
assert.equal((await unknown.json()).error.code, -32601);
assert.equal((await rpc("notifications/initialized", undefined, null)).status, 202);
const malformed = await get("/mcp", { method: "POST", body: "{" });
assert.equal((await malformed.json()).error.code, -32700);
const invalid = await get("/mcp", { method: "POST", body: "[]" });
assert.equal((await invalid.json()).error.code, -32600);
assert.equal((await get("/mcp", { method: "DELETE" })).status, 405);
checks += 11;

console.log(`Passed ${checks} static-site and Worker checks against ${origin}.`);
