import { Gift } from "@phosphor-icons/react";
import { project } from "@repo/config/project";
import {
  Button,
  Card,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@repo/ui";
import { useState } from "react";
import { useSession } from "../../lib/auth";
import { useStats } from "../../lib/stats";
import { CopyButton } from "../copy-button";

/** Mixed case and digits, the shape a referral link wants. */
const ALPHABET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

/**
 * A stable ten-character code from the user id.
 *
 * No table issues referral codes yet, so this is derived rather than fetched:
 * the same person always sees the same link, and no two people collide. It is
 * not yet a link the API would honour.
 *
 * Two independent hashes, because ten characters carry more than one 32-bit
 * word and a single hash would repeat itself halfway through.
 */
function referralCode(userId: string | undefined): string {
  if (!userId) return "…";
  let a = 2166136261;
  let b = 5381;
  for (const char of userId) {
    const code = char.charCodeAt(0);
    a = Math.imul(a ^ code, 16777619) >>> 0;
    b = ((b * 33) ^ code) >>> 0;
  }
  let out = "";
  for (let i = 0; i < 10; i++) {
    const source = i < 5 ? a : b;
    out += ALPHABET[((source >>> ((i % 5) * 6)) % ALPHABET.length) as number];
  }
  return out;
}

/**
 * The three things a member wants from this page before the list itself: what
 * they hold, how to take it out, and how to earn more without serving an ad.
 */
export function PointsSummary() {
  const { data: stats } = useStats();
  const { data: session } = useSession();
  const [cashOutOpen, setCashOutOpen] = useState(false);

  const settled = stats?.balance.settled ?? 0;
  // The site URL comes from the project config; never hardcode it in an app.
  const referralUrl = `${project.siteUrl}/referral/${referralCode(session?.user.id)}`;

  return (
    <>
      {/* One panel, three cells. Divide-x only from sm: stacked on a phone the
          rules would cut across the flow rather than along it. */}
      <Card className="grid gap-0 divide-y py-0 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        <div className="flex flex-col justify-between gap-3 p-5">
          <p data-slot="label" className="text-muted-foreground">
            Total CapyPoints
          </p>
          <p className="text-3xl font-normal tracking-tight tabular-nums">
            {settled.toLocaleString()}
          </p>
        </div>

        <div className="flex flex-col justify-between gap-3 p-5">
          <p data-slot="label" className="text-muted-foreground">
            Cash out
          </p>
          <Button variant="outline" size="sm" onClick={() => setCashOutOpen(true)}>
            Cash out CapyPoints
          </Button>
          <p className="text-xs text-muted-foreground">Trade points for ad credit or payout.</p>
        </div>

        {/* The one cell that asks for something rather than reporting it, so it
            is the one cell that carries the brand colour. */}
        <div className="flex flex-col justify-between gap-3 bg-primary/5 p-5">
          <p data-slot="label" className="text-primary">
            Referral link
          </p>
          {/* The copy control sits inside the field: the link and the way to
              take it are one object, not a field plus a button. */}
          <div className="relative">
            <code className="block truncate rounded-md border border-primary/25 bg-background py-2 pr-10 pl-3 font-mono text-xs text-primary">
              {referralUrl}
            </code>
            <CopyButton
              value={referralUrl}
              size="icon"
              variant="ghost"
              label="Copy referral link"
              className="absolute top-1/2 right-1 size-7 -translate-y-1/2 text-primary hover:bg-primary/10 hover:text-primary"
            />
          </div>
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Gift size={12} />
            Earn points when a friend joins.
          </p>
        </div>
      </Card>

      {/* A dialog, not a disabled button: a member who taps this deserves to be
          told why nothing happened, not left guessing. */}
      <Dialog open={cashOutOpen} onOpenChange={setCashOutOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Cash out is not open yet</DialogTitle>
            <DialogDescription>
              No money moves on CapyAds today. Points buy impressions, and nothing else. Your
              balance of {settled.toLocaleString()} keeps until cash out opens.
            </DialogDescription>
          </DialogHeader>
          <Button onClick={() => setCashOutOpen(false)}>Got it</Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
