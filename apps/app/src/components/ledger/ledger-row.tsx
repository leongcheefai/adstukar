import type { LedgerEntry, LedgerReason, LedgerState } from "@repo/contracts/types";
import { Badge, TableCell, TableRow } from "@repo/ui";

/** Shared by the Ledger page and the Overview summary, so the two cannot drift. */
export const REASON_TEXT: Record<LedgerReason, string> = {
  earn: "Impression shown on your site",
  spend: "Your card shown elsewhere",
  grant: "Grant",
  expiry: "Expired after 12 months",
  void: "Voided by an admin",
};

export function stateVariant(state: LedgerState): "success" | "warning" | "neutral" {
  if (state === "settled") return "success";
  if (state === "pending") return "warning";
  return "neutral";
}

export function LedgerAmount({ delta }: { delta: number }) {
  return (
    <span
      className={`font-mono tabular-nums ${delta > 0 ? "text-[color:var(--success-500)]" : ""}`}
    >
      {delta > 0 ? `+${delta}` : delta}
    </span>
  );
}

export function LedgerRow({ entry, compact = false }: { entry: LedgerEntry; compact?: boolean }) {
  const dimmed = entry.state === "pending";
  return (
    <TableRow className={dimmed ? "text-muted-foreground" : undefined}>
      <TableCell className="whitespace-nowrap font-mono text-xs">
        {compact
          ? new Date(entry.createdAt).toLocaleDateString()
          : new Date(entry.createdAt).toLocaleString()}
      </TableCell>
      <TableCell>
        <span className="font-medium capitalize">{entry.reason}</span>
        <span className="block text-xs text-muted-foreground">{REASON_TEXT[entry.reason]}</span>
      </TableCell>
      <TableCell>
        <Badge variant={stateVariant(entry.state)}>{entry.state}</Badge>
      </TableCell>
      <TableCell className="text-right">
        <LedgerAmount delta={entry.delta} />
      </TableCell>
      {!compact && (
        <TableCell className="font-mono text-xs text-muted-foreground">
          {entry.impressionId
            ? entry.impressionId.slice(0, 8)
            : (entry.relatedEntryId?.slice(0, 8) ?? "—")}
        </TableCell>
      )}
    </TableRow>
  );
}
