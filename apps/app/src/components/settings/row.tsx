import type * as React from "react";

/**
 * One line of the account: what it is called, what it says now, and the single
 * control that changes it. The action sits at the right rule so every row's
 * button lands on the same vertical line.
 */
export function Row({
  label,
  value,
  action,
}: {
  label: string;
  value: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 px-5 py-4">
      <div className="min-w-0">
        <p data-slot="label" className="text-muted-foreground">
          {label}
        </p>
        <div className="mt-0.5 truncate text-sm">{value}</div>
      </div>
      {action}
    </div>
  );
}
