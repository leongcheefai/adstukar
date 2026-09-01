import {
  Button,
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui";
import { Link } from "react-router";
import { useLedger } from "../../lib/ledger";
import { LedgerRow } from "../ledger/ledger-row";

/** How many movements read as "recent" without turning the page into the ledger. */
const RECENT_COUNT = 6;

export function RecentLedger() {
  const query = useLedger({});
  const items = (query.data?.pages[0]?.items ?? []).slice(0, RECENT_COUNT);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Recent activity</CardTitle>
        <CardDescription>The last {RECENT_COUNT} point movements</CardDescription>
        <CardAction>
          <Button asChild variant="ghost" size="sm">
            <Link to="/dashboard/ledger">View ledger</Link>
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        {query.isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}

        {!query.isLoading && items.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Nothing yet. Points appear here once your card starts serving.
          </p>
        )}

        {items.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>When</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>State</TableHead>
                <TableHead className="text-right">Points</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((entry) => (
                <LedgerRow key={entry.id} entry={entry} compact />
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
