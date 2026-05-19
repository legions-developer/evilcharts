import type { Metadata } from "next";

import { StarHistoryTool } from "./_components/star-history-tool";

export const metadata: Metadata = {
  title: "GitHub Star History",
  description:
    "Generate an animated SVG chart of GitHub star history for any repository — compare repos, customize colors, and embed it anywhere.",
  alternates: { canonical: "/tools/star-history" },
};

export default function StarHistoryPage() {
  return (
    <div className="relative mt-10 sm:mt-0">
      <div className="mx-auto w-full max-w-4xl px-4 py-12 pb-32 sm:px-8">
        <StarHistoryTool />
      </div>
    </div>
  );
}
