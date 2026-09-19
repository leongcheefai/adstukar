import { type DeviceTierRate, distributorPercent, economy, rateTable } from "@repo/config/economy";
import { usd, usdPerThousand } from "@repo/config/money";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui";

export const TIER_LABEL: Record<DeviceTierRate, string> = {
  standard: "Standard",
  premium: "Premium",
  flagship: "Flagship",
};

/** The rows come from the config, so this table and the landing page cannot disagree. */
const ROWS = rateTable();

/**
 * The published rates, seen from one side.
 *
 * An advertiser reads what a play costs; a distributor reads what a play pays.
 * Both are the same row of the same table, less the fee on the distributor's
 * side, so a member who does both sees one number with two names.
 */
export function RateTable({ side }: { side: "advertiser" | "distributor" }) {
  const pays = side === "advertiser";
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          {pays ? "What a play costs" : "What a play pays you"}
        </CardTitle>
        <CardDescription>
          {pays
            ? "In US dollars, by the tier of the screen it plays on."
            : `In US dollars, after the ${economy.feePercent}% fee, so you keep ${distributorPercent()}%.`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table className="w-auto">
          <TableHeader>
            <TableRow>
              <TableHead className="w-40">Screen tier</TableHead>
              {/* Fixed widths, so the figures sit beside the tier they belong
                  to instead of at the far edge of a wide card. */}
              <TableHead className="w-36 text-right">A play, per 1,000</TableHead>
              <TableHead className="w-28 text-right">A scan</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ROWS.map((row) => {
              const play = pays ? row.play : row.playKeeps;
              const scan = pays ? row.scan : row.scanKeeps;
              return (
                <TableRow key={row.tier}>
                  <TableCell className="font-medium">{TIER_LABEL[row.tier]}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {usdPerThousand(play.lowest)}–{usdPerThousand(play.highest)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{usd(scan)}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        <p className="mt-3 text-xs text-muted-foreground">
          {pays
            ? "The region on the screen sets where a play lands in the range. A scan is charged on top of the play."
            : `The region format sets where a play lands in the range. A screen is paid for up to ${economy.caps.dailyPlaysPerDevice.toLocaleString()} plays a day.`}
        </p>
      </CardContent>
    </Card>
  );
}
