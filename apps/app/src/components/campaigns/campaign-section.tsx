import { Plus, SealCheck } from "@phosphor-icons/react";
import { economy } from "@repo/config/economy";
import type { CampaignWithListings, Listing } from "@repo/contracts/types";
import { Badge, Tooltip, TooltipContent, TooltipTrigger } from "@repo/ui";
import { CampaignActions } from "./campaign-actions";
import { ListingTile } from "./listing-tile";

/**
 * An empty slot in the listing grid.
 *
 * It is the only way to add a listing, and it stands where the new listing will
 * appear. Same rules and same min height as a tile, so a row of slots measures a
 * row of listings and the grid keeps one unbroken set of lines.
 */
function AddListingCell({
  item,
  onAddListing,
}: {
  item: CampaignWithListings;
  onAddListing: (item: CampaignWithListings) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onAddListing(item)}
      aria-label={`Write a listing for ${item.campaign.name}`}
      className="flex min-h-56 items-center justify-center border-r border-b text-muted-foreground/60 transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/40"
    >
      <Plus size={24} />
    </button>
  );
}

const STATE_LABEL: Record<CampaignWithListings["campaign"]["state"], string> = {
  draft: "Draft",
  active: "Running",
  paused: "Paused",
  archived: "Archived",
};

/**
 * Why the system stopped a campaign, and what starts it again. A campaign the
 * advertiser paused carries no reason, so it shows the plain badge.
 */
const PAUSE_REASON: Record<NonNullable<CampaignWithListings["campaign"]["pauseReason"]>, string> = {
  budget: "Today's budget is spent. This campaign runs again tomorrow.",
  balance: "Your CapyPoints ran out. This campaign runs again once you add points.",
};

export function CampaignSection({
  item,
  onEdit,
  onDuplicate,
  onAddListing,
}: {
  item: CampaignWithListings;
  onEdit: (listing: Listing) => void;
  onDuplicate: (listing: Listing) => void;
  /** Starts a new listing on this campaign with an empty tagline. */
  onAddListing: (item: CampaignWithListings) => void;
}) {
  const { campaign, listings, spentToday } = item;
  const verified = campaign.verifiedAt !== null;

  // One slot per listing the campaign may still hold. A full campaign shows none.
  // Each slot is keyed by the space it fills, so adding a listing shortens the
  // list from the front and the slots that stay keep their identity.
  const freeSlots = Array.from(
    { length: Math.max(0, economy.maxListingsPerCampaign - listings.length) },
    (_, index) => `${campaign.id}#${listings.length + index}`,
  );

  return (
    <section className="border-b">
      {/* Only a bottom rule: the grid above already closed the previous section. */}
      <header className="flex h-14 items-center gap-2 border-b px-6">
        {/* The domain moved into the tooltip. It is the campaign's identity, so it
            was on screen once per campaign saying what the name already said. */}
        <Tooltip>
          <TooltipTrigger asChild>
            <h2 className="min-w-0 shrink cursor-default truncate text-lg font-semibold tracking-tight">
              {campaign.name}
            </h2>
          </TooltipTrigger>
          <TooltipContent className="font-mono text-xs">{campaign.domain}</TooltipContent>
        </Tooltip>

        {/* Only when the domain really is verified. A seal on an unverified
            campaign would be a claim we cannot back. */}
        {verified && (
          <SealCheck
            size={18}
            weight="fill"
            aria-label="Verified domain"
            className="shrink-0 text-primary"
          />
        )}

        {campaign.pauseReason ? (
          <Tooltip>
            <TooltipTrigger className="cursor-help">
              <Badge variant="warning" dot>
                {STATE_LABEL[campaign.state]}
              </Badge>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              {PAUSE_REASON[campaign.pauseReason]}
            </TooltipContent>
          </Tooltip>
        ) : (
          <Badge variant={campaign.state === "active" ? "success" : "neutral"} dot>
            {STATE_LABEL[campaign.state]}
          </Badge>
        )}

        {/* What the campaign has spent against what it may spend. Without it the
            budget is a number nobody can act on. */}
        <p className="hidden shrink-0 text-xs tabular-nums text-muted-foreground sm:block">
          {spentToday.toLocaleString()} / {campaign.dailyBudget.toLocaleString()} today
        </p>

        <CampaignActions item={item} />
      </header>

      {/* No gap: each cell draws its own right and bottom rule. */}
      <div className="-mb-px grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {listings.map((listing) => (
          <ListingTile
            key={listing.id}
            listing={listing}
            campaign={campaign}
            onEdit={onEdit}
            onDuplicate={onDuplicate}
            canDuplicate={freeSlots.length > 0}
          />
        ))}

        {/* The free spaces, drawn. Four cells always stand in the row, so the
            campaign shows both what it holds and what it can still hold. */}
        {freeSlots.map((slot) => (
          <AddListingCell key={slot} item={item} onAddListing={onAddListing} />
        ))}
      </div>
    </section>
  );
}
