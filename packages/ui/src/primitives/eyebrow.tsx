import type * as React from "react";
import { cn } from "../lib/utils";

function Eyebrow({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="eyebrow"
      className={cn("t-eyebrow text-muted-foreground", className)}
      {...props}
    />
  );
}

export { Eyebrow };
