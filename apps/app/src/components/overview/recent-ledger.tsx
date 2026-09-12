import { Receipt } from "@phosphor-icons/react";
import {
  Button,
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  EmptyState,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui";
import { Link } from "react-router";
import { useLedger } from "../../lib/ledger";
import { LedgerRow } from "../ledger/ledger-row";

/** How many movements read as "recent" without turning the page into the ledger. */
const RECENT_COUNT = 6;

const SKELETON_ROWS = Array.from({ length: RECENT_COUNT }, (_, i) => `skeleton-${i}`);

/**
 * A row the exact height of a compact LedgerRow.
 *
 * The reason cell is what sets that height: a 20px line for the reason and a
 * 16px line for its explanation. Matching both keeps the card from growing when
 * the real rows arrive.
 */
function LedgerRowSkeleton() {
  return (
    <TableRow className="hover:bg-transparent">
      <TableCell>
        <span className="block h-4 w-20 animate-pulse rounded-sm bg-muted" />
      </TableCell>
      <TableCell>
        <span className="flex h-5 items-center">
          <span className="block h-3.5 w-24 animate-pulse rounded-sm bg-muted" />
        </span>
        <span className="flex h-4 items-center">
          <span className="block h-3 w-44 animate-pulse rounded-sm bg-muted" />
        </span>
      </TableCell>
      <TableCell>
        <span className="block h-[22px] w-16 animate-pulse rounded-[var(--radius-md)] bg-muted" />
      </TableCell>
      <TableCell>
        <span className="inline-block h-4 w-10 animate-pulse rounded-sm bg-muted" />
      </TableCell>
    </TableRow>
  );
}

export function RecentLedger() {
  const query = useLedger({});
  const items = (query.data?.pages[0]?.items ?? []).slice(0, RECENT_COUNT);
  const isEmpty = !query.isPending && !query.isError && items.length === 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Recent activity</CardTitle>
        <CardDescription>Your most recent CapyPoint movements</CardDescription>
        <CardAction>
          <Button asChild variant="ghost" size="sm">
            <Link to="/dashboard/ledger">View all</Link>
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-4">
        {query.isError && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-destructive/40 px-4 py-3">
            <p className="text-sm text-destructive">Could not load recent activity.</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => query.refetch()}
              disabled={query.isFetching}
            >
              {query.isFetching ? "Retrying…" : "Try again"}
            </Button>
          </div>
        )}

        {isEmpty && (
          <EmptyState
            icon={<Receipt />}
            title="No movements yet"
            description="CapyPoints land here once a listing plays on a screen."
            action={
              <Button asChild size="sm">
                <Link to="/">Start CapyTV</Link>
              </Button>
            }
          />
        )}

        {/* Stale rows stay on screen behind the banner; a failed refresh is
            not a reason to take away what already loaded. */}
        {(query.isPending || items.length > 0) && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>When</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>State</TableHead>
                <TableHead>CapyPoints</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody aria-busy={query.isPending}>
              {query.isPending
                ? SKELETON_ROWS.map((key) => <LedgerRowSkeleton key={key} />)
                : items.map((entry) => <LedgerRow key={entry.id} entry={entry} compact />)}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
