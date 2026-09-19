import { Bank, Check, MapPin, Warning, X } from "@phosphor-icons/react";
import { usd, usdCents } from "@repo/config/money";
import type { PayoutReview, ReviewedDevice } from "@repo/contracts/types";
import {
  Badge,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  EmptyState,
  Label,
  Textarea,
  cn,
} from "@repo/ui";
import { useState } from "react";
import { toast } from "sonner";
import { usePayPayout, usePayoutQueue, useRejectPayout } from "../../lib/payouts";

/** What the open dialog is doing to a request. One dialog serves both acts. */
type Action = { kind: "pay" | "reject"; id: string; label: string };

/** Two digits, so a strip of hours reads as a column of times. */
function pad(hour: number): string {
  return String(hour).padStart(2, "0");
}

function isOpen(hour: number, openHour: number | null, closeHour: number | null): boolean {
  if (openHour === null || closeHour === null || openHour === closeHour) return true;
  return openHour < closeHour
    ? hour >= openHour && hour < closeHour
    : hour >= openHour || hour < closeHour;
}

/**
 * The hours a screen played in, as one row of bars, in the venue's own time. A
 * bar outside the stated hours is a play in a room the member says was shut, so
 * it carries the warning colour rather than the brand one.
 */
function HourStrip({
  playsByHour,
  openHour,
  closeHour,
}: { playsByHour: number[]; openHour: number | null; closeHour: number | null }) {
  const peak = Math.max(1, ...playsByHour);
  // The position in the array is the hour of the day, so each bar is named by the
  // hour it stands for rather than by where it sits.
  const bars = playsByHour.map((plays, hour) => ({
    hour,
    plays,
    open: isOpen(hour, openHour, closeHour),
  }));
  return (
    <div
      className="flex h-8 items-end gap-px"
      // The strip is a summary, so it carries its own reading rather than 24 titles.
      aria-label={`Plays by hour, busiest hour ${peak}`}
    >
      {bars.map((bar) => (
        <span
          key={bar.hour}
          title={`${pad(bar.hour)}:00 — ${bar.plays}${bar.open ? "" : " (shut)"}`}
          className={cn("w-1.5 rounded-t-[1px]", bar.open ? "bg-primary/70" : "bg-destructive/70")}
          style={{ height: `${Math.max(bar.plays > 0 ? 12 : 2, (bar.plays / peak) * 100)}%` }}
        />
      ))}
    </div>
  );
}

/**
 * One screen, and every signal the review has on it. Each flag is a reason to
 * look harder, never a refusal: there is no device attestation, so a person
 * weighs these (docs/adr/0003).
 */
