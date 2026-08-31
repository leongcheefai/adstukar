import type { Product } from "@repo/contracts/types";
import { Button, EmptyState } from "@repo/ui";
import { Package, Plus } from "lucide-react";
import { useState } from "react";
import { ProductFormDialog } from "../../components/products/product-form-dialog";
import { ProductRow } from "../../components/products/product-row";
import { VerifyDialog } from "../../components/products/verify-dialog";
import { useProducts } from "../../lib/products";

export function ProductsPage() {
  const { data: products, isLoading } = useProducts();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [verifying, setVerifying] = useState<Product | null>(null);

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }
  function openEdit(product: Product) {
    setEditing(product);
    setFormOpen(true);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Products</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Each product needs a verified domain and a review before it serves.
          </p>
        </div>
        <Button size="sm" onClick={openCreate}>
          <Plus size={14} />
          New product
        </Button>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}

      {products && products.length === 0 && (
        <EmptyState
          icon={<Package />}
          title="No products yet"
          description="Register the product you want to promote. You can add placements to it afterwards."
          action={<Button onClick={openCreate}>Register a product</Button>}
        />
      )}

      <div className="space-y-3">
        {products?.map((product) => (
          <ProductRow
            key={product.id}
            product={product}
            onEdit={openEdit}
            onVerify={setVerifying}
          />
        ))}
      </div>

      <ProductFormDialog open={formOpen} onOpenChange={setFormOpen} product={editing} />
      <VerifyDialog
        open={verifying !== null}
        onOpenChange={(open) => !open && setVerifying(null)}
        product={verifying}
      />
    </div>
  );
}
