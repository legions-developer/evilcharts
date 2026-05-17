import type { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Evil Charts",
  description:
    "A collection of beautifully designed, customizable chart components for React.",
};

export default function Home() {
  return (
    <div className="flex h-screen w-full items-center justify-center">
      <div className="flex flex-row gap-8">
        <Image src="/web/logo.svg" alt="EvilCharts" width={50} height={50} />
        <Image src="/web/logo-wordmark.svg" alt="EvilCharts" width={300} height={300} />
      </div>
    </div>
  );
}
