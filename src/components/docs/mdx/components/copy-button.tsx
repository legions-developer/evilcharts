"use client";

import { CheckIcon, CopyIcon } from "@/assets/icons";
import { Button } from "@/components/ui/button";
import { useClipboard } from "@mantine/hooks";
import { cn } from "@/lib/utils";

const CopyButton = ({
  code,
  withBlurBg,
  className,
}: {
  code: string;
  withBlurBg?: boolean;
  className?: string;
}) => {
  const { copied, copy } = useClipboard({ timeout: 1000 });

  return (
    <Button
      className={cn(
        "h-6 w-6 rounded active:scale-90 dark:hover:bg-[#232323]!",
        withBlurBg && "bg-background",
        className,
      )}
      variant="ghost"
      size="icon"
      onClick={() => copy(code)}
    >
      {copied ? <CheckIcon /> : <CopyIcon />}
    </Button>
  );
};

export default CopyButton;
