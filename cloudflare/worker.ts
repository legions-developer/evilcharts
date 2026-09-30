import { Axiom } from "@axiomhq/js";

import { handleMcpPost, type AgentDocIndex } from "../src/lib/mcp";

export type WorkerEnv = {
  ASSETS: { fetch(request: Request): Promise<Response> };
  AXIOM_TOKEN?: string;
  AXIOM_DATASET?: string;
};

type WorkerContext = { waitUntil(promise: Promise<unknown>): void };

function assetRequest(request: Request, pathname: string) {
  const url = new URL(request.url);
  url.pathname = pathname;
  return new Request(url, {
    method: request.method === "HEAD" ? "HEAD" : "GET",
    redirect: "manual",
  });
}

function track(
  env: WorkerEnv,
  ctx: WorkerContext,
  request: Request,
  event: Record<string, unknown>,
) {
  const { AXIOM_TOKEN, AXIOM_DATASET } = env;
  if (!AXIOM_TOKEN || !AXIOM_DATASET) return;
  ctx.waitUntil(
    (async () => {
      try {
        const axiom = new Axiom({ token: AXIOM_TOKEN });
        axiom.ingest(AXIOM_DATASET, [
          {
            ...event,
            userAgent: request.headers.get("user-agent"),
            country: request.headers.get("cf-ipcountry"),
            referer: request.headers.get("referer"),
          },
        ]);
        await axiom.flush();
      } catch {
        // Optional telemetry must never prevent an install or docs response.
        console.error("Axiom tracking failed.");
      }
    })(),
  );
}

function markdownResponse(response: Response) {
  if (!response.ok) return response;
  const headers = new Headers(response.headers);
  headers.set("Content-Type", "text/markdown; charset=utf-8");
  return new Response(response.body, { status: response.status, headers });
}

const worker = {
  async fetch(request: Request, env: WorkerEnv, ctx: WorkerContext): Promise<Response> {
    const url = new URL(request.url);
    const pathname = url.pathname.replace(/\/$/, "") || "/";

    if (pathname === "/mcp") {
      if (request.method === "POST") {
        return handleMcpPost(request, {
          async getIndex() {
            const response = await env.ASSETS.fetch(assetRequest(request, "/agent-docs.json"));
            if (!response.ok) throw new Error("Missing documentation index.");
            return response.json() as Promise<AgentDocIndex>;
          },
          async readMarkdown(path) {
            const response = await env.ASSETS.fetch(assetRequest(request, path));
            if (!response.ok) throw new Error("Missing markdown document.");
            return response.text();
          },
        });
      }
      if (request.method !== "GET" && request.method !== "HEAD") {
        return new Response(null, { status: 405, headers: { Allow: "GET, HEAD, POST" } });
      }
      const response = await env.ASSETS.fetch(assetRequest(request, "/mcp"));
      const headers = new Headers(response.headers);
      headers.set("Content-Type", "application/json; charset=utf-8");
      return new Response(response.body, { status: response.status, headers });
    }

    if (request.method !== "GET" && request.method !== "HEAD") return env.ASSETS.fetch(request);

    // Retain the former markdown handler URLs for clients with existing links.
    if (pathname === "/llm" || pathname.startsWith("/llm/")) {
      const slug = pathname.slice("/llm".length).replace(/\.md$/, "");
      const markdownPath = !slug || slug === "/index" ? "/docs.md" : `/docs${slug}.md`;
      return markdownResponse(await env.ASSETS.fetch(assetRequest(request, markdownPath)));
    }

    if (pathname === "/docs" || pathname.startsWith("/docs/")) {
      const accept = request.headers.get("accept")?.toLowerCase() ?? "";
      const wantsMarkdown = accept.split(",").some((part) => {
        const [type, ...parameters] = part.trim().split(";");
        return (
          type === "text/markdown" &&
          !parameters.some((param) => /^\s*q=0(?:\.0*)?\s*$/.test(param))
        );
      });
      // Apply legacy redirects before negotiating the representation, as Next
      // did before its proxy. A validator for cached HTML must not validate the
      // markdown representation, so omit conditional headers for that lookup.
      const negotiate = wantsMarkdown && !pathname.endsWith(".md");
      const original = await env.ASSETS.fetch(
        negotiate ? assetRequest(request, url.pathname) : request,
      );
      if ([301, 302, 303, 307, 308].includes(original.status)) return original;
      if (negotiate) {
        await original.body?.cancel();
        const response = markdownResponse(
          await env.ASSETS.fetch(
            assetRequest(request, pathname === "/docs" ? "/docs.md" : `${pathname}.md`),
          ),
        );
        if (response.ok) {
          track(env, ctx, request, {
            event: "docs_markdown_fetch",
            slug: pathname.slice("/docs/".length) || "index",
          });
        }
        const headers = new Headers(response.headers);
        headers.append("Vary", "Accept");
        // The HTML and markdown representations share a URL. Avoid storing the
        // negotiated response under a URL-only cache key.
        headers.set("Cache-Control", "private, no-store");
        return new Response(response.body, { status: response.status, headers });
      }
      const response = original;
      if (pathname.endsWith(".md")) return markdownResponse(response);
      const headers = new Headers(response.headers);
      headers.append("Vary", "Accept");
      return new Response(response.body, { status: response.status, headers });
    }

    if (pathname.startsWith("/r/") && pathname.endsWith(".json")) {
      const response = await env.ASSETS.fetch(request);
      if (response.ok) {
        track(env, ctx, request, {
          event: "registry_install",
          component: pathname.slice("/r/".length, -".json".length),
        });
      }
      return response;
    }

    return env.ASSETS.fetch(request);
  },
};

export default worker;
