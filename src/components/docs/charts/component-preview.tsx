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
  containerClassName?: string;
}

export function ComponentPreview({
  name,
  className,
  align = "center",
  hideCode = false,
  title,
  containerClassName,
  ...props
}: ComponentPreviewProps) {
  const Component = Index[name]?.component;
  const metaClassName = Index[name]?.meta?.className;

  if (!Component) {
    return (
      <p className="text-muted-foreground mt-4 text-[13px] leading-6">
        Component{" "}
        <code className="bg-background relative mx-1 rounded-md border px-[0.3rem] py-1 font-mono text-[0.75rem] text-red-500 outline-none">
          {name}
        </code>{" "}
        not found in registry. Contact the developer to add it.{" "}
        <a
          target="_blank"
          href="https://github.com/legions-developer/evilcharts/issues"
          className="text-primary hover:underline"
        >
          open an issue
        </a>
      </p>
    );
  }

  return (
    <ComponentPreviewTabs
      align={align}
      className={cn(metaClassName, className)}
      containerClassName={containerClassName}
      component={<Component />}
      hideCode={hideCode}
      source={<ComponentSource collapsible={false} name={name} />}
      title={title}
      {...props}
    />
  );
}
