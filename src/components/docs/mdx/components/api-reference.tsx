import { cn } from "@/lib/utils";
import React from "react";

interface ApiTableProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Table wrapper for a component's API reference. Renders the column header
 * (Prop / Type / Default / Description) and frames the <ApiRow> rows.
 */
export function ApiTable({ children, className }: ApiTableProps) {
  return (
    <div className="no-scrollbar my-6 w-full overflow-x-auto rounded-lg border">
      <table className={cn("w-full border-none text-sm", className)}>
        <thead>
          <tr className="bg-muted dark:bg-muted/30 border-b">
            <th className="text-muted-foreground px-4 py-2 text-left text-[12px] font-medium">
              Prop
            </th>
            <th className="text-muted-foreground px-4 py-2 text-left text-[12px] font-medium">
              Type
            </th>
            <th className="text-muted-foreground px-4 py-2 text-left text-[12px] font-medium">
              Default
            </th>
            <th className="text-muted-foreground px-4 py-2 text-left text-[12px] font-medium">
              Description
            </th>
          </tr>
        </thead>
        <tbody className="[&_tr:last-child]:border-b-0">{children}</tbody>
      </table>
    </div>
  );
}

interface ApiRowProps {
  name: string; // the prop name
  type?: string; // the prop's TypeScript type, written as plain text
  default?: string; // the default value, omit when the prop has none
  required?: boolean; // marks the prop as required
  children: React.ReactNode; // the prop description
}

/**
 * Renders a prop's type. String-literal members of a union (e.g.
 * `"solid" | "dotted"`) are shown as badges separated by `|`; anything
 * else falls back to plain mono text.
 */
function renderType(type: string) {
  const parts = type.split("|").map((part) => part.trim());
  const isLiteralUnion = parts.length > 1 && parts.every((part) => /^"[^"]*"$/.test(part));

  if (!isLiteralUnion) {
    return <span className="text-muted-foreground font-mono text-[12px]">{type}</span>;
  }

  return (
    <span className="flex flex-wrap items-center gap-1.5">
      {parts.map((part, index) => (
        <React.Fragment key={part}>
          {index > 0 && <span className="text-muted-foreground/40 font-mono text-[12px]">|</span>}
          <span className="bg-muted dark:bg-muted/40 inline-flex items-center rounded-md border px-1.5 py-0.5 font-mono text-[11px]">
            {part.slice(1, -1)}
          </span>
        </React.Fragment>
      ))}
    </span>
  );
}

interface ApiHeadingProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Section header for a single component's API reference (e.g. `<Area />`).
 * Renders like an h3 but is intentionally NOT a markdown heading, so these
 * per-component entries stay out of the page's table of contents.
 */
export function ApiHeading({ children, className }: ApiHeadingProps) {
  return (
    <div
      className={cn(
        "font-heading text-primary mt-8 scroll-m-10 text-base font-medium tracking-tight select-none [&+p]:mt-4!",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** A single prop row inside an <ApiTable>. */
export function ApiRow({ name, type, default: defaultValue, required, children }: ApiRowProps) {
  return (
    <tr className="border-b">
      <td className="px-4 py-2.5 align-top">
        <span className="text-primary font-mono text-[13px] whitespace-nowrap">
          {name}
          {required && (
            <span className="text-rose-500" title="Required">
              *
            </span>
          )}
        </span>
      </td>
      <td className="px-4 py-2.5 align-top">
        {type ? renderType(type) : <span className="text-muted-foreground/40">–</span>}
      </td>
      <td className="px-4 py-2.5 align-top">
        {defaultValue ? (
          <span className="text-muted-foreground font-mono text-[12px] whitespace-nowrap">
            {defaultValue}
          </span>
        ) : (
          <span className="text-muted-foreground/40">–</span>
        )}
      </td>
      <td className="text-muted-foreground min-w-[220px] px-4 py-2.5 align-top text-[13px] [&>p]:my-0">
        {children}
      </td>
    </tr>
  );
}
