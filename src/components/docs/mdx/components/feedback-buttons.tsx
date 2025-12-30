"use client";

import { ThumbsDownIcon, ThumbsUpIcon } from "@/assets/icons";
import { Button } from "@/components/ui/button";
import { useState } from "react";

type FeedbackType = "good" | "bad" | null;

export function FeedbackButtons() {
  const [feedback, setFeedback] = useState<FeedbackType>(null);

  return (
    <div className="flex flex-row items-center gap-4">
      <span className="text-muted-foreground text-sm">Did you like the content?</span>
      <div className="space-x-2">
        <Button
          className={
            feedback === "good"
              ? "text-primary border-primary/50 dark:border-primary/50"
              : "text-muted-foreground dark:text-muted-foreground/80 hover:text-primary"
          }
          variant="outline"
          size="sm"
          onClick={() => setFeedback("good")}
        >
          <ThumbsUpIcon />
          <span>Good</span>
        </Button>
        <Button
          className={
            feedback === "bad"
              ? "text-primary border-primary/50 dark:border-primary/50"
              : "text-muted-foreground dark:text-muted-foreground/80 hover:text-primary"
          }
          variant="outline"
          size="sm"
          onClick={() => setFeedback("bad")}
        >
          <ThumbsDownIcon />
          <span>Bad</span>
        </Button>
      </div>
    </div>
  );
}
