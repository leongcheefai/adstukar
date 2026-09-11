import { Coins } from "@phosphor-icons/react";
import { project } from "@repo/config/project";
import type { LedgerLot, LedgerReason, LedgerState } from "@repo/contracts/types";
import {
  Badge,
  Button,
  EmptyState,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import { toast } from "sonner";
import { LedgerRow } from "../../components/ledger/ledger-row";
import { PointsSummary } from "../../components/ledger/points-summary";
import { PayoutRequests } from "../../components/payouts/payout-requests";
import { TopupHistory } from "../../components/topups/topup-history";
import { useLedger } from "../../lib/ledger";
import { usePayouts } from "../../lib/payouts";
import { useRefreshMoney, useTopups } from "../../lib/topups";

const REASONS: { value: LedgerReason | "all"; label: string }[] = [
  { value: "all", label: "All reasons" },
  { value: "earn", label: "Earn" },
  { value: "spend", label: "Spend" },
  { value: "fee", label: "Fee" },
  { value: "grant", label: "Grant" },
  { value: "topup", label: "Top-up" },
  { value: "payout", label: "Payout" },
  { value: "refund", label: "Refund" },
  { value: "expiry", label: "Expiry" },
  { value: "void", label: "Void" },
];

/** The lot decides what a point may do, so it filters beside the reason. */
const LOTS: { value: LedgerLot | "all"; label: string }[] = [
  { value: "all", label: "All lots" },
  { value: "bought", label: "Bought" },
  { value: "earned", label: "Earned" },
  { value: "granted", label: "Granted" },
];

const STATES: { value: LedgerState | "all"; label: string }[] = [
  { value: "all", label: "All states" },
  { value: "pending", label: "Pending" },
  { value: "settled", label: "Settled" },
  { value: "void", label: "Void" },
];

/**
 * Stripe sends the member back here after a checkout. The points arrive through
 * the webhook, not through this redirect, so the page says the payment landed
 * and asks for the balance again rather than claiming a number it cannot know.
 */
function useTopupReturn() {
  const [params, setParams] = useSearchParams();
  const refresh = useRefreshMoney();
  const outcome = params.get("topup");

  useEffect(() => {
    if (!outcome) return;
    if (outcome === "paid") {
      toast.success(`Payment received. Your ${project.pointsName} appear in a moment.`);
      refresh();
    }
    if (outcome === "cancelled") toast.info("Top-up cancelled. Nothing was charged.");
    // The message belongs to the return, not to the page: leaving it in the URL
    // would repeat it on every reload.
    params.delete("topup");
    setParams(params, { replace: true });
  }, [outcome, params, setParams, refresh]);
}

export function LedgerPage() {
  const { data: payouts } = usePayouts();
  const { data: topups } = useTopups();
  useTopupReturn();
  const [reason, setReason] = useState<LedgerReason | "all">("all");
  const [state, setState] = useState<LedgerState | "all">("all");
  const [lot, setLot] = useState<LedgerLot | "all">("all");
  const query = useLedger({
    reason: reason === "all" ? undefined : reason,
    state: state === "all" ? undefined : state,
    lot: lot === "all" ? undefined : lot,
  });
  const items = query.data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <div className="space-y-4">
      <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
        CapyPoints
        <Coins size={24} weight="fill" aria-hidden="true" className="text-primary" />
      </h1>

      <PointsSummary />

      <PayoutRequests requests={payouts?.requests ?? []} />

      {topups && <TopupHistory items={topups.items} refundWindowDays={topups.refundWindowDays} />}

      {/* On the list, not by the title: these change what the table below shows,
          and nothing above it. The visible value names each filter, so neither
          needs a separate label. */}
      <div className="flex flex-wrap items-center gap-2">
        <Select value={reason} onValueChange={(v) => setReason(v as LedgerReason | "all")}>
          <SelectTrigger className="w-40" aria-label="Filter by reason">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {REASONS.map((r) => (
              <SelectItem key={r.value} value={r.value}>
                {r.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={state} onValueChange={(v) => setState(v as LedgerState | "all")}>
          <SelectTrigger className="w-40" aria-label="Filter by state">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATES.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={lot} onValueChange={(v) => setLot(v as LedgerLot | "all")}>
          <SelectTrigger className="w-40" aria-label="Filter by lot">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {LOTS.map((l) => (
              <SelectItem key={l.value} value={l.value}>
                {l.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {query.isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}

      {!query.isLoading && items.length === 0 && (
        <EmptyState
          icon={<Coins />}
          title="No CapyPoints yet"
          description="CapyPoints appear here once a listing is approved or a device plays."
        />
      )}

      {items.length > 0 && (
        <div className="rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>When</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>State</TableHead>
                <TableHead>Lot</TableHead>
                <TableHead>CapyPoints</TableHead>
                <TableHead>Ref</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((entry) => (
                <LedgerRow key={entry.id} entry={entry} />
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {query.hasNextPage && (
        <Button
          variant="outline"
          onClick={() => query.fetchNextPage()}
          disabled={query.isFetchingNextPage}
        >
          {query.isFetchingNextPage ? "Loading…" : "Load more"}
        </Button>
      )}
    </div>
  );
}
