import { getMcpMetadata } from "@/lib/mcp";
import { SITE_URL } from "@/lib/utils";

export const dynamic = "force-static";
export const revalidate = false;

export function GET() {
  return Response.json(getMcpMetadata(SITE_URL));
}
