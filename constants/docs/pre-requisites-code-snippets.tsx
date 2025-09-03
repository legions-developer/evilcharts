import { BundledLanguage } from "shiki";

interface SnippetProps {
  code: string;
  language: BundledLanguage;
}

interface PackageManagerSnippets {
  npm: SnippetProps;
  yarn: SnippetProps;
  pnpm: SnippetProps;
  bun: SnippetProps;
}

interface CodeSnippetProps {
  INSTALL_SHADCN_UI: PackageManagerSnippets;
  ADD_COMPONENTS: PackageManagerSnippets;
  INSTALL_RECHARTS: PackageManagerSnippets;
}

export const CODE_DOCS_LINKS = {
  INSTALL_NEXT_JS:
    "https://nextjs.org/docs/app/api-reference/cli/create-next-app",
  CONFIGURE_NEXT_JS_CLI:
    "https://nextjs.org/docs/app/api-reference/cli/create-next-app#with-the-default-template",
  INSTALL_TAILWIND_CSS:
    "https://tailwindcss.com/docs/installation/framework-guides/nextjs",
  INSTALL_SHADCN_UI: "https://ui.shadcn.com/docs/installation/next",
  INSTALL_RECHARTS: "https://recharts.org/en-US/guide/installation",
};

export const CODE_SNIPPETS: CodeSnippetProps = {
  INSTALL_SHADCN_UI: {
    npm: {
      code: `npx shadcn@latest init`,
      language: "bash",
    },
    yarn: {
      code: `yarn dlx shadcn@latest init`,
      language: "bash",
    },
    pnpm: {
      code: `pnpm dlx shadcn@latest init`,
      language: "bash",
    },
    bun: {
      code: `bunx shadcn@latest init`,
      language: "bash",
    },
  },
  ADD_COMPONENTS: {
    npm: {
      code: `npx shadcn@latest add chart label card`,
      language: "bash",
    },
    yarn: {
      code: `yarn dlx shadcn@latest add chart label card`,
      language: "bash",
    },
    pnpm: {
      code: `pnpm dlx shadcn@latest add chart label card`,
      language: "bash",
    },
    bun: {
      code: `bunx shadcn@latest add chart label card`,
      language: "bash",
    },
  },
  INSTALL_RECHARTS: {
    npm: {
      code: `npm install recharts@2.15.4`,
      language: "bash",
    },
    yarn: {
      code: `yarn add recharts@2.15.4`,
      language: "bash",
    },
    pnpm: {
      code: `pnpm add recharts@2.15.4`,
      language: "bash",
    },
    bun: {
      code: `bun add recharts@2.15.4`,
      language: "bash",
    },
  },
};
