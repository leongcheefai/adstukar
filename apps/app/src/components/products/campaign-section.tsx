import { Plus, SealCheck } from "@phosphor-icons/react";
import type { Product } from "@repo/contracts/types";
import { Tooltip, TooltipContent, TooltipTrigger } from "@repo/ui";
import {
  type Campaign,
  MAX_ADS_PER_CAMPAIGN,
  isVerified,
  keepCampaignAfterLastAd,
} from "../../lib/campaigns";
import { CampaignActions } from "./campaign-actions";
import { ProductTile } from "./product-tile";

/**
 * An empty slot in the ad grid.
 *
 * It is the only way to add an ad, and it stands where the new ad will appear.
 * Same rules and same min height as a tile, so a row of slots measures a row of
 * ads and the grid keeps one unbroken set of lines.
 */
function AddAdCell({
  campaign,
  onAddAd,
}: {
  campaign: Campaign;
  onAddAd: (campaign: Campaign) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onAddAd(campaign)}
      aria-label={`Write an ad for ${campaign.name}`}
      className="flex min-h-56 items-center justify-center border-r border-b text-muted-foreground/60 transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/40"
    >
      <Plus size={24} />
    </button>
  );
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
  const verified = isVerified(campaign);
  // One slot per ad the campaign may still hold. A full campaign shows none.
  // Each slot is keyed by the space it fills, so adding an ad shortens the list
  // from the front and the slots that stay keep their identity.
  const freeSlots = Array.from(
    { length: Math.max(0, MAX_ADS_PER_CAMPAIGN - campaign.ads.length) },
    (_, index) => `${campaign.domain}#${campaign.ads.length + index}`,
  );

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

        <CampaignActions campaign={campaign} />
      </header>

      {/* No gap: each cell draws its own right and bottom rule. */}
      <div className="-mb-px grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {campaign.ads.map((ad) => (
          <ProductTile
            key={ad.id}
            product={ad}
            onEdit={onEdit}
            onDuplicate={onDuplicate}
            onDeleted={(deleted) => keepCampaignAfterLastAd(campaign, deleted)}
            canDuplicate={freeSlots.length > 0}
          />
        ))}

        {/* The free spaces, drawn. Four cells always stand in the row, so the
            campaign shows both what it holds and what it can still hold. */}
        {freeSlots.map((slot) => (
          <AddAdCell key={slot} campaign={campaign} onAddAd={onAddAd} />
        ))}
      </div>
    </section>
  );
}
