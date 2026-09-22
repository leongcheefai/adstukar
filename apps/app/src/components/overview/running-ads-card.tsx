import { ArrowRight } from "@phosphor-icons/react";
import { Button, Card, CardContent, CardHeader, CardTitle } from "@repo/ui";
import { useMemo } from "react";
import { Link } from "react-router";
import { slotOf } from "../../lib/slots";
import { useSlots } from "../../lib/slots-api";

/**
 * How many of the member's ads are on the ticker now. The figure counts the
 * slots that run; a slot in review or ended is not on a screen, so it
 * is not counted.
 */
export function RunningAdsCard() {
  const { data, isLoading } = useSlots();
  const running = useMemo(
    () => (data ?? []).map((item) => slotOf(item)).filter((slot) => slot.status === "running"),
    [data],
  );

  return (
    <Card className="h-full gap-0 py-0">
      <CardHeader className="flex h-16 flex-row items-center justify-between gap-3 border-b px-6 py-0 [.border-b]:pb-0">
        <CardTitle className="text-base">Ads running</CardTitle>
        <Button
          asChild
          variant="outline"
          size="sm"
          className="border-primary text-primary hover:bg-primary/10 hover:text-primary"
        >
          <Link to="/dashboard/campaigns">
            {running.length > 0 ? "See all campaigns" : "Book a slot"}
            <ArrowRight aria-hidden="true" />
          </Link>
        </Button>
      </CardHeader>
      {/* The same block as a figure of the Balance card: a label row, then the
          number. The label row is empty here, and it stays, so the number
          sits on the same line as the three amounts beside it. */}
      <CardContent className="flex flex-1 items-center p-6">
        <div className="space-y-2">
          <div className="h-3.5" aria-hidden="true" />
          {isLoading ? (
            <span
              className="block h-10 w-16 animate-pulse rounded-md bg-muted"
              aria-hidden="true"
            />
          ) : (
            <p className="text-4xl font-normal tracking-tight tabular-nums">{running.length}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
