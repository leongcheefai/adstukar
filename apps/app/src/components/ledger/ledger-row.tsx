import { economy } from "@repo/config/economy";
import { usd } from "@repo/config/money";
import type { LedgerEntry, LedgerLot, LedgerReason, LedgerState } from "@repo/contracts/types";
import { Badge, TableCell, TableRow, Tooltip, TooltipContent, TooltipTrigger } from "@repo/ui";

/** Shared by the Wallet page and the Overview summary, so the two cannot drift. */
export const REASON_TEXT: Record<LedgerReason, string> = {
  earn: "A listing played on your screen",
  spend: "Your listing played on a screen",
  fee: "The CapyAds fee on that play",
  grant: "Trial credit",
  topup: "Money you added",
  payout: "Money you cashed out",
  refund: "Money returned from an unspent top-up",
  expiry: `Expired after ${economy.expiryMonths} months`,
  void: "Voided by an admin",
};

/** What the lot lets the money do. The word alone does not say it. */
export const LOT_TEXT: Record<LedgerLot, string> = {
  bought: "Bought · refundable, never expires",
  earned: `Earned · withdrawable after ${economy.payout.holdDays} days`,
  granted: "Trial credit · never leaves as cash",
};

export function stateVariant(state: LedgerState): "success" | "warning" | "neutral" {
  if (state === "settled") return "success";
  if (state === "pending") return "warning";
  return "neutral";
}

/** The column header names the unit once; a sign on every row is enough. */
export function LedgerAmount({ delta }: { delta: number }) {
  return (
    <span
      className={`font-mono tabular-nums ${delta > 0 ? "text-[color:var(--success-500)]" : ""}`}
    >
      {delta > 0 ? `+${usd(delta)}` : usd(delta)}
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
      {/* The compact table on Overview has four columns and no room for this. */}
      {!compact && (
        <TableCell>
          <Tooltip>
            <TooltipTrigger className="cursor-help capitalize">{entry.lot}</TooltipTrigger>
            <TooltipContent>{LOT_TEXT[entry.lot]}</TooltipContent>
          </Tooltip>
        </TableCell>
      )}
      <TableCell>
        <LedgerAmount delta={entry.delta} />
      </TableCell>
      {!compact && (
        <TableCell className="font-mono text-xs text-muted-foreground">
          {entry.playId ? entry.playId.slice(0, 8) : (entry.relatedEntryId?.slice(0, 8) ?? "—")}
        </TableCell>
      )}
    </TableRow>
  );
}
