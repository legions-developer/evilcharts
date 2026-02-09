import { highlightCode, stripCodeAnnotations } from "@/lib/highlight-code";
import { getIconForLanguageExtension } from "@/assets/language/icons";
import CopyButton from "./copy-button";
import { cn } from "@/lib/utils";

export async function CodeBlock({
  code,
  language,
  title,
  className,
  copyButton = true,
  showLineNumbers = true,
  withWrapper = false,
  wrapperClassName,
}: {
  code: string;
  language: string;
  title?: string | undefined;
  className?: string;
  copyButton?: boolean;
  showLineNumbers?: boolean;
  withWrapper?: boolean;
  wrapperClassName?: string;
}) {
  const cleanedCode = stripCodeAnnotations(code);
  const highlightedCode = await highlightCode(code, language, {
    showLineNumbers,
  });

  if (withWrapper) {
    return (
      <div
        className={cn("dark:bg-primary-foreground rounded-md bg-[#F5F5F5] p-1", wrapperClassName)}
      >
        <div className="flex h-7 justify-between px-1">
          <figcaption
            className="text-muted-foreground dark:text-muted-foreground/80 -mt-1 flex items-center gap-1.5 text-xs [&_svg]:size-3.5"
            data-language={language}
            data-rehype-pretty-code-title=""
          >
            {getIconForLanguageExtension(language)}
            <span className="font-mono">{title}</span>
          </figcaption>
          {copyButton && <CopyButton code={cleanedCode} />}
        </div>
        <figure data-rehype-pretty-code-figure="">
          <div
            className={cn("bg-background rounded-md border", className)}
            dangerouslySetInnerHTML={{ __html: highlightedCode }}
          />
        </figure>
      </div>
    );
  }

  return (
    <figure className="relative" data-rehype-pretty-code-figure="">
      {title && (
        <figcaption
          className="text-muted-foreground/50 flex items-center gap-1.5 text-xs [&_svg]:size-3.5"
          data-language={language}
          data-rehype-pretty-code-title=""
        >
          {getIconForLanguageExtension(language)}
          <span className="font-mono">{title}</span>
        </figcaption>
      )}
      {copyButton && (
        <div className="sticky top-0 z-10 flex h-0 justify-end">
          <CopyButton withBlurBg code={cleanedCode} className="mt-2 mr-2" />
        </div>
      )}
      <div className={cn("", className)} dangerouslySetInnerHTML={{ __html: highlightedCode }} />
    </figure>
  );
}
