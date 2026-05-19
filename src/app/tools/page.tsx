import { redirect } from "next/navigation";

/** No tools index yet — send a bare /tools visit straight to the only tool. */
export default function ToolsPage() {
  redirect("/tools/star-history");
}
