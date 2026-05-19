import type { Metadata } from "next";

import { NpmDownloadsTool } from "./_components/npm-downloads-tool";

export const metadata: Metadata = {
  title: "Npm Download Trends",
  description:
    "Generate an animated SVG chart of npm package download trends — compare packages, switch between daily, weekly and cumulative metrics, customize the style, and embed it anywhere.",
  alternates: { canonical: "/tools/npm-downloads" },
};

export default function NpmDownloadsPage() {
  return (
    <div className="relative mt-10 sm:mt-0">
      <div className="mx-auto w-full max-w-4xl px-4 py-12 pb-32 sm:px-8">
        <NpmDownloadsTool />
      </div>
    </div>
  );
}
