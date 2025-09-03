import type { BundledLanguage } from "shiki";
import { codeToHtml } from "shiki";
import CopyButton from "@/components/ui/code-block/copy-button";
import CodeBlockHtml from "@/components/ui/code-block/code-block-html";
import { WindowCode, SquareCode, CodeEditor, ImageBinary } from "@/assets/svgs";

type CodeBlockType = "code" | "command" | "snippet" | "css" | "terminal";

interface CodeBlockProps {
  language: BundledLanguage;
  type?: CodeBlockType;
  code: string;
  clickToViewMore?: boolean;
  maxHeight?: number;
  title?: string;
  heightAuto?: boolean;
}

// -------------------
// Server Component
// -------------------
const CodeBlock = async ({
  language,
  code,
  heightAuto = false,
  title,
  type = "terminal",
}: CodeBlockProps) => {
  const html = await codeToHtml(code, {
    lang: language,
    themes: {
      light: "min-light",
      dark: "vesper",
    },
    defaultColor: false,
  });

  return (
    <div className="bg-border/40 p-1 rounded-[14px] group dark:shadow-md">
      <div className="pb-2 py-1 px-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {getCodeBlockIcon(type)}
          <span className="text-xs text-muted-foreground font-medium leading-none">
            {title ? title : language}
          </span>
        </div>
        <CopyButton code={code} />
      </div>
      <CodeBlockHtml html={html} heightAuto={heightAuto} />
    </div>
  );
};

// -------------------
// Client Component
// -------------------
interface CodeBlockClientProps {
  html: string;
  code: string;
  language: BundledLanguage;
  clickToViewMore?: boolean;
  title?: string;
  type?: CodeBlockType;
  heightAuto?: boolean;
}

const CodeBlockClient = ({
  html,
  code,
  language,
  title,
  type = "terminal",
  heightAuto = false,
}: CodeBlockClientProps) => {
  return (
    <div className="bg-border/40 p-1 rounded-[14px] group dark:shadow-md h-auto">
      <div className="pb-2 py-1 px-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {getCodeBlockIcon(type)}
          <span className="text-xs text-muted-foreground font-medium leading-none">
            {title ? title : language}
          </span>
        </div>
        <CopyButton code={code} />
      </div>
      <CodeBlockHtml html={html} heightAuto={heightAuto} />
    </div>
  );
};

// -------------------
// AddShadcnCodeBlock
// -------------------
const AddShadcnCodeBlock = async ({ text }: { text: string }) => {
  const html = await codeToHtml(text, {
    lang: "bash",
    themes: {
      light: "min-light",
      dark: "vesper",
    },
    defaultColor: false,
  });

  return (
    <div className="bg-border/40 p-1 rounded-[14px] group dark:shadow-md flex flex-col">
      <div className="flex justify-between px-3 py-2 items-center">
        <span className="text-xs text-muted-foreground">Command</span>
        <CopyButton code={text} />
      </div>
      <CodeBlockHtml html={html} heightAuto />
    </div>
  );
};

export { CodeBlock, CodeBlockClient, AddShadcnCodeBlock };

// -------------------
// Icon helper
// -------------------
const getCodeBlockIcon = (type: CodeBlockType) => {
  switch (type) {
    case "code":
      return <CodeEditor />;
    case "command":
      return <WindowCode />;
    case "snippet":
      return <SquareCode />;
    case "css":
      return <ImageBinary />;
    case "terminal":
      return <SquareCode />;
    default:
      return <SquareCode />;
  }
};
