import type { DeviceState, ListingState } from "@repo/contracts/types";
import { Badge } from "@repo/ui";

/**
 * A listing and a device travel the same review path, so they share one badge.
 * A campaign does not: the domain check gates it, not a person.
 */
type ReviewState = ListingState | DeviceState;

const STATUS: Record<
  ReviewState,
  { label: string; variant: "warning" | "success" | "destructive" | "neutral" }
> = {
  pending: { label: "Pending", variant: "warning" },
  approved: { label: "Approved", variant: "success" },
  paused: { label: "Paused", variant: "neutral" },
  rejected: { label: "Rejected", variant: "destructive" },
  archived: { label: "Archived", variant: "neutral" },
};

export function StatusBadge({ status }: { status: ReviewState }) {
  const { label, variant } = STATUS[status];
  return (
    <Badge variant={variant} dot>
      {label}
    </Badge>
  );
}
