import { codeToHtml } from "shiki";
import type { PreparedSnippets, PackageManagerSnippets } from "@/types/docs/snippet-types";

const HTML_CONFIG = {
  themes: {
    light: "min-light",
    dark: "vesper",
  },
  defaultColor: false,
} as const;

export const generateShadcnCommands = (fileName: string): PackageManagerSnippets => ({
  npm: {
    code: `npx shadcn@latest add https://evilcharts.com/chart/${fileName}.json`,
    language: "bash",
  },
  yarn: {
    code: `yarn dlx shadcn@latest add https://evilcharts.com/chart/${fileName}.json`,
    language: "bash",
  },
  pnpm: {
    code: `pnpm dlx shadcn@latest add https://evilcharts.com/chart/${fileName}.json`,
    language: "bash",
  },
  bun: {
    code: `bunx shadcn@latest add https://evilcharts.com/chart/${fileName}.json`,
    language: "bash",
  },
});

const generateHtml = async (code: string, language: string) => {
  return await codeToHtml(code, {
    lang: language,
    ...HTML_CONFIG,
  });
};

export const prepareShadcnSnippets = async (fileName: string): Promise<PreparedSnippets> => {
  const commands = generateShadcnCommands(fileName);
  const packageManagers = Object.keys(commands) as (keyof PackageManagerSnippets)[];
  
  const prepared = {} as PreparedSnippets;
  
  for (const manager of packageManagers) {
    const snippet = commands[manager];
    prepared[manager] = {
      ...snippet,
      html: await generateHtml(snippet.code, snippet.language),
    };
  }
  
  return prepared;
};

export const generateCodeHtml = async (code: string, language: string = "tsx") => {
  return await codeToHtml(code, {
    lang: language,
    ...HTML_CONFIG,
  });
};
