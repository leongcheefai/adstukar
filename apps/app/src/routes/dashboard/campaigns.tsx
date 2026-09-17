import { Plus } from "@phosphor-icons/react";
import type { CampaignWithListings, Listing } from "@repo/contracts/types";
import { Button } from "@repo/ui";
import { useState } from "react";
import { CampaignFormDialog } from "../../components/campaigns/campaign-form-dialog";
import { CampaignSection } from "../../components/campaigns/campaign-section";
import { CampaignSummary } from "../../components/campaigns/campaign-summary";
import { ListingFormDialog } from "../../components/campaigns/listing-form-dialog";
import { RateTable } from "../../components/rate-table";
import { ScribbleArrow } from "../../components/scribble-arrow";
import { useCampaigns } from "../../lib/campaigns";

export function CampaignsPage() {
  const { data, isLoading } = useCampaigns();
  const campaigns = data ?? [];
  const [campaignOpen, setCampaignOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Listing | null>(null);
  const [duplicating, setDuplicating] = useState<Listing | null>(null);
  const [joining, setJoining] = useState<CampaignWithListings | null>(null);

  /** Every entry point clears the other two, so the dialog opens in one mode only. */
  function open(mode: {
    edit?: Listing | null;
    duplicate?: Listing | null;
    campaign?: CampaignWithListings | null;
  }) {
    setEditing(mode.edit ?? null);
    setDuplicating(mode.duplicate ?? null);
    setJoining(mode.campaign ?? null);
    setFormOpen(true);
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Campaigns</h1>

      <CampaignSummary />

      {/* What a play will cost, before the first campaign exists. The same rows
          stand on the Devices page as what a play pays, so a member who does
          both reads one table twice. */}
      <RateTable side="advertiser" />

      {/* The add control sits under the last card, on the grid's right edge.
          One action, so it opens the campaign dialog on the press. A new listing
          belongs to a campaign, so its own control lives in that campaign's
          grid instead. */}
      <div className="flex justify-end">
        <Button
          size="icon"
          onClick={() => setCampaignOpen(true)}
          aria-label="New campaign"
          className="size-11 rounded-full"
        >
          <Plus size={20} />
        </Button>
      </div>

      {/* First run. The cluster sits under the add button, so the arrow runs
          up into the control it names. */}
      {!isLoading && campaigns.length === 0 && (
        <div className="flex justify-center pt-0 pb-28 sm:justify-end">
          {/* items-end puts the sentence on the arrow's tail. The 6px shift
              moves the whole cluster left of the button. */}
          <div className="flex items-end gap-2 sm:mr-[6px]">
            {/* The tail is at (6,252) of the 200x260 viewBox, so it sits 3px
                above the arrow's bottom edge. The last line's glyphs stop
                about 5px above the text box's own bottom, because text-lg
                carries 5px of half-leading. The drop closes both gaps and
                carries the sentence down onto the tail's own run. */}
            <p className="-mb-[26px] max-w-[15rem] text-center text-lg text-balance text-muted-foreground">
              No campaign yet. Create your first campaign.
            </p>

            {/* The tip must sit under the button's centre. The tip is at
                (182,34) of the 200x260 viewBox, which is 67px across a 74px
                arrow, so it stands 7px in from the arrow's right edge. The 44px
                button is centred 22px in from the same edge, so the 15px pull
                lines the two up. The arrow hides below sm, where the sentence
                centres alone. */}
            <ScribbleArrow className="hidden h-24 w-[74px] shrink-0 text-muted-foreground/45 sm:mr-[15px] sm:block" />
          </div>
        </div>
      )}

      {campaigns.length > 0 && (
        <div className="-mx-6 border-t">
          {campaigns.map((item) => (
            <CampaignSection
              key={item.campaign.id}
              item={item}
              onEdit={(listing) => open({ edit: listing })}
              onDuplicate={(listing) => open({ duplicate: listing })}
              onAddListing={(target) => open({ campaign: target })}
            />
          ))}
        </div>
      )}

      <CampaignFormDialog
        open={campaignOpen}
        onOpenChange={setCampaignOpen}
        takenDomains={campaigns.map((c) => c.campaign.domain)}
      />

      <ListingFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        listing={editing}
        duplicateOf={duplicating}
        campaign={joining}
      />
    </div>
  );
}
