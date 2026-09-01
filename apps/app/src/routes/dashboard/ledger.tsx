import { BookOpen } from "@phosphor-icons/react";
import type { LedgerEntry, LedgerReason, LedgerState } from "@repo/contracts/types";
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
import { useState } from "react";
import { LedgerRow } from "../../components/ledger/ledger-row";
import { useLedger } from "../../lib/ledger";

const REASONS: { value: LedgerReason | "all"; label: string }[] = [
  { value: "all", label: "All reasons" },
  { value: "earn", label: "Earn" },
  { value: "spend", label: "Spend" },
  { value: "grant", label: "Grant" },
  { value: "expiry", label: "Expiry" },
  { value: "void", label: "Void" },
];

const STATES: { value: LedgerState | "all"; label: string }[] = [
  { value: "all", label: "All states" },
  { value: "pending", label: "Pending" },
  { value: "settled", label: "Settled" },
  { value: "void", label: "Void" },
];

export function LedgerPage() {
  const [reason, setReason] = useState<LedgerReason | "all">("all");
  const [state, setState] = useState<LedgerState | "all">("all");
  const query = useLedger({
    reason: reason === "all" ? undefined : reason,
    state: state === "all" ? undefined : state,
  });
  const items = query.data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Ledger</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Every point movement. Balances are always the sum of this list.
          </p>
        </div>

        {/* The visible value names the filter, so no separate label is needed. */}
        <div className="flex shrink-0 flex-wrap items-center gap-2">
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
        </div>
      </div>

      {query.isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}

      {!query.isLoading && items.length === 0 && (
        <EmptyState
          icon={<BookOpen />}
          title="No entries"
          description="Points appear here once a product is approved or a placement serves."
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
                <TableHead className="text-right">Points</TableHead>
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
