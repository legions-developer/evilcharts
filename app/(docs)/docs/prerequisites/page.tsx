import React from "react";
import { GenerateBreadcrumb } from "@/components/ui/generate-breadcrumb";
import {
  DocsContainer,
  DocsDescription,
  DocsLink,
  DocsParagraph,
  DocsSubtitle,
  DocsTitle,
} from "@/components/docs/components/docs-typography";
import { Steps, Step, StepContent } from "@/components/ui/steps";
import { PackageManagerSwitcher } from "@/components/ui/package-manager-switcher";
import {
  CODE_DOCS_LINKS,
  CODE_SNIPPETS,
} from "@/constants/docs/pre-requisites-code-snippets";
import { codeToHtml } from "shiki";

type PreparedSnippet = {
  code: string;
  language: "bash";
  html: string;
};

type PreparedSnippets = {
  npm: PreparedSnippet;
  yarn: PreparedSnippet;
  pnpm: PreparedSnippet;
  bun: PreparedSnippet;
};

const prepareCodeSnippets = async (snippets: typeof CODE_SNIPPETS.INSTALL_RECHARTS): Promise<PreparedSnippets> => {
  const prepared = {
    npm: {
      ...snippets.npm,
      html: await codeToHtml(snippets.npm.code, {
        lang: snippets.npm.language,
        themes: {
          light: "min-light",
          dark: "vesper",
        },
        defaultColor: false,
      }),
    },
    yarn: {
      ...snippets.yarn,
      html: await codeToHtml(snippets.yarn.code, {
        lang: snippets.yarn.language,
        themes: {
          light: "min-light",
          dark: "vesper",
        },
        defaultColor: false,
      }),
    },
    pnpm: {
      ...snippets.pnpm,
      html: await codeToHtml(snippets.pnpm.code, {
        lang: snippets.pnpm.language,
        themes: {
          light: "min-light",
          dark: "vesper",
        },
        defaultColor: false,
      }),
    },
    bun: {
      ...snippets.bun,
      html: await codeToHtml(snippets.bun.code, {
        lang: snippets.bun.language,
        themes: {
          light: "min-light",
          dark: "vesper",
        },
        defaultColor: false,
      }),
    },
  };
  return prepared;
};

const Page = async () => {
  const rechartsSnippets = await prepareCodeSnippets(CODE_SNIPPETS.INSTALL_RECHARTS);
  const shadcnSnippets = await prepareCodeSnippets(CODE_SNIPPETS.INSTALL_SHADCN_UI);
  const componentsSnippets = await prepareCodeSnippets(CODE_SNIPPETS.ADD_COMPONENTS);
  return (
    <div className="page">
      <GenerateBreadcrumb />
      <DocsContainer>
        <DocsTitle title="Libraries" />
        <DocsDescription>
          Here you can find the libraries that are required to use the
          components.
        </DocsDescription>
      </DocsContainer>
      <Steps>
        <InstallRechartsStep snippets={rechartsSnippets} />
        <InstallShadcnUiStep snippets={shadcnSnippets} />
        <InstallShadcnUiComponentsStep snippets={componentsSnippets} />
      </Steps>
      <DocsContainer>
        <DocsDescription>
          That&apos;s all you need to get started.
        </DocsDescription>
      </DocsContainer>
    </div>
  );
};
export default Page;

const InstallRechartsStep = ({ snippets }: { snippets: PreparedSnippets }) => {
  return (
    <Step>
      <DocsSubtitle title="Install Recharts" withoutLink />
      <StepContent>
        <DocsParagraph>
          Install Recharts by running one of the following commands{" "}
          <DocsLink href={CODE_DOCS_LINKS.INSTALL_RECHARTS} _blank>
            Recharts Docs
          </DocsLink>
        </DocsParagraph>
        <PackageManagerSwitcher snippets={snippets} heightAuto={true} />
      </StepContent>
    </Step>
  );
};

const InstallShadcnUiStep = ({ snippets }: { snippets: PreparedSnippets }) => {
  return (
    <Step>
      <DocsSubtitle title="Install Shadcn UI" withoutLink />
      <StepContent>
        <DocsParagraph>
          Run the init command to create a new Next.js project or to setup an
          existing one{" "}
          <DocsLink href={CODE_DOCS_LINKS.INSTALL_SHADCN_UI} _blank>
            Shadcn UI Docs
          </DocsLink>
        </DocsParagraph>
        <PackageManagerSwitcher snippets={snippets} heightAuto={true} />
      </StepContent>
    </Step>
  );
};

const InstallShadcnUiComponentsStep = ({ snippets }: { snippets: PreparedSnippets }) => {
  return (
    <Step>
      <DocsSubtitle title="Add Components" withoutLink />
      <StepContent>
        <DocsParagraph>
          Add the required components to your project by running one of the following
          commands:
        </DocsParagraph>
        <PackageManagerSwitcher snippets={snippets} heightAuto={true} />
      </StepContent>
    </Step>
  );
};
