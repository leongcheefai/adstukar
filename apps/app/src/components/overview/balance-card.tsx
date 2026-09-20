import { ArrowRight, Info } from "@phosphor-icons/react";
import { economy, pointsToUsdCents } from "@repo/config/economy";
import type { PayoutOverview, StatsOverview } from "@repo/contracts/types";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@repo/ui";
import { Link } from "react-router";
import { pointsUsd, usd } from "../../lib/money";

/**
 * One sum. The note that says which sum it is sits behind an info mark: the
 * label and the figure are what a member reads each visit, and the note is
 * what they read once.
 */
function Figure({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 p-6">
      <div className="min-w-0 space-y-2">
        <div className="flex h-3.5 items-center gap-1.5 text-muted-foreground">
          <p data-slot="label">{label}</p>
          <Tooltip>
            {/* The mark is 14px; the ::before takes the target to 40px. */}
            <TooltipTrigger
              aria-label={`About ${label.toLowerCase()}`}
              className="relative cursor-help rounded-full before:absolute before:-inset-[13px] before:content-[''] focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              <Info size={14} aria-hidden="true" />
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">{note}</TooltipContent>
          </Tooltip>
        </div>
        <p className="text-4xl font-normal tracking-tight tabular-nums">{value}</p>
      </div>
    </div>
  );
}

/**
 * What the member holds, what may leave, and what already left.
 *
 * The three figures are three different sums, and the notes say which. The
 * total is the whole wallet. Available is only the earned funds that served
 * the hold. The three figures are one size, because none of them leads.
 */
export function BalanceCard({
  stats,
  payouts,
}: {
  stats: StatsOverview;
  /** Loads apart from the stats. The figures that need it wait for it. */
  payouts: PayoutOverview | undefined;
}) {
  const total = stats.balance.settled + stats.balance.pending;
  const minimum = payouts?.minimumPoints ?? economy.payout.minimumPoints;
  const available = payouts?.withdrawable ?? 0;
  const paidCents = (payouts?.requests ?? [])
    .filter((request) => request.state === "paid")
    .reduce((sum, request) => sum + request.usdCents, 0);

  return (
    <Card className="h-full gap-0 py-0">
      {/* A fixed height, so the header is the same with the button and without
          it, and the same as the card beside it. */}
      <CardHeader className="flex h-16 flex-row items-center justify-between gap-3 border-b px-6 py-0 [.border-b]:pb-0">
        <CardTitle className="text-base">Balance</CardTitle>
        {/* Only while there is nowhere to pay. Once the details are on file the
            button goes, and the Wallet owns the cash-out. */}
        {payouts && !payouts.account && (
          <Button
            asChild
            size="sm"
            className="bg-[color:var(--on-air)] text-[color:var(--on-air-foreground)] hover:bg-[color:var(--on-air)]/90"
          >
            <Link to="/dashboard/wallet">
              Set up payouts
              <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
        )}
      </CardHeader>
      <CardContent className="grid flex-1 gap-0 divide-y p-0 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        <Figure label="Total earning" value={pointsUsd(total)} note="Pending plus settled funds" />
        <Figure
          label="Available"
          value={payouts ? usd(pointsToUsdCents(available)) : "—"}
          note="Ready to cash out"
        />
        <Figure
          label="Cash out"
          value={payouts ? usd(paidCents) : "—"}
          note={`Minimum payout ${pointsUsd(minimum)}`}
        />
      </CardContent>
    </Card>
  );
}
