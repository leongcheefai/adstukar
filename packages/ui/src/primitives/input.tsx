import type * as React from "react";
import { cn } from "../lib/utils";

interface InputProps extends React.ComponentProps<"input"> {
  leftIcon?: React.ReactNode;
  error?: string;
}

function Input({ className, type, leftIcon, error, ...props }: InputProps) {
  const inputEl = (
    <input
      type={type}
      data-slot="input"
      aria-invalid={error ? true : undefined}
      className={cn(
        "border-input file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 flex h-9 w-full min-w-0 rounded-lg border bg-transparent py-1 text-base shadow-none transition-[color,box-shadow,border-color] duration-[120ms] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm focus:outline-none focus:border-ring focus:ring-2 focus:ring-primary/40 aria-invalid:border-destructive aria-invalid:ring-destructive/20",
        leftIcon ? "pl-9 pr-3" : "px-3",
        className,
      )}
      {...props}
    />
  );

  if (!leftIcon && !error) return inputEl;

  return (
    <div data-slot="input-wrapper" className="relative w-full">
      {leftIcon && (
        <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted-foreground [&_svg]:size-4">
          {leftIcon}
        </span>
      )}
      {inputEl}
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  );
}

export { Input };