function DeviceReviewRow({ device, windowDays }: { device: ReviewedDevice; windowDays: number }) {
  const flags = device.flags;
  return (
    <div className="space-y-2 rounded-lg border p-3">
      <div className="flex flex-wrap items-center gap-2">
        <p data-usertext className="font-medium">
          {device.name}
        </p>
        <Badge variant="neutral" className="capitalize">
          {device.tier}
        </Badge>
        {device.state !== "approved" && (
          <Badge variant="warning" className="capitalize">
            {device.state}
          </Badge>
        )}
      </div>
      <p data-usertext className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <MapPin size={12} className="shrink-0" />
        {device.location}
      </p>

      <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
        <div>
          <p className="text-muted-foreground">Plays / {windowDays}d</p>
          <p className="tabular-nums">{device.plays.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Scans</p>
          <p className="tabular-nums">{device.scans.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Scan rate</p>
          <p className="tabular-nums">{(flags.scanRatio * 100).toFixed(2)}%</p>
        </div>
        <div>
          <p className="text-muted-foreground">Last report</p>
          <p className="tabular-nums">
            {flags.daysSilent === null ? "never" : `${flags.daysSilent}d ago`}
          </p>
        </div>
      </div>

      <div className="space-y-1">
        <p className="text-xs text-muted-foreground">
          Plays by hour · {flags.activeHours} of 24 hours ·{" "}
          {device.openHour === null || device.closeHour === null
            ? "no stated hours"
            : `open ${pad(device.openHour)}:00 to ${pad(device.closeHour)}:00`}
        </p>
        <HourStrip
          playsByHour={device.playsByHour}
          openHour={device.openHour}
          closeHour={device.closeHour}
        />
      </div>

      <div className="flex flex-wrap gap-1.5">
        {flags.lowScanRatio && (
          <Badge variant="danger">
            <Warning size={12} /> Plays, and almost no scans
          </Badge>
        )}
        {flags.outOfHoursPlays > 0 && (
          <Badge variant="danger">
            <Warning size={12} /> {flags.outOfHoursPlays.toLocaleString()} plays while shut
          </Badge>
        )}
        {flags.activeHours === 24 && (
          <Badge variant="warning">
            <Warning size={12} /> Plays around the clock
          </Badge>
        )}
        {flags.sharedLocation && (
          <Badge variant="warning">
            <Warning size={12} /> Another screen at this address
          </Badge>
        )}
        {flags.sharedNetwork && (
          <Badge variant="warning">
            <Warning size={12} /> Another screen on this network
          </Badge>
        )}
      </div>
    </div>
  );
}

function PayoutCard({
  item,
  windowDays,
  onAct,
}: { item: PayoutReview; windowDays: number; onAct: (action: Action) => void }) {
  const { request, owner, stripeAccount } = item;
  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <p className="text-2xl tracking-tight tabular-nums">{usd(request.amount)}</p>
            <p className="text-sm tabular-nums">{usdCents(request.usdCents)}</p>
            <p className="text-xs text-muted-foreground">
              {owner.name} · <span className="font-mono">{owner.email}</span> · asked{" "}
              {new Date(request.createdAt).toLocaleDateString()}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => onAct({ kind: "pay", id: request.id, label: owner.name })}
            >
              <Check size={14} />
              Pay through Stripe
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onAct({ kind: "reject", id: request.id, label: owner.name })}
            >
              <X size={14} />
              Refuse
            </Button>
          </div>
        </div>

        {/* Approval sends the money to this account, so its state sits beside the act. */}
        {stripeAccount ? (
          <div className="rounded-lg border p-3 text-sm">
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Bank size={12} /> Pay to
            </p>
            <p className="flex items-center gap-2 font-medium">
              Stripe account in {stripeAccount.country}
              {stripeAccount.payoutsEnabled ? (
                <Badge variant="success">Payouts enabled</Badge>
              ) : (
                <Badge variant="warning">Onboarding</Badge>
              )}
            </p>
            {!stripeAccount.payoutsEnabled && (
              <p className="text-xs text-destructive">
                Stripe has not cleared this account. Paying now fails; refuse, or wait.
              </p>
            )}
          </div>
        ) : (
          <p className="text-sm text-destructive">
            No Stripe account on file. Refuse this request and ask the member to connect one.
          </p>
        )}

        <div className="space-y-2">
          <h4 className="text-sm font-medium">Screens</h4>
          {item.devices.length === 0 && (
            <p className="text-sm text-muted-foreground">This member owns no screens.</p>
          )}
          {item.devices.map((device) => (
            <DeviceReviewRow key={device.deviceId} device={device} windowDays={windowDays} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * The payout batch. An admin reads the history behind each request, then
 * approves it, and Stripe sends the money (docs/adr/0005, docs/adr/0008).
 */
export function PayoutsSection() {
  const { data: queue, isLoading } = usePayoutQueue();
  const pay = usePayPayout();
  const reject = useRejectPayout();
  const [action, setAction] = useState<Action | null>(null);
  const [note, setNote] = useState("");

  const pending = pay.isPending || reject.isPending;

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!action) return;
    const done = {
      onSuccess: () => {
        toast.success(action.kind === "pay" ? "Payout sent through Stripe" : "Payout refused");
        setAction(null);
        setNote("");
      },
      onError: (err: Error) => toast.error(err.message),
    };
    if (action.kind === "pay") pay.mutate({ id: action.id }, done);
    else reject.mutate({ id: action.id, reason: note.trim() }, done);
  }

  return (
    <div className="space-y-6">
      {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}

      {queue?.items.length === 0 && (
        <EmptyState
          icon={<Bank />}
          title="No payouts waiting"
          description="A request appears here once a distributor asks to cash out."
        />
      )}

      {queue?.items.map((item) => (
        <PayoutCard
          key={item.request.id}
          item={item}
          windowDays={queue.windowDays}
          onAct={setAction}
        />
      ))}

      <Dialog open={action !== null} onOpenChange={(open) => !open && setAction(null)}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={submit}>
            <DialogHeader>
              <DialogTitle>
                {action?.kind === "pay" ? "Pay the payout through Stripe" : "Refuse the payout"}
              </DialogTitle>
              <DialogDescription>
                {action?.kind === "pay"
                  ? `Stripe sends the money to ${action?.label}'s account now. The amount already left their balance when they asked.`
                  : `The amount goes back to ${action?.label}. Say why, because the member reads it.`}
              </DialogDescription>
            </DialogHeader>

            {action?.kind === "reject" && (
              <div className="my-4 space-y-1.5">
                <Label htmlFor="payout-reason">Reason</Label>
                <Textarea
                  id="payout-reason"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  required
                  maxLength={500}
                />
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setAction(null)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={pending || (action?.kind === "reject" && note.trim().length === 0)}
              >
                {action?.kind === "pay" ? "Pay now" : "Refuse"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
