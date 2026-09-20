import { Wallet } from "@phosphor-icons/react";
import { Button, cn } from "@repo/ui";
import type { ComponentProps } from "react";

/**
 * The one "Add funds" button. It is a blue outline on every page, so a member
 * who learns it on one page knows it on the next. The page gives the size and
 * what a press does.
 */
export function AddFundsButton({ className, ...props }: ComponentProps<typeof Button>) {
  return (
    <Button
      type="button"
      variant="outline"
      className={cn(
        "border-primary text-primary hover:bg-primary/10 hover:text-primary",
        className,
      )}
      {...props}
    >
      <Wallet size={16} aria-hidden="true" />
      Add funds
    </Button>
  );
}
