import { Code, Monitor, Plus } from "@phosphor-icons/react";
import type { PlacementWithTerms } from "@repo/contracts/types";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  EmptyState,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@repo/ui";
import { useState } from "react";
import { Link } from "react-router";
import { toast } from "sonner";
import { PlacementDetail } from "../../components/placements/placement-detail";
import { PlacementTile } from "../../components/placements/placement-tile";
import { type DeliveryMode, readDeliveryMode, rememberDeliveryMode } from "../../lib/delivery-mode";
import { useCreatePlacement, usePlacements } from "../../lib/placements";
import { useProducts } from "../../lib/products";

/**
 * The two things a placement can be. They are separate products, not two
 * settings of one: a snippet is code on someone else's page, CapyTV is a screen
 * in a room. Nothing else is asked at creation — the snippet serves random ads
 * from the advertiser pool, so there is no campaign to pick.
 */
const CHOICES: {
  mode: DeliveryMode;
  label: string;
  hint: string;
  icon: typeof Code;
}[] = [
  {
    mode: "snippet",
    label: "Snippet",
    hint: "One line in your site. Shows random ads from the pool.",
    icon: Code,
  },
  {
    mode: "tv",
    label: "CapyTV",
    hint: "No code. Plays full screen on any display.",
    icon: Monitor,
  },
];

export function PlacementsPage() {
  const { data: products } = useProducts();
  const { data: placements, isLoading } = usePlacements();
  const create = useCreatePlacement();

  const [chooserOpen, setChooserOpen] = useState(false);
  const [openItem, setOpenItem] = useState<PlacementWithTerms | null>(null);

  const productById = new Map((products ?? []).map((p) => [p.id, p]));
  const canCreate = (products?.length ?? 0) > 0;

  /**
   * Picking a mode is the whole form. The product is the member's first one and
   * the size is the default, because neither changes what the placement is —
   * both stay editable in the expanded view.
   */
  function choose(mode: DeliveryMode) {
    const productId = products?.[0]?.id;
    if (!productId) return;
    create.mutate(
      { productId, size: "small", houseAdPct: 0 },
      {
        onSuccess: (created) => {
          // The tile reads its mode from storage, so write it before the list
          // repaints. Otherwise a new CapyTV placement appears as a snippet.
          rememberDeliveryMode(created.placement.id, mode);
          setChooserOpen(false);
          setOpenItem(created);
          toast.success(mode === "tv" ? "CapyTV placement created" : "Snippet placement created");
        },
        onError: (err) => toast.error(err.message),
      },
    );
  }

  const openProduct = openItem ? productById.get(openItem.placement.productId) : undefined;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Placements</h1>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              className="rounded-full"
              onClick={() => setChooserOpen(true)}
              disabled={!canCreate}
              aria-label="New placement"
            >
              <Plus size={18} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>New placement</TooltipContent>
        </Tooltip>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}

      {!canCreate && products !== undefined && (
        <EmptyState
          icon={<Code />}
          title="Register a product first"
          description="Placements belong to a product. Add one, then come back here."
          action={
            <Button asChild>
              <Link to="/dashboard/products">Go to products</Link>
            </Button>
          }
        />
      )}

      {canCreate && placements && placements.length === 0 && (
        <EmptyState
          icon={<Code />}
          title="No placements yet"
          description="Pick a snippet for your site, or CapyTV for a screen."
          action={<Button onClick={() => setChooserOpen(true)}>New placement</Button>}
        />
      )}

      {/* No gap: each tile draws its own right and bottom rule, the same grid the
          Listing page uses. */}
      {placements && placements.length > 0 && (
        <div className="-mx-6 border-t">
          <div className="-mb-px grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {placements.map((item) => {
              const product = productById.get(item.placement.productId);
              return product ? (
                <PlacementTile
                  key={item.placement.id}
                  item={item}
                  product={product}
                  mode={readDeliveryMode(item.placement.id)}
                  onOpen={() => setOpenItem(item)}
                />
              ) : null;
            })}
          </div>
        </div>
      )}

      {/* Two choices and nothing else. Picking one creates the placement. */}
      <Dialog open={chooserOpen} onOpenChange={setChooserOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New placement</DialogTitle>
            <DialogDescription>Where should the ads show?</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            {CHOICES.map(({ mode, label, hint, icon: Icon }) => (
              <button
                key={mode}
                type="button"
                onClick={() => choose(mode)}
                disabled={create.isPending}
                className="flex cursor-pointer flex-col gap-2 rounded-lg border p-4 text-left transition-colors hover:border-primary hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
              >
                <Icon size={20} className="text-primary" />
                <span className="text-sm font-medium">{label}</span>
                <span className="text-xs text-muted-foreground">{hint}</span>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {openItem && openProduct && (
        <PlacementDetail
          item={openItem}
          product={openProduct}
          mode={readDeliveryMode(openItem.placement.id)}
          open
          onOpenChange={(next) => !next && setOpenItem(null)}
        />
      )}
    </div>
  );
}
