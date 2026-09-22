import { Megaphone, Plus } from "@phosphor-icons/react";
import {
  Button,
  Card,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui";
import { useMemo, useState } from "react";
import { Navigate, useNavigate, useSearchParams } from "react-router";
import { CampaignSummary } from "../../components/campaigns/campaign-summary";
import { SlotRow } from "../../components/campaigns/slot-row";
import { SlotTicker } from "../../components/campaigns/slot-ticker";
import { TopUpDialog } from "../../components/topups/topup-dialog";
import { type SlotPosition, type SlotStatus, isOver, slotOf } from "../../lib/slots";
import { useSlotLoop, useSlots } from "../../lib/slots-api";
import { openWhenReady, useTopups } from "../../lib/topups";

const BOOK = "/dashboard/campaigns/book";

type Filter = "all" | "running" | "review" | "ended";

/**
 * Which slots a menu item holds. Review takes every slot that waits on somebody: the
 * reviewer, or the member's own next step.
 */
const FILTERS: { key: Filter; label: string; holds: SlotStatus[] | null }[] = [
  { key: "all", label: "All", holds: null },
  { key: "running", label: "Running", holds: ["running"] },
  { key: "review", label: "In review", holds: ["review", "action", "rejected"] },
  { key: "ended", label: "Ended", holds: ["ended", "refunded"] },
];

export function CampaignsPage() {
  const { data, isLoading } = useSlots();
  const { data: loop } = useSlotLoop();
  const topupsQuery = useTopups();
  const topups = topupsQuery.data;
  const [buyOpen, setBuyOpen] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const wantsNew = params.get("new") === "campaign";

  const slots = useMemo(() => (data ?? []).map((item) => slotOf(item)), [data]);
  const bands = loop?.bands ?? [];
  const minePositions = useMemo(
    () => new Set(slots.filter((slot) => !isOver(slot.status)).map((slot) => slot.position)),
    [slots],
  );
  const holds = FILTERS.find((f) => f.key === filter)?.holds ?? null;
  const shown = holds ? slots.filter((slot) => holds.includes(slot.status)) : slots;

  function book(position: SlotPosition | null = null) {
    navigate(position === null ? BOOK : `${BOOK}?slot=${position}`);
  }

  // Links people saved before the booking form became a page still work.
  if (wantsNew) return <Navigate to={BOOK} replace />;

  // Nothing is sold out until the loop has answered.
  const soldOut = loop !== undefined && loop.availability.left === 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Campaigns</h1>
          <p className="text-sm text-muted-foreground">
            Book a slot on the ticker, and see how your ads do.
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => book()} disabled={soldOut}>
            <Plus size={16} />
            {soldOut ? "Every slot is taken" : "Book a slot"}
          </Button>
        </div>
      </div>

      <section className="space-y-2">
        <h2 className="text-base font-semibold tracking-tight">Pick your slot</h2>
        <SlotTicker bands={bands} minePositions={minePositions} onPick={book} />
      </section>

      <CampaignSummary
        onAddFunds={() =>
          openWhenReady(
            topupsQuery,
            () => setBuyOpen(true),
            "We could not load the top-up options. Try again in a moment.",
          )
        }
      />

      <Card className="gap-0 overflow-hidden p-0">
        <header className="flex items-center justify-between gap-3 border-b px-6 py-4">
          <h2 className="text-base font-semibold tracking-tight">Campaign Tracker</h2>
          <Select value={filter} onValueChange={(next) => setFilter(next as Filter)}>
            <SelectTrigger aria-label="Show slots by state" className="w-36 shrink-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="end">
              {FILTERS.map((f) => (
                <SelectItem key={f.key} value={f.key}>
                  {f.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </header>

        {isLoading ? (
          <div className="space-y-3 px-6 py-5" aria-hidden="true">
            <span className="block h-10 animate-pulse rounded-md bg-muted" />
            <span className="block h-10 animate-pulse rounded-md bg-muted" />
          </div>
        ) : shown.length > 0 ? (
          <ul className="divide-y">
            {shown.map((slot) => (
              <SlotRow
                key={slot.item.slot.id}
                slot={slot}
                position={isOver(slot.status) ? null : slot.position}
                onEdit={(target) =>
                  navigate(`/dashboard/campaigns/${target.item.campaign.id}/edit`)
                }
              />
            ))}
          </ul>
        ) : slots.length > 0 ? (
          <p className="px-6 py-12 text-center text-sm text-muted-foreground">
            No slot is in this state.
          </p>
        ) : (
          <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
            <Megaphone size={28} className="text-muted-foreground" aria-hidden="true" />
            <div className="space-y-1">
              <p className="text-base font-medium">No slot yet</p>
              {soldOut && (
                <p className="max-w-sm text-sm text-balance text-muted-foreground">
                  Every slot is taken now. A slot opens when a term ends.
                </p>
              )}
            </div>
            <Button onClick={() => book()} disabled={soldOut}>
              Book a slot
            </Button>
          </div>
        )}
      </Card>

      {topups && <TopUpDialog overview={topups} open={buyOpen} onOpenChange={setBuyOpen} />}
    </div>
  );
}
