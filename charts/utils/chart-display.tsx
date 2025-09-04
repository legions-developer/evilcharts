import React from "react";
import { ChartDisplayClient } from "./chart-display-client";
import { prepareShadcnSnippets, generateCodeHtml } from "@/lib/chart-command-utils";

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

  const shadcnSnippets = await prepareShadcnSnippets(fileName);
  const codeHtml = await generateCodeHtml(code, "tsx");

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