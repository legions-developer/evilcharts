// Web-standard MCP handlers shared by the static metadata route and Worker.
// This module must not import Next.js, MDX, registry source, or filesystem code.
export type AgentDoc = {
  title: string;
  description?: string;
  url: string;
  markdownUrl: string;
  searchText: string;
  snippet: string;
};

export type AgentDocIndex = {
  siteUrl: string;
  pages: AgentDoc[];
};

type JsonRpcRequest = {
  jsonrpc: "2.0";
  id?: string | number | null;
  method: string;
  params?: Record<string, unknown>;
};

type DocStore = {
  getIndex(): Promise<AgentDocIndex>;
  readMarkdown(path: string): Promise<string>;
};

export const MCP_TOOLS = [
  {
    name: "search_docs",
    description: "Search EvilCharts documentation pages by title, description, and content.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Search terms to match against the documentation." },
      },
      required: ["query"],
    },
  },
  {
    name: "read_doc",
    description: "Read one EvilCharts documentation page as markdown.",
    inputSchema: {
      type: "object",
      properties: {
        path: {
          type: "string",
          description: "Documentation path, for example /docs/recharts/bar-chart/static.",
        },
      },
      required: ["path"],
    },
  },
];

export function getMcpMetadata(siteUrl: string) {
  return {
    name: "evilcharts-docs",
    description: "MCP endpoint for searching and reading EvilCharts documentation.",
    protocolVersion: "2025-06-18",
    transport: "streamable-http",
    url: `${siteUrl}/mcp`,
    tools: MCP_TOOLS.map(({ name, description }) => ({ name, description })),
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function rpcResult(id: JsonRpcRequest["id"], result: unknown) {
  return Response.json({ jsonrpc: "2.0", id, result });
}

function rpcError(id: JsonRpcRequest["id"], code: number, message: string) {
  return Response.json(
    { jsonrpc: "2.0", id: id ?? null, error: { code, message } },
    { status: code === -32601 ? 404 : 400 },
  );
}

async function callTool(body: JsonRpcRequest, store: DocStore) {
  const name = body.params?.name;
  const args = body.params?.arguments;
  if (!isRecord(args)) return rpcError(body.id, -32602, "Expected tool arguments.");

  if (name !== "search_docs" && name !== "read_doc") {
    return rpcError(body.id, -32602, `Unknown tool: ${String(name ?? "missing")}`);
  }
  if (name === "search_docs" && typeof args.query !== "string") {
    return rpcError(body.id, -32602, "Expected a query string.");
  }
  if (name === "read_doc" && typeof args.path !== "string") {
    return rpcError(body.id, -32602, "Expected a documentation path.");
  }

  const index = await store.getIndex();
  if (name === "search_docs") {
    const terms = (args.query as string).toLowerCase().split(/\s+/).filter(Boolean);
    const results = index.pages
      .map((page) => ({
        page,
        score: terms.reduce((total, term) => total + Number(page.searchText.includes(term)), 0),
      }))
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
      .map(({ page }) => ({
        title: page.title,
        description: page.description,
        url: `${index.siteUrl}${page.url}`,
        markdownUrl: `${index.siteUrl}${page.markdownUrl}`,
        snippet: page.snippet,
      }));
    return rpcResult(body.id, {
      content: [{ type: "text", text: JSON.stringify(results, null, 2) }],
    });
  }

  const normalized = (args.path as string).replace(/\.md$/, "").replace(/\/$/, "") || "/docs";
  const path = normalized.startsWith("/docs")
    ? normalized
    : `/docs/${normalized.replace(/^\//, "")}`;
  const page = index.pages.find((doc) => doc.url === path);
  if (!page) {
    return rpcResult(body.id, {
      isError: true,
      content: [{ type: "text", text: `No documentation page found for path: ${args.path}` }],
    });
  }
  const markdown = await store.readMarkdown(page.markdownUrl);
  return rpcResult(body.id, {
    content: [
      {
        type: "text",
        text: `# ${page.title}\n\n${page.description ? `> ${page.description}\n\n` : ""}Source: ${index.siteUrl}${page.url}\n\n${markdown.trim()}`,
      },
    ],
  });
}

export async function handleMcpPost(request: Request, store: DocStore) {
  let value: unknown;
  try {
    value = await request.json();
  } catch {
    return rpcError(null, -32700, "Parse error.");
  }
  if (
    !isRecord(value) ||
    value.jsonrpc !== "2.0" ||
    typeof value.method !== "string" ||
    (value.params !== undefined && !isRecord(value.params)) ||
    (value.id !== undefined &&
      value.id !== null &&
      typeof value.id !== "string" &&
      typeof value.id !== "number")
  ) {
    return rpcError(null, -32600, "Invalid JSON-RPC request.");
  }

  const body = value as JsonRpcRequest;
  if (body.id === undefined || body.id === null) return new Response(null, { status: 202 });

  try {
    switch (body.method) {
      case "initialize":
        return rpcResult(body.id, {
          protocolVersion: "2025-06-18",
          capabilities: { tools: {} },
          serverInfo: { name: "evilcharts-docs", version: "1.0.0" },
        });
      case "tools/list":
        return rpcResult(body.id, { tools: MCP_TOOLS });
      case "tools/call":
        return await callTool(body, store);
      default:
        return rpcError(body.id, -32601, `Method not found: ${body.method}`);
    }
  } catch {
    return Response.json(
      {
        jsonrpc: "2.0",
        id: body.id,
        error: { code: -32603, message: "Documentation is unavailable." },
      },
      { status: 500 },
    );
  }
}
