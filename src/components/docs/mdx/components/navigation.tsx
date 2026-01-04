import { ChevronLeft, ChevronRight } from "lucide-react";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import Link from "next/link";
interface MDXNavigationProps {
  type: "previous" | "next";
  $id?: string;
  title: ReactNode;
  description: ReactNode;
  url: string;
}

// Map of title patterns to their transformations
const titleSuffixes: Record<string, string> = {
  Default: "",
  Blocks: " Blocks",
  "Animated Blocks": " Animated Blocks",
};

export const MDXNavigation = ({ type, $id, title, url, description }: MDXNavigationProps) => {
  // Extract page name from id (e.g., "root:pie-chart/default.mdx" -> "pie-chart")
  const pageName = $id?.split("/")[0].split(":").pop() ?? "Default";
  const formattedPageName = pageName.replace(/-/g, " ");

  // Apply transformation if title matches a pattern
  if (typeof title === "string" && title in titleSuffixes) {
    title = formattedPageName + titleSuffixes[title];
  }

  return (
    <Link href={url}>
      <div
        className={cn(
          "dark:bg-primary-foreground group text-muted-foreground flex cursor-pointer rounded-md bg-[#F5F5F5] p-[2px]",
          type === "previous" ? "flex-row-reverse" : "flex-row",
        )}
      >
        <div className="bg-background group-hover:border-primary/20 flex flex-1 flex-col gap-0.5 rounded-md border p-3 duration-200">
          <span className="group-hover:text-primary line-clamp-1 text-[13px] capitalize duration-200">
            {title}
          </span>
          <span className="text-muted-foreground/70 line-clamp-1 text-xs">{description}</span>
        </div>
        <div className="group-hover:text-primary flex items-center duration-200 sm:px-2">
          {type === "previous" ? (
            <ChevronLeft strokeWidth="1.5" className="size-5" />
          ) : (
            <ChevronRight strokeWidth="1.5" className="size-5" />
          )}
        </div>
      </div>
    </Link>
  );
};
