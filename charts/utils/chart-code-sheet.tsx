import {
  CodeBlock,
} from "@/components/ui/code-block/code-block";
import { PackageManagerSwitcher } from "@/components/ui/package-manager-switcher";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { codeToHtml } from "shiki";

export async function ChartCodeSheet({
  code,
  children,
  name,
}: {
  code: string;
  children: React.ReactNode;
  name: string;
}) {
  const shadcnCommands = {
    npm: `npx shadcn@latest add https://evilcharts.com/chart/${name}.json`,
    yarn: `yarn dlx shadcn@latest add https://evilcharts.com/chart/${name}.json`,
    pnpm: `pnpm dlx shadcn@latest add https://evilcharts.com/chart/${name}.json`,
    bun: `bunx shadcn@latest add https://evilcharts.com/chart/${name}.json`,
  };

  const shadcnSnippets = {
    npm: {
      code: shadcnCommands.npm,
      language: "bash" as const,
      html: await codeToHtml(shadcnCommands.npm, {
        lang: "bash",
        themes: {
          light: "min-light",
          dark: "vesper",
        },
        defaultColor: false,
      }),
    },
    yarn: {
      code: shadcnCommands.yarn,
      language: "bash" as const,
      html: await codeToHtml(shadcnCommands.yarn, {
        lang: "bash",
        themes: {
          light: "min-light",
          dark: "vesper",
        },
        defaultColor: false,
      }),
    },
    pnpm: {
      code: shadcnCommands.pnpm,
      language: "bash" as const,
      html: await codeToHtml(shadcnCommands.pnpm, {
        lang: "bash",
        themes: {
          light: "min-light",
          dark: "vesper",
        },
        defaultColor: false,
      }),
    },
    bun: {
      code: shadcnCommands.bun,
      language: "bash" as const,
      html: await codeToHtml(shadcnCommands.bun, {
        lang: "bash",
        themes: {
          light: "min-light",
          dark: "vesper",
        },
        defaultColor: false,
      }),
    },
  };

  return (
    <Sheet>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent className="px-4">
        <SheetHeader className="p-0 pt-4 gap-0">
          <SheetTitle>Code</SheetTitle>
          <SheetDescription>
            You can copy the code to your clipboard.
          </SheetDescription>
        </SheetHeader>
        <PackageManagerSwitcher snippets={shadcnSnippets} heightAuto={true} />
        <CodeBlock code={code} clickToViewMore={false} language="tsx" />
      </SheetContent>
    </Sheet>
  );
}
