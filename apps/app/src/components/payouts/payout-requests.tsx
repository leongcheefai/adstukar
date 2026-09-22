import { paid, usdCents } from "@repo/config/money";
import type { PayoutRequest, PayoutState } from "@repo/contracts/types";
import { Badge, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@repo/ui";

const STATE_LABEL: Record<PayoutState, string> = {
  requested: "Under review",
  paid: "Paid",
  rejected: "Refused",
};

// `danger` rather than `destructive`: it is the tinted twin of `success`, and a
// solid red shouts next to a tinted green in the same row of figures.
const STATE_VARIANT: Record<PayoutState, "warning" | "success" | "danger"> = {
  requested: "warning",
  paid: "success",
  rejected: "danger",
};

/**
 * Every payout this member asked for. A refused one keeps its reason on the row,
 * because the money came back and nothing else on the ledger says why.
 */
export function PayoutRequests({ requests }: { requests: PayoutRequest[] }) {
  if (requests.length === 0) return null;

  return (
    <section className="space-y-2">
      <h2 className="text-sm font-medium">Payouts</h2>
      <div className="rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Asked</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>State</TableHead>
              <TableHead>Note</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {requests.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="whitespace-nowrap">
                  {new Date(row.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell className="tabular-nums">{usdCents(row.usdCents)}</TableCell>
                <TableCell>
                  <Badge variant={STATE_VARIANT[row.state]}>{STATE_LABEL[row.state]}</Badge>
                </TableCell>
                <TableCell data-usertext className="text-muted-foreground">
                  {/* A paid row says what landed, in the currency it landed in, and at what rate. */}
                  {row.paidCents !== null && row.paidCurrency !== null
                    ? `${paid(row.paidCents, row.paidCurrency)} sent${row.fxRate ? ` at ${Number(row.fxRate)} per USD` : ""}`
                    : (row.rejectionReason ?? row.reference ?? "—")}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </section>
  );
}
