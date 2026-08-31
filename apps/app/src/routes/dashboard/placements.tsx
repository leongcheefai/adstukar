import type { PlacementSize } from "@repo/contracts/types";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  EmptyState,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui";
import { Code2, Plus } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";
import { toast } from "sonner";
import { PlacementCard } from "../../components/placements/placement-card";
import { useCreatePlacement, usePlacements } from "../../lib/placements";
import { useProducts } from "../../lib/products";

export function PlacementsPage() {
  const { data: products } = useProducts();
  const { data: placements, isLoading } = usePlacements();
  const create = useCreatePlacement();
  const [open, setOpen] = useState(false);
  const [productId, setProductId] = useState("");
  const [size, setSize] = useState<PlacementSize>("small");

  const productById = new Map((products ?? []).map((p) => [p.id, p]));
  const canCreate = (products?.length ?? 0) > 0;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    create.mutate(
      { productId, size, houseAdPct: 0 },
      {
        onSuccess: () => {
          toast.success("Placement created. Paste the snippet into your site.");
          setOpen(false);
        },
        onError: (err) => toast.error(err.message),
      },
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Placements</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            A placement is one spot on your site. Each has its own key and rules.
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => {
            setProductId(products?.[0]?.id ?? "");
            setOpen(true);
          }}
          disabled={!canCreate}
        >
          <Plus size={14} />
          New placement
        </Button>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}

      {!canCreate && products !== undefined && (
        <EmptyState
          icon={<Code2 />}
          title="Register a product first"
          description="Placements belong to a product. Add one, then come back here for the snippet."
          action={
            <Button asChild>
              <Link to="/dashboard/products">Go to products</Link>
            </Button>
          }
        />
      )}

      {canCreate && placements && placements.length === 0 && (
        <EmptyState
          icon={<Code2 />}
          title="No placements yet"
          description="Create one to get the embed snippet and API key."
          action={
            <Button
              onClick={() => {
                setProductId(products?.[0]?.id ?? "");
                setOpen(true);
              }}
            >
              New placement
            </Button>
          }
        />
      )}

      <div className="space-y-4">
        {placements?.map((item) => {
          const product = productById.get(item.placement.productId);
          return product ? (
            <PlacementCard key={item.placement.id} item={item} product={product} />
          ) : null;
        })}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New placement</DialogTitle>
            <DialogDescription>Pick the product whose site will host this spot.</DialogDescription>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Product</Label>
              <Select value={productId} onValueChange={setProductId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose a product" />
                </SelectTrigger>
                <SelectContent>
                  {products?.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} · {p.domain}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Size</Label>
              <Select value={size} onValueChange={(v) => setSize(v as PlacementSize)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">Small banner · 320×64</SelectItem>
                  <SelectItem value="medium">Medium card · 300×120</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" className="w-full" disabled={!productId || create.isPending}>
              {create.isPending ? "Creating…" : "Create placement"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
