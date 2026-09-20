import { ArrowLeft } from "@phosphor-icons/react";
import { Button } from "@repo/ui";
import { useMemo, useState } from "react";
import { Link, Navigate, useNavigate, useParams, useSearchParams } from "react-router";
import { SlotForm } from "../../components/campaigns/slot-form";
import { BuyPointsDialog } from "../../components/topups/buy-points-dialog";
import { useCampaigns } from "../../lib/campaigns";
import {
  type SlotPosition,
  loopOf,
  readSlotPositions,
  slotAvailability,
  slotOf,
  writeSlotPosition,
} from "../../lib/slots";
import { useStats } from "../../lib/stats";
import { useTopups } from "../../lib/topups";

const CAMPAIGNS = "/dashboard/campaigns";

/** The `?slot=` a press on the loop sent along. Anything that is not a whole number is no pick. */
function pickOf(raw: string | null): SlotPosition | null {
  const position = Number(raw);
  return raw !== null && Number.isInteger(position) && position >= 1 ? position : null;
}

/**
 * Books a slot, or edits one: `/dashboard/campaigns/book?slot=7` and
 * `/dashboard/campaigns/:campaignId/edit`. The page gathers what the form
 * needs and leaves for Campaigns when the form is done.
 */
export function SlotBookPage() {
  const { campaignId } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { data, isLoading } = useCampaigns();
  const { data: stats } = useStats();
  const { data: topups } = useTopups();
  const [buyOpen, setBuyOpen] = useState(false);
  const [picks, setPicks] = useState(readSlotPositions);

  const slots = useMemo(() => (data ?? []).map((item) => slotOf(item)), [data]);
  const bands = useMemo(() => loopOf(slots, picks), [slots, picks]);
  const editing = campaignId
    ? (slots.find((slot) => slot.item.campaign.id === campaignId) ?? null)
    : null;

  // An edit link to a slot this member does not hold goes back to the list.
  if (campaignId && !isLoading && !editing) return <Navigate to={CAMPAIGNS} replace />;

  return (
    <div className="space-y-4">
      <Button asChild variant="ghost" size="sm" className="-ml-2 text-muted-foreground">
        <Link to={CAMPAIGNS}>
          <ArrowLeft aria-hidden="true" />
          Campaigns
        </Link>
      </Button>

      {isLoading ? (
        <div className="space-y-3" aria-hidden="true">
          <span className="block h-8 w-48 animate-pulse rounded-md bg-muted" />
          <span className="block h-96 animate-pulse rounded-xl bg-muted" />
        </div>
      ) : (
        <SlotForm
          onDone={() => navigate(CAMPAIGNS)}
          slot={editing}
          bands={bands}
          position={pickOf(params.get("slot"))}
          onBooked={(id, position) => {
            writeSlotPosition(id, position);
            setPicks(readSlotPositions());
          }}
          takenDomains={slots
            .filter((slot) => slot.status !== "ended")
            .map((slot) => slot.item.campaign.domain)}
          balance={stats?.balance.settled}
          slotsOpen={slotAvailability(slots).left > 0}
          onAddFunds={() => setBuyOpen(true)}
        />
      )}

      {topups && <BuyPointsDialog overview={topups} open={buyOpen} onOpenChange={setBuyOpen} />}
    </div>
  );
}
