import { Code, Monitor } from "@phosphor-icons/react";
import type { PlacementWithTerms, Product } from "@repo/contracts/types";
import { Badge } from "@repo/ui";
import type { DeliveryMode } from "../../lib/delivery-mode";

/**
 * One placement as a grid cell, drawn like a product tile: the cell owns its
 * right and bottom rule, so the grid needs no gap and no wrapper box.
 *
 * The whole tile is the button. There is one thing to do with a placement —
 * look at it — so a separate "open" control would be furniture.
 */
export function PlacementTile({
  item,
  product,
  mode,
  onOpen,
}: {
  item: PlacementWithTerms;
  product: Product;
  mode: DeliveryMode;
  onOpen: () => void;
}) {
  const { placement } = item;
  const isTv = mode === "tv";

  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex min-h-44 cursor-pointer flex-col gap-4 border-r border-b p-5 text-left transition-colors hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
      aria-label={`Open ${isTv ? "CapyTV" : "Snippet"} placement for ${product.name}`}
    >
      <div className="flex items-center justify-between gap-2">
        <Badge variant="secondary" className="gap-1.5">
          {isTv ? <Monitor size={12} /> : <Code size={12} />}
          {isTv ? "CapyTV" : "Snippet"}
        </Badge>
        {!product.verifiedAt && <Badge variant="warning">Not verified</Badge>}
      </div>

      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{product.name}</p>
        <p className="truncate font-mono text-xs text-muted-foreground">{product.domain}</p>
      </div>

      {/* mt-auto pins the line to the bottom rule, so it sits level across the
          whole grid however long the name above it runs. */}
      <p className="mt-auto text-xs text-muted-foreground">
        {isTv
          ? "Tap to play full screen"
          : `Tap for the snippet · ${placement.size === "small" ? "320×64" : "300×120"}`}
      </p>
    </button>
  );
}
