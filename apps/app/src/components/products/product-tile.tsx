import { Copy, CursorClick, DotsThreeVertical, PencilSimple, Trash } from "@phosphor-icons/react";
import type { Product } from "@repo/contracts/types";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Switch,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@repo/ui";
import { useState } from "react";
import { toast } from "sonner";
import { useDeleteProduct, useUpdateProduct } from "../../lib/products";
import { StatusBadge } from "../status-badge";

/**
 * PLACEHOLDER. `Product` carries no click data, so there is no real per-ad
 * count to show. This derives a stable figure from the id purely so the tile
 * can be laid out — the same ad always reads the same, and two ads differ, but
 * none of it is counted.
 *
 * Replace the call site with a real field the moment the API returns one; do
 * not build anything on this number.
 */
function placeholderClicks(productId: string): number {
  let hash = 0;
  for (const char of productId) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return hash % 2400;
}

/**
 * One ad variant, drawn as a bare grid cell. The cell owns its right and bottom
 * rule, so the grid needs no gap and no wrapper box.
 */
export function ProductTile({
  product,
  onEdit,
  onDuplicate,
}: {
  product: Product;
  onEdit: (product: Product) => void;
  onDuplicate: (product: Product) => void;
}) {
  const update = useUpdateProduct();
  const remove = useDeleteProduct();
  // The delete dialog is controlled: a DropdownMenuItem unmounts its own subtree on
  // select, which would take an AlertDialogTrigger nested inside it down with it.
  const [confirmOpen, setConfirmOpen] = useState(false);

  function toggleCampaign(value: boolean) {
    update.mutate(
      { id: product.id, input: { advertise: value } },
      { onError: (err) => toast.error(err.message) },
    );
  }

  const rejected = product.status === "rejected" && product.rejectionReason;

  return (
    <div className="flex min-h-56 flex-col gap-4 border-r border-b p-5">
      {/* Status and actions ride the top rule, so every tile in the grid shows
          its state on the same line no matter how tall its tagline runs. */}
      <div className="flex items-center justify-between gap-2">
        {rejected ? (
          <Tooltip>
            <TooltipTrigger className="min-w-0 cursor-help">
              <StatusBadge status={product.status} />
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">{product.rejectionReason}</TooltipContent>
          </Tooltip>
        ) : (
          <StatusBadge status={product.status} />
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              className="-mr-2 shrink-0"
              aria-label={`More actions for ${product.name}`}
            >
              <DotsThreeVertical size={18} weight="bold" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuItem onSelect={() => onEdit(product)}>
              <PencilSimple size={14} className="mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onDuplicate(product)}>
              <Copy size={14} className="mr-2" />
              Duplicate
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {/* variant, not hand-written classes: it is what turns the trash icon
                red as well as the word. */}
            <DropdownMenuItem variant="destructive" onSelect={() => setConfirmOpen(true)}>
              <Trash size={14} className="mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex min-w-0 items-start gap-3">
        {product.logoUrl ? (
          <img
            src={product.logoUrl}
            alt=""
            className="size-9 shrink-0 rounded-md border object-cover"
          />
        ) : (
          <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted text-sm font-semibold text-muted-foreground">
            {product.name.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{product.name}</p>
          <p className="line-clamp-2 text-sm text-muted-foreground">{product.tagline}</p>
        </div>
      </div>

      {/* mt-auto pins the switch to the bottom rule whatever the tagline does,
          so the control sits on one line across the whole grid. The state word
          is beside it because a lone switch does not say what it toggles. */}
      <div className="mt-auto flex items-center gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Switch
              checked={product.advertise}
              onCheckedChange={toggleCampaign}
              disabled={update.isPending}
              aria-label={`Campaign for ${product.name}`}
            />
          </TooltipTrigger>
          <TooltipContent>
            {product.advertise
              ? "Running. This ad shows on other members' sites."
              : "Paused. This ad shows nowhere."}
          </TooltipContent>
        </Tooltip>
        <span className="text-sm text-muted-foreground">
          {product.advertise ? "Running" : "Paused"}
        </span>

        {/* Right rule, so the rate lands on one line across the whole grid. A
            paused ad shows none: it has had no chance to be clicked. */}
        {product.advertise && (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="ml-auto flex shrink-0 cursor-help items-center gap-1.5 text-sm text-muted-foreground tabular-nums">
                <CursorClick size={15} />
                {placeholderClicks(product.id).toLocaleString()}
              </span>
            </TooltipTrigger>
            <TooltipContent>Clicks on this ad</TooltipContent>
          </Tooltip>
        )}
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {product.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the product and every placement under it. Your CapyPoints stay.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() =>
                remove.mutate(product.id, {
                  onSuccess: () => toast.success("Product deleted"),
                  onError: (err) => toast.error(err.message),
                })
              }
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
