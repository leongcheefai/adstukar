import { type VariantProps, cva } from "class-variance-authority";
import { Slot } from "radix-ui";
import type * as React from "react";
import { cn } from "../lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-[background-color,color,border-color,box-shadow,transform] duration-[120ms] ease-out active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:border-ring aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive relative before:absolute before:content-['']",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-white hover:bg-red-600 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "border border-border bg-background hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50",
        secondary: "bg-secondary text-secondary-foreground hover:bg-muted",
        // Ink, not brand. For the one commit action on a step where blue would
        // compete with the brand marks around it. Inverts with the theme.
        inverted: "bg-foreground text-background hover:bg-foreground/90",
        ghost: "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
        link: "text-primary underline-offset-4 hover:underline",
      },
      // Every size carries a transparent ::before that bleeds to a 40px tall
      // target, the desktop floor. It grows vertically only, so two buttons
      // sitting side by side in a row can never overlap each other's target.
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3 before:-inset-y-0.5 before:inset-x-0",
        sm: "h-8 gap-1.5 px-3 text-xs has-[>svg]:px-2.5 before:-inset-y-1 before:inset-x-0",
        // lg already draws at 40px, so its pseudo-element only overlays it.
        lg: "h-10 px-6 has-[>svg]:px-4 before:inset-0",
        icon: "size-9 before:-inset-0.5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

interface ButtonProps extends React.ComponentProps<"button">, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

function Button({ className, variant, size, asChild = false, ...props }: ButtonProps) {
  const Comp = asChild ? Slot.Root : "button";
  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
