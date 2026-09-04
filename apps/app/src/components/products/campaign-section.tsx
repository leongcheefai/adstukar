import { SealCheck } from "@phosphor-icons/react";
import type { Product } from "@repo/contracts/types";
import { Tooltip, TooltipContent, TooltipTrigger } from "@repo/ui";
import { CampaignActions } from "./campaign-actions";
import { ProductTile } from "./product-tile";

export interface Campaign {
  /** The verified domain every ad in the group points at. */
  domain: string;
  /**
   * The product name the group's ads carry. There is no campaign table, so this
   * is the newest ad's name rather than a field of its own.
   */
  name: string;
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
    .map(([domain, group]) => {
      const ads = [...group].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      return { domain, name: ads[0]?.name ?? domain, ads };
    })
    .sort((a, b) => a.domain.localeCompare(b.domain));
}

export function CampaignSection({
  campaign,
  onEdit,
  onDuplicate,
  onAddAd,
}: {
  campaign: Campaign;
  onEdit: (product: Product) => void;
  onDuplicate: (product: Product) => void;
  /** Starts a new ad on this campaign's site with an empty tagline. */
  onAddAd: (campaign: Campaign) => void;
}) {
  // Every ad in the group shares one domain, so one verified ad verifies all.
  const verified = campaign.ads.some((ad) => ad.verifiedAt);

  return (
    <section className="border-b">
      {/* Only a bottom rule: the grid above already closed the previous section. */}
      <header className="flex h-14 items-center gap-2 border-b px-6">
        {/* The domain moved into the tooltip. It is the grouping key, so it was
            on screen once per campaign saying what the name already said. */}
        <Tooltip>
          <TooltipTrigger asChild>
            <h2 className="min-w-0 shrink cursor-default truncate text-lg font-semibold tracking-tight">
              {campaign.name}
            </h2>
          </TooltipTrigger>
          <TooltipContent className="font-mono text-xs">{campaign.domain}</TooltipContent>
        </Tooltip>

        {/* Only when the domain really is verified. A seal on an unverified
            campaign would be a claim the product cannot back. */}
        {verified && (
          <SealCheck
            size={18}
            weight="fill"
            aria-label="Verified domain"
            className="shrink-0 text-primary"
          />
        )}

        <CampaignActions campaign={campaign} onAddAd={onAddAd} />
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
