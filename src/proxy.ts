import {
  NextResponse,
  type NextFetchEvent,
  type NextRequest,
} from "next/server";

import { AXIOM_DATASET, axiom } from "@/lib/axiom";

export function proxy(request: NextRequest, event: NextFetchEvent) {
  const accept = request.headers.get("accept")?.toLowerCase() ?? "";
  const pathname = request.nextUrl.pathname;

  if (pathname.startsWith("/r/") && pathname.endsWith(".json")) {
    if (axiom) {
      axiom.ingest(AXIOM_DATASET, [
        {
          event: "registry_install",
          component: pathname.slice("/r/".length, -".json".length),
          userAgent: request.headers.get("user-agent"),
          country: request.headers.get("x-vercel-ip-country"),
          referer: request.headers.get("referer"),
        },
      ]);
      event.waitUntil(axiom.flush());
    }
    return NextResponse.next();
  }

  if (!accept.includes("text/markdown") || pathname.endsWith(".md")) {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  const slug = pathname.replace(/^\/docs\/?/, "");
  url.pathname = slug ? `/llm/${slug}` : "/llm";

  return NextResponse.rewrite(url);
}

export const config = {
  matcher: ["/docs/:path*", "/r/:path*"],
};
