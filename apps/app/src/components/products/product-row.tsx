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
  AlertDialogTrigger,
  Badge,
  Button,
  Card,
  CardContent,
  Label,
  Switch,
} from "@repo/ui";
import { ExternalLink, Pencil, ShieldCheck, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useDeleteProduct, useUpdateProduct } from "../../lib/products";
import { StatusBadge } from "../status-badge";

export function ProductRow({
  product,
  onEdit,
  onVerify,
}: {
  product: Product;
  onEdit: (product: Product) => void;
  onVerify: (product: Product) => void;
}) {
  const update = useUpdateProduct();
  const remove = useDeleteProduct();

  function toggle(field: "advertise" | "showAds", value: boolean) {
    update.mutate(
      { id: product.id, input: { [field]: value } },
      { onError: (err) => toast.error(err.message) },
    );
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-4 pt-6 md:flex-row md:items-start md:justify-between">
        <div className="flex min-w-0 gap-3">
          {product.logoUrl ? (
            <img
              src={product.logoUrl}
              alt=""
              className="size-12 shrink-0 rounded-md border object-cover"
            />
          ) : (
            <div className="flex size-12 shrink-0 items-center justify-center rounded-md border bg-muted text-lg font-semibold text-muted-foreground">
              {product.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="truncate font-medium">{product.name}</p>
              <StatusBadge status={product.status} />
              {product.verifiedAt ? (
                <Badge variant="outline">Verified</Badge>
              ) : (
                <Badge variant="neutral">Unverified</Badge>
              )}
            </div>
            <p className="truncate text-sm text-muted-foreground">{product.tagline}</p>
            <a
              href={product.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-mono text-xs text-muted-foreground underline-offset-4 hover:underline"
            >
              {product.domain}
              <ExternalLink size={11} />
            </a>
            {product.status === "rejected" && product.rejectionReason && (
              <p className="text-xs text-destructive">Rejected: {product.rejectionReason}</p>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-3 md:items-end">
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <Switch
                id={`advertise-${product.id}`}
                checked={product.advertise}
                onCheckedChange={(v) => toggle("advertise", v)}
                disabled={update.isPending}
              />
              <Label htmlFor={`advertise-${product.id}`} className="text-xs">
                Advertise this product
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id={`showads-${product.id}`}
                checked={product.showAds}
                onCheckedChange={(v) => toggle("showAds", v)}
                disabled={update.isPending}
              />
              <Label htmlFor={`showads-${product.id}`} className="text-xs">
                Show ads
              </Label>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {!product.verifiedAt && (
              <Button size="sm" onClick={() => onVerify(product)}>
                <ShieldCheck size={14} />
                Verify domain
              </Button>
            )}
            <Button size="sm" variant="outline" onClick={() => onEdit(product)}>
              <Pencil size={14} />
              Edit
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="sm" variant="ghost" className="text-destructive">
                  <Trash2 size={14} />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete {product.name}?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This removes the product and every placement under it. Ledger entries stay.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
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
        </div>
      </CardContent>
    </Card>
  );
}
