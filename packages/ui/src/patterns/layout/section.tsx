import type * as React from "react";
import { cn } from "../../lib/utils";

const spacingMap = {
  default: "py-24 sm:py-32",
  tight: "py-16 sm:py-20",
  loose: "py-32 sm:py-40",
  none: "",
} as const;

export interface SectionProps extends React.HTMLAttributes<HTMLElement> {
  spacing?: keyof typeof spacingMap;
  as?: "section" | "div" | "article";
}

export function Section({
  spacing = "default",
  as: Tag = "section",
  className,
  children,
  ...props
}: SectionProps) {
  return (
    <Tag className={cn(spacingMap[spacing], className)} {...props}>
      {children}
    </Tag>
  );
}
