import { SITE_DESCRIPTION, SITE_TITLE } from "@/globals/constants/site";
import { ChartStage } from "@/components/landing/chart-stage";
import { ArrowRight02Icon } from "@hugeicons/core-free-icons";
import EvilChartWordmark from "@/assets/logos/evilchart";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@/components/ui/button";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
};

// ISR: the page is served from cache and re-rendered (with a fresh star
// count) at most once an hour.
export const revalidate = 3600;

const GITHUB_URL = "https://github.com/legions-developer/evilcharts";

async function getGithubStars(): Promise<number | null> {
  try {
    const res = await fetch("https://api.github.com/repos/legions-developer/evilcharts", {
      next: { revalidate: 3600 },
      headers: { Accept: "application/vnd.github+json" },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { stargazers_count?: number };
    return typeof data.stargazers_count === "number" ? data.stargazers_count : null;
  } catch {
    return null;
  }
}

const formatStars = (count: number) =>
  count >= 1000 ? `${(count / 1000).toFixed(1).replace(/\.0$/, "")}k` : String(count);

function GithubIcon() {
  return (
    <svg className="size-3.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.55 0-.27-.01-1.17-.02-2.12-3.2.7-3.87-1.36-3.87-1.36-.52-1.33-1.28-1.68-1.28-1.68-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.19 1.76 1.19 1.03 1.76 2.69 1.25 3.35.96.1-.75.4-1.25.72-1.54-2.55-.29-5.23-1.28-5.23-5.68 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11.1 11.1 0 0 1 2.89-.39c.98 0 1.97.13 2.89.39 2.2-1.49 3.16-1.18 3.16-1.18.63 1.59.24 2.76.12 3.05.74.81 1.19 1.83 1.19 3.09 0 4.41-2.69 5.38-5.25 5.67.41.35.78 1.05.78 2.12 0 1.54-.01 2.77-.01 3.15 0 .3.2.67.8.55A11.51 11.51 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z" />
    </svg>
  );
}

export default async function Home() {
  const stars = await getGithubStars();

  return (
    <main className="bg-background relative flex min-h-dvh flex-col overflow-hidden lg:h-dvh">
      <section className="relative z-10 flex flex-col justify-center px-6 pt-20 pb-10 sm:px-12 lg:h-full lg:w-[44%] lg:min-w-105 lg:items-center lg:px-12 lg:pt-0 lg:pb-0">
        <div className="flex w-full max-w-md flex-col gap-7">
          <h1>
            <EvilChartWordmark className="text-foreground h-9 w-auto" />
            <span className="sr-only">EvilCharts</span>
          </h1>
          <p className="text-muted-foreground text-base text-[15px]">
            Animated, interactive chart components for React. Built on Recharts and Apache ECharts,
            styled for shadcn/ui — copy, paste, and ship beautiful charts.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Button nativeButton={false} render={<Link href="/docs" />}>
              Browse Charts <HugeiconsIcon icon={ArrowRight02Icon} />
            </Button>
            <Button
              variant="outline"
              nativeButton={false}
              render={<a href={GITHUB_URL} target="_blank" rel="noreferrer" />}
            >
              <GithubIcon />
              Star on GitHub
              {stars !== null && (
                <span className="text-muted-foreground border-l pl-1.5 font-mono text-xs tabular-nums">
                  {formatStars(stars)}
                </span>
              )}
            </Button>
          </div>
        </div>
      </section>
      <div className="relative h-[56dvh] w-full lg:absolute lg:inset-y-0 lg:right-0 lg:h-auto lg:w-[60%]">
        <ChartStage className="absolute inset-0" />
        <div
          aria-hidden
          className="easing-gradient from-background pointer-events-none absolute inset-x-0 top-0 h-24 bg-linear-to-b lg:hidden"
        />
        <div
          aria-hidden
          className="easing-gradient from-background pointer-events-none absolute inset-y-0 left-0 hidden w-1/5 bg-linear-to-r lg:block"
        />
      </div>
    </main>
  );
}
