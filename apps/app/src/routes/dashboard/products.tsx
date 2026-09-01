import { Package, Plus } from "@phosphor-icons/react";
import type { Product } from "@repo/contracts/types";
import { Button, EmptyState, Tooltip, TooltipContent, TooltipTrigger } from "@repo/ui";
import { useState } from "react";
import { CampaignSection, groupIntoCampaigns } from "../../components/products/campaign-section";
import { ProductFormDialog } from "../../components/products/product-form-dialog";
import { useProducts } from "../../lib/products";

export function ProductsPage() {
  const { data: products, isLoading } = useProducts();
  const campaigns = groupIntoCampaigns(products ?? []);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [duplicating, setDuplicating] = useState<Product | null>(null);

  function openCreate() {
    setEditing(null);
    setDuplicating(null);
    setFormOpen(true);
  }
  function openEdit(product: Product) {
    setDuplicating(null);
    setEditing(product);
    setFormOpen(true);
  }
  function openDuplicate(product: Product) {
    setEditing(null);
    setDuplicating(product);
    setFormOpen(true);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Listing</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Ads that share a domain form one campaign. Duplicate an ad to test a second tagline.
          </p>
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              className="rounded-full"
              onClick={openCreate}
              aria-label="New product"
            >
              <Plus size={18} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>New product</TooltipContent>
        </Tooltip>
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

      <div className="-mx-6 border-t">
        {campaigns.map((campaign) => (
          <CampaignSection
            key={campaign.domain}
            campaign={campaign}
            onEdit={openEdit}
            onDuplicate={openDuplicate}
          />
        ))}
      </div>

      <ProductFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        product={editing}
        duplicateOf={duplicating}
      />
    </div>
  );
}
