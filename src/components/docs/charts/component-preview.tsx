import { ComponentPreviewTabs } from "@/components/docs/charts/component-preview-tabs";
import { ComponentSource } from "@/components/docs/charts/component-source";
import { Index } from "@/registry/__index__";
import { cn } from "@/lib/utils";

interface ComponentPreviewProps extends Omit<React.ComponentProps<"div">, "ref"> {
  name: string;
  align?: "center" | "start" | "end";
  description?: string;
  hideCode?: boolean;
  title?: string;
}

export function ComponentPreview({
  name,
  className,
  align = "center",
  hideCode = false,
  title,
  ...props
}: ComponentPreviewProps) {
  const Component = Index[name]?.component;
  const metaClassName = Index[name]?.meta?.className;

  if (!Component) {
    return (
      <p className="text-muted-foreground text-sm">
        Component <code className="bg-muted relative rounded px-[0.3rem] py-[0.2rem] font-mono text-sm">{name}</code>{" "}
        not found in registry.
      </p>
    );
  }

  return (
    <ComponentPreviewTabs
      align={align}
      className={cn(metaClassName, className)}
      component={<Component />}
      hideCode={hideCode}
      source={<ComponentSource collapsible={false} name={name} />}
      title={title}
      {...props}
    />
  );
}
