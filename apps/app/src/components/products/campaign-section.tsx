import { Plus } from "@phosphor-icons/react";
import type { Product } from "@repo/contracts/types";
import { Button, Tooltip, TooltipContent, TooltipTrigger } from "@repo/ui";
import { ProductTile } from "./product-tile";

export interface Campaign {
  /** The verified domain every ad in the group points at. */
  domain: string;
  /** Newest first, so a fresh variant lands where the eye already is. */
  ads: Product[];
}

/**
 * Ads that share a domain are variants of one campaign, because Duplicate copies
 * the URL and only the tagline changes. There is no campaign table yet, so the
 * domain is the grouping key.
 */
export function groupIntoCampaigns(products: Product[]): Campaign[] {
  const byDomain = new Map<string, Product[]>();
  for (const product of products) {
    const group = byDomain.get(product.domain);
    if (group) group.push(product);
    else byDomain.set(product.domain, [product]);
  }
  return [...byDomain.entries()]
    .map(([domain, ads]) => ({
      domain,
      ads: [...ads].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    }))
    .sort((a, b) => a.domain.localeCompare(b.domain));
}

export function CampaignSection({
  campaign,
  onEdit,
  onDuplicate,
}: {
  campaign: Campaign;
  onEdit: (product: Product) => void;
  onDuplicate: (product: Product) => void;
}) {
  const newest = campaign.ads[0];

  return (
    <section className="border-b">
      {/* Only a bottom rule: the grid above already closed the previous section. */}
      <header className="flex h-12 items-center gap-3 border-b px-6">
        <h2 className="truncate text-sm font-medium">{campaign.domain}</h2>
        {newest && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className="ml-auto"
                onClick={() => onDuplicate(newest)}
                aria-label={`Add a variant to ${campaign.domain}`}
              >
                <Plus size={18} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Add a variant</TooltipContent>
          </Tooltip>
        )}
      </header>

      {/* No gap: each cell draws its own right and bottom rule. */}
      <div className="-mb-px grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {campaign.ads.map((ad) => (
          <ProductTile key={ad.id} product={ad} onEdit={onEdit} onDuplicate={onDuplicate} />
        ))}
      </div>
    </section>
  );
}
