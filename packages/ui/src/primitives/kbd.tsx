import type * as React from "react";
import { cn } from "../lib/utils";

function Kbd({ className, ...props }: React.ComponentProps<"kbd">) {
  return (
    <kbd
      data-slot="kbd"
      className={cn(
        "inline-flex h-5 min-w-5 items-center justify-center rounded-[var(--radius-md)] border border-border bg-muted px-1.5 font-mono text-[11px] font-medium text-muted-foreground leading-none",
        className,
      )}
      {...props}
    />
  );
}

export { Kbd };
