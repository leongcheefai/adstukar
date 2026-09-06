import type { ProductStatus } from "@repo/contracts/types";
import { Badge } from "@repo/ui";

const STATUS: Record<
  ProductStatus,
  { label: string; variant: "warning" | "success" | "destructive" }
> = {
  pending: { label: "Pending", variant: "warning" },
  approved: { label: "Approved", variant: "success" },
  rejected: { label: "Rejected", variant: "destructive" },
};

export function StatusBadge({ status }: { status: ProductStatus }) {
  const { label, variant } = STATUS[status];
  return (
    <Badge variant={variant} dot>
      {label}
    </Badge>
  );
}
