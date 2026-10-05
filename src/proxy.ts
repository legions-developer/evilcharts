import { NextResponse, type NextFetchEvent, type NextRequest } from "next/server";

import { trackAxiomEvent } from "@/lib/axiom";

export function proxy(request: NextRequest, event: NextFetchEvent) {
  const accept = request.headers.get("accept")?.toLowerCase() ?? "";
  const pathname = request.nextUrl.pathname;
  const trackingContext = {
    userAgent: request.headers.get("user-agent"),
    country: request.headers.get("cf-ipcountry") ?? request.headers.get("x-vercel-ip-country"),
    referer: request.headers.get("referer"),
  };

  if (pathname.startsWith("/r/") && pathname.endsWith(".json")) {
    event.waitUntil(
      trackAxiomEvent({
        event: "registry_install",
        component: pathname.slice("/r/".length, -".json".length),
        ...trackingContext,
      }),
    );
    return NextResponse.next();
  }

  if (!accept.includes("text/markdown") || pathname.endsWith(".md")) {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  const slug = pathname.replace(/^\/docs\/?/, "");
  url.pathname = slug ? `/llm/${slug}` : "/llm";

  event.waitUntil(
    trackAxiomEvent({
      event: "docs_markdown_fetch",
      slug: slug || "index",
      ...trackingContext,
    }),
  );

  return NextResponse.rewrite(url);
}

export const config = {
  matcher: ["/docs/:path*", "/r/:path*"],
};
