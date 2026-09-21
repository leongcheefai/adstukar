import { ArrowLeft } from "@phosphor-icons/react";
import { Button } from "@repo/ui";
import { useMemo, useState } from "react";
import { Link, Navigate, useNavigate, useParams, useSearchParams } from "react-router";
import { SlotForm } from "../../components/campaigns/slot-form";
import { TopUpDialog } from "../../components/topups/topup-dialog";
import { type SlotPosition, slotOf } from "../../lib/slots";
import { useSlotLoop, useSlots } from "../../lib/slots-api";
import { useStats } from "../../lib/stats";
import { openWhenReady, useTopups } from "../../lib/topups";

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
  const { data, isLoading: slotsLoading } = useSlots();
  const { data: loop } = useSlotLoop();
  const { data: stats } = useStats();
  const topupsQuery = useTopups();
  const topups = topupsQuery.data;
  const [buyOpen, setBuyOpen] = useState(false);

  const slots = useMemo(() => (data ?? []).map((item) => slotOf(item)), [data]);
  const bands = loop?.bands ?? [];
  const isLoading = slotsLoading || loop === undefined;
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
          takenDomains={slots
            .filter((slot) => slot.status !== "ended")
            .map((slot) => slot.item.campaign.domain)}
          balance={stats?.balance.settled}
          slotsOpen={(loop?.availability.left ?? 0) > 0}
          onAddFunds={() =>
            openWhenReady(
              topupsQuery,
              () => setBuyOpen(true),
              "We could not load the top-up options. Try again in a moment.",
            )
          }
        />
      )}

      {topups && <TopUpDialog overview={topups} open={buyOpen} onOpenChange={setBuyOpen} />}
    </div>
  );
}
