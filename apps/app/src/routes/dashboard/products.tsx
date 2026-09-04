import { Plus, Rocket } from "@phosphor-icons/react";
import type { Product } from "@repo/contracts/types";
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@repo/ui";
import { useState } from "react";
import {
  type Campaign,
  CampaignSection,
  groupIntoCampaigns,
} from "../../components/products/campaign-section";
import { ProductFormDialog } from "../../components/products/product-form-dialog";
import { ScribbleArrow } from "../../components/scribble-arrow";
import { useProducts } from "../../lib/products";

export function ProductsPage() {
  const { data: products, isLoading } = useProducts();
  const campaigns = groupIntoCampaigns(products ?? []);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [duplicating, setDuplicating] = useState<Product | null>(null);
  const [joining, setJoining] = useState<Campaign | null>(null);

  /** Every entry point clears the other two, so the dialog opens in one mode only. */
  function open(mode: {
    edit?: Product | null;
    duplicate?: Product | null;
    campaign?: Campaign | null;
  }) {
    setEditing(mode.edit ?? null);
    setDuplicating(mode.duplicate ?? null);
    setJoining(mode.campaign ?? null);
    setFormOpen(true);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Listing</h1>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="icon" className="rounded-full" aria-label="Add a listing">
              <Plus size={18} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-72">
            <DropdownMenuItem className="items-start gap-3 py-2.5" onSelect={() => open({})}>
              <Rocket size={16} className="mt-0.5" />
              <span>
                <span className="block text-sm font-medium">New campaign</span>
                <span className="block text-xs text-muted-foreground">
                  A new site to promote. Three steps.
                </span>
              </span>
            </DropdownMenuItem>
            <DropdownMenuItem
              className="items-start gap-3 py-2.5"
              disabled={campaigns.length === 0}
              onSelect={() => open({ campaign: campaigns[0] ?? null })}
            >
              <Plus size={16} className="mt-0.5" />
              <span>
                <span className="block text-sm font-medium">Ad for an existing campaign</span>
                <span className="block text-xs text-muted-foreground">
                  Skips the link. The domain is already verified.
                </span>
              </span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}

      {/* First run. No card and no second button: the arrow sends the eye to the
          one control that starts everything. */}
      {products && products.length === 0 && (
        <div className="relative pt-12 pb-20">
          <ScribbleArrow className="absolute -top-16 right-14 hidden h-56 w-44 text-muted-foreground/45 lg:block" />
          <p className="mx-auto max-w-xs text-center text-lg font-medium text-balance text-muted-foreground">
            No campaign yet. Create your first campaign.
          </p>
        </div>
      )}

      {campaigns.length > 0 && (
        <div className="-mx-6 border-t">
          {campaigns.map((campaign) => (
            <CampaignSection
              key={campaign.domain}
              campaign={campaign}
              onEdit={(item) => open({ edit: item })}
              onDuplicate={(item) => open({ duplicate: item })}
              onAddAd={(item) => open({ campaign: item })}
            />
          ))}
        </div>
      )}

      <ProductFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        product={editing}
        duplicateOf={duplicating}
        campaign={joining}
      />
    </div>
  );
}
