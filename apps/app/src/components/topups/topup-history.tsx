import { project } from "@repo/config/project";
import type { TopupHistoryItem, TopupState } from "@repo/contracts/types";
import { Badge, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@repo/ui";
import { usd } from "../../lib/money";

const STATE_LABEL: Record<TopupState, string> = {
  pending: "Waiting for payment",
  paid: "Paid",
  refunded: "Refunded",
  abandoned: "Not paid",
};

/** A refunded or abandoned top-up is not a failure, so neither reads as an alarm. */
const STATE_VARIANT: Record<TopupState, "warning" | "success" | "danger" | "neutral"> = {
  pending: "warning",
  paid: "success",
  refunded: "neutral",
  abandoned: "neutral",
};

/**
 * Every top-up this member made. A refund is an admin's act, so the table only
 * reports one that happened: the member asks for it, and never presses it here.
 */
export function TopupHistory({ items }: { items: TopupHistoryItem[] }) {
  if (items.length === 0) return null;

  return (
    <section className="space-y-2">
      <h2 className="text-sm font-medium">Top-ups</h2>
      <div className="rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Bought</TableHead>
              <TableHead>{project.pointsName}</TableHead>
              <TableHead>Paid</TableHead>
              <TableHead>State</TableHead>
              <TableHead>Refund</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map(({ topup }) => (
              <TableRow key={topup.id}>
                <TableCell className="whitespace-nowrap">
                  {new Date(topup.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell className="tabular-nums">{topup.points.toLocaleString()}</TableCell>
                <TableCell className="tabular-nums">{usd(topup.usdCents)}</TableCell>
                <TableCell>
                  <Badge variant={STATE_VARIANT[topup.state]}>{STATE_LABEL[topup.state]}</Badge>
                </TableCell>
                <TableCell className="text-muted-foreground tabular-nums">
                  {topup.state === "refunded" ? `${usd(topup.refundUsdCents ?? 0)} back` : "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </section>
  );
}
