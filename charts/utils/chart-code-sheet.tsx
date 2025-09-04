import {
  CodeBlock,
} from "@/components/ui/code-block/code-block";
import { PackageManagerSwitcher } from "@/components/ui/package-manager-switcher";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { prepareShadcnSnippets } from "@/lib/chart-command-utils";

export async function ChartCodeSheet({
  code,
  children,
  name,
}: {
  code: string;
  children: React.ReactNode;
  name: string;
}) {
  const shadcnSnippets = await prepareShadcnSnippets(name);

  return (
    <Sheet>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent className="px-4">
        <SheetHeader className="p-0 pt-4 gap-0">
          <SheetTitle>Code</SheetTitle>
          <SheetDescription>
            You can copy the code to your clipboard.
          </SheetDescription>
        </SheetHeader>
        <PackageManagerSwitcher snippets={shadcnSnippets} heightAuto={true} />
        <CodeBlock code={code} clickToViewMore={false} language="tsx" />
      </SheetContent>
    </Sheet>
  );
}
