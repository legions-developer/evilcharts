// Some of mdx components are taken from @shadcn official repo

import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionPanel,
} from "@/components/ui/accordion";
import {
  ApiReference,
  ApiHeader,
  ApiContent,
  ApiReferenceWrapper,
} from "./components/api-reference";
import { Step, Steps, StepTitle, StepContent, StepDescription } from "./components/steps";
import { CodeCollapsibleWrapper } from "../charts/code-collapsible-wrapper";
import { Tabs, TabsList, TabsPanel, TabsTab } from "@/components/ui/tabs";
import { ComponentPreview } from "../charts/component-preview";
import { H1, H2, H3, H4, H5, H6 } from "./components/headings";
import { ComponentSource } from "../charts/component-source";
import { stripCodeAnnotations } from "@/lib/highlight-code";
import { Description, P, Strong } from "./components/text";
import { ShowcaseGrid } from "./components/showcase-grid";
import { CommandBlock } from "./components/command-block";
import { Alert, AlertContent } from "./components/alert";
import { Table, Tr, Th, Td } from "./components/table";
import { LinkedCard } from "./components/linked-card";
import { Blockquote } from "./components/blockquote";
import { Img, MDXImage } from "./components/image";
import CopyButton from "./components/copy-button";
import { CliBlock } from "./components/cli-block";
import { Ul, Ol, Li } from "./components/lists";
import { CodeTabs } from "../charts/code-tabs";
import { A, MDXLink } from "./components/link";
import type { MDXComponents } from "mdx/types";
import { CodeBlock } from "./components/code";
import { Kbd } from "./components/kbd";
import { Hr } from "./components/hr";
import { cn } from "@/lib/utils";

export const mdxComponents: MDXComponents = {
  Tab: ({ className, ...props }: React.ComponentProps<"div">) => (
    <div className={cn(className)} {...props} />
  ),
  Tabs: ({ className, ...props }: React.ComponentProps<typeof Tabs>) => {
    return <Tabs className={cn(className)} {...props} />;
  },
  TabsList: ({ className, ...props }: React.ComponentProps<typeof TabsList>) => (
    <TabsList
      className={cn(
        "*:data-[slot=tab-indicator]:bg-accent bg-transparent p-0 *:data-[slot=tab-indicator]:rounded-lg *:data-[slot=tab-indicator]:shadow-none",
        className,
      )}
      {...props}
    />
  ),
  TabsPanel: ({ className, ...props }: React.ComponentProps<typeof TabsPanel>) => (
    <TabsPanel
      className={cn(
        "relative [&_h3]:text-base [&_h3]:font-medium *:[figure]:first:mt-0 [&>.steps]:mt-6",
        className,
      )}
      {...props}
    />
  ),
  TabsTab: ({ className, ...props }: React.ComponentProps<typeof TabsTab>) => (
    <TabsTab className={cn("rounded-lg", className)} {...props} />
  ),
  pre: ({ className, children, ...props }: React.ComponentProps<"pre">) => {
    return (
      <div className="dark:bg-primary-foreground group relative mt-4 rounded-sm bg-[#F5F5F5] p-1">
        <pre
          className={cn(
            "no-scrollbar bg-background min-w-0 overflow-x-auto rounded-sm border py-3.5 text-[.8125rem] outline-none has-data-highlighted-line:px-0 has-data-line-numbers:px-0 has-data-[slot=tabs]:p-0 [&>code]:px-0!",
            className,
          )}
          {...props}
        >
          {children}
        </pre>
      </div>
    );
  },
  code: ({
    className,
    __raw__,
    ...props
  }: React.ComponentProps<"code"> & {
    __raw__?: string;
    __src__?: string;
    __npm__?: string;
    __yarn__?: string;
    __pnpm__?: string;
    __bun__?: string;
  }) => {
    // Inline Code.
    if (typeof props.children === "string") {
      return (
        <code
          className={cn(
            "bg-background relative mx-1 rounded-md border px-[0.3rem] py-[2px] font-mono text-[0.75rem] text-(--color-vesper-type) outline-none",
            className,
          )}
          {...props}
        />
      );
    }

    // Default codeblock.
    const cleanedCode = __raw__ ? stripCodeAnnotations(__raw__) : "";
    const isSingleLine = cleanedCode ? cleanedCode.split("\n").length === 1 : false;

    return (
      <>
        {cleanedCode && (
          <CopyButton
            withBlurBg
            className={cn(
              "absolute top-2 right-2 z-10 opacity-0 transition-opacity group-hover:opacity-100",
              isSingleLine && "top-4"
            )}
            code={cleanedCode}
          />
        )}
        <code {...props} />
      </>
    );
  },
  h1: H1,
  h2: H2,
  h3: H3,
  h4: H4,
  h5: H5,
  h6: H6,
  a: A,
  p: P,
  strong: Strong,
  ul: Ul,
  ol: Ol,
  li: Li,
  blockquote: Blockquote,
  img: Img,
  hr: Hr,
  table: Table,
  tr: Tr,
  th: Th,
  td: Td,
  Step,
  Steps,
  StepTitle,
  StepContent,
  StepDescription,
  Image: MDXImage,
  Link: MDXLink,
  LinkedCard,
  Kbd,
  CliBlock,
  CommandBlock,
  CodeBlock,
  Description,
  CodeCollapsibleWrapper,
  CodeTabs,
  ComponentPreview,
  ComponentSource,
  Accordion,
  AccordionItem,
  AccordionPanel,
  AccordionTrigger,
  Alert,
  AlertContent,
  ApiReference,
  ApiHeader,
  ApiContent,
  ApiReferenceWrapper,
  ShowcaseGrid,
};
