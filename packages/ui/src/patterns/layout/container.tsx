import type * as React from "react";
import { cn } from "../../lib/utils";

const sizeMap = {
  prose: "max-w-3xl",
  default: "max-w-6xl",
  wide: "max-w-7xl",
} as const;

export interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: keyof typeof sizeMap;
}

export function Container({ size = "default", className, children, ...props }: ContainerProps) {
  return (
    <div className={cn("mx-auto px-6", sizeMap[size], className)} {...props}>
      {children}
    </div>
  );
}
