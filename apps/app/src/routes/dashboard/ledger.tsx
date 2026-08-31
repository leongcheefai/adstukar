import type { LedgerEntry, LedgerReason, LedgerState } from "@repo/contracts/types";
import {
  Badge,
  Button,
  EmptyState,
  Label,
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
import { BookOpen } from "lucide-react";
import { useState } from "react";
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

const REASON_TEXT: Record<LedgerReason, string> = {
  earn: "Impression shown on your site",
  spend: "Your card shown elsewhere",
  grant: "Grant",
  expiry: "Expired after 12 months",
  void: "Voided by an admin",
};

function stateVariant(state: LedgerState): "success" | "warning" | "neutral" {
  if (state === "settled") return "success";
  if (state === "pending") return "warning";
  return "neutral";
}

function Row({ entry }: { entry: LedgerEntry }) {
  const dimmed = entry.state === "pending";
  return (
    <TableRow className={dimmed ? "text-muted-foreground" : undefined}>
      <TableCell className="whitespace-nowrap font-mono text-xs">
        {new Date(entry.createdAt).toLocaleString()}
      </TableCell>
      <TableCell>
        <span className="font-medium capitalize">{entry.reason}</span>
        <span className="block text-xs text-muted-foreground">{REASON_TEXT[entry.reason]}</span>
      </TableCell>
      <TableCell>
        <Badge variant={stateVariant(entry.state)}>{entry.state}</Badge>
      </TableCell>
      <TableCell
        className={`text-right font-mono tabular-nums ${entry.delta > 0 ? "text-[color:var(--success-500)]" : ""}`}
      >
        {entry.delta > 0 ? `+${entry.delta}` : entry.delta}
      </TableCell>
      <TableCell className="font-mono text-xs text-muted-foreground">
        {entry.impressionId
          ? entry.impressionId.slice(0, 8)
          : (entry.relatedEntryId?.slice(0, 8) ?? "—")}
      </TableCell>
    </TableRow>
  );
}

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
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Ledger</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Every point movement. Balances are always the sum of this list.
        </p>
      </div>

      <div className="flex flex-wrap gap-4">
        <div className="space-y-1.5">
          <Label>Reason</Label>
          <Select value={reason} onValueChange={(v) => setReason(v as LedgerReason | "all")}>
            <SelectTrigger className="w-44">
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
        </div>
        <div className="space-y-1.5">
          <Label>State</Label>
          <Select value={state} onValueChange={(v) => setState(v as LedgerState | "all")}>
            <SelectTrigger className="w-44">
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
                <Row key={entry.id} entry={entry} />
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
