import React from "react";
import { ChartDisplayClient } from "./chart-display-client";
import { codeToHtml } from "shiki";

interface ChartDisplayProps {
  name: string;
  children: React.ReactNode;
  className?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  jsonContent?: any;
}

const ChartDisplay = async ({
  name,
  children,
  className,
  jsonContent,
}: ChartDisplayProps) => {
  const code = jsonContent?.files[0].content;
  const fileName = jsonContent?.name;

  if (!code || !fileName) {
    return null;
  }

  const shadcnCommands = {
    npm: `npx shadcn@latest add https://evilcharts.com/chart/${fileName}.json`,
    yarn: `yarn dlx shadcn@latest add https://evilcharts.com/chart/${fileName}.json`,
    pnpm: `pnpm dlx shadcn@latest add https://evilcharts.com/chart/${fileName}.json`,
    bun: `bunx shadcn@latest add https://evilcharts.com/chart/${fileName}.json`,
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

  const codeHtml = await codeToHtml(code, {
    lang: "tsx",
    themes: {
      light: "min-light",
      dark: "vesper",
    },
    defaultColor: false,
  });

  return (
    <ChartDisplayClient 
      name={name}
      code={code}
      codeHtml={codeHtml}
      fileName={fileName}
      className={className}
      shadcnSnippets={shadcnSnippets}
    >
      {children}
    </ChartDisplayClient>
  );
};

export default ChartDisplay;