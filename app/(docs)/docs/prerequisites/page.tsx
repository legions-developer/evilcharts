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
import type { PreparedSnippets, PackageManagerSnippets } from "@/types/docs/snippet-types";
import { codeToHtml } from "shiki";

const HTML_CONFIG = {
  themes: {
    light: "min-light",
    dark: "vesper",
  },
  defaultColor: false,
} as const;

const generateHtml = async (code: string, language: string) => {
  return await codeToHtml(code, {
    lang: language,
    ...HTML_CONFIG,
  });
};

const prepareCodeSnippets = async (snippets: PackageManagerSnippets): Promise<PreparedSnippets> => {
  const packageManagers = Object.keys(snippets) as (keyof PackageManagerSnippets)[];
  
  const prepared = {} as PreparedSnippets;
  
  for (const manager of packageManagers) {
    const snippet = snippets[manager];
    prepared[manager] = {
      ...snippet,
      html: await generateHtml(snippet.code, snippet.language),
    };
  }
  
  return prepared;
};

const prepareAllSnippets = async () => {
  const [recharts, shadcn, components] = await Promise.all([
    prepareCodeSnippets(CODE_SNIPPETS.INSTALL_RECHARTS),
    prepareCodeSnippets(CODE_SNIPPETS.INSTALL_SHADCN_UI),
    prepareCodeSnippets(CODE_SNIPPETS.ADD_COMPONENTS),
  ]);

  return { recharts, shadcn, components };
};

const Page = async () => {
  const htmlSnippets = await prepareAllSnippets();

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
        <InstallRechartsStep snippets={htmlSnippets.recharts} />
        <InstallShadcnUiStep snippets={htmlSnippets.shadcn} />
        <InstallShadcnUiComponentsStep snippets={htmlSnippets.components} />
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
