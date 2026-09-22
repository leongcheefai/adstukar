import {
  DotsThreeVertical,
  PencilSimple,
  SealCheck,
  ShieldCheck,
  Trash,
} from "@phosphor-icons/react";
import { economy } from "@repo/config/economy";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@repo/ui";
import { useState } from "react";
import { toast } from "sonner";
import { useArchiveCampaign } from "../../lib/campaigns";
import { type Slot, type SlotPosition, type SlotStatus, isOver } from "../../lib/slots";
import { VerifyPanel } from "./verify-panel";

const STATUS: Record<
  SlotStatus,
  { label: string; variant: "warning" | "success" | "destructive" | "neutral" }
> = {
  running: { label: "Running", variant: "success" },
  review: { label: "In review", variant: "warning" },
  action: { label: "Action needed", variant: "warning" },
  rejected: { label: "Rejected", variant: "destructive" },
  ended: { label: "Ended", variant: "neutral" },
  refunded: { label: "Refunded", variant: "neutral" },
};

const DAY = new Intl.DateTimeFormat(undefined, { day: "numeric", month: "short" });

/** The two lines under the badge: how much of the term is left, and its dates. */
function termCopy(slot: Slot): { left: string; dates: string } {
  if (slot.status === "refunded") {
    return { left: "Not started", dates: "The charge went back to your wallet" };
  }
  if (slot.status === "ended") {
    return {
      left: "Term ended",
      dates:
        slot.startsAt && slot.endsAt
          ? `${DAY.format(slot.startsAt)} – ${DAY.format(slot.endsAt)}`
          : "",
    };
  }
  if (!slot.startsAt || !slot.endsAt) {
    return {
      left: `${economy.slot.termDays} days, from approval`,
      dates: "Starts when your ad is approved",
    };
  }
  return {
    left: `${slot.daysLeft} ${slot.daysLeft === 1 ? "day" : "days"} left`,
    dates: `${DAY.format(slot.startsAt)} – ${DAY.format(slot.endsAt)}`,
  };
}

/** The one line under the badge that says why, when the badge alone does not. */
function noteOf(slot: Slot): string | null {
  if (slot.status === "rejected") return slot.listing?.rejectionReason ?? null;
  if (slot.status === "action") {
    return slot.listing ? "Verify your domain to start." : "Write the ad to start.";
  }
  return null;
}

/**
 * One booked slot: the ad as the ticker shows it, its state, and how much of
 * the term is left. The term is the thing a flat price buys, so it is drawn
 * and not only written.
 */
export function SlotRow({
  slot,
  position,
  onEdit,
}: {
  slot: Slot;
  /** Where the slot sits on the loop. Null when the term is over and it holds no position. */
  position: SlotPosition | null;
  onEdit: (slot: Slot) => void;
}) {
  const { campaign } = slot.item;
  const { listing, status } = slot;
  const archive = useArchiveCampaign();
  // Both dialogs are controlled: a DropdownMenuItem unmounts its own subtree
  // on select, which would take a nested trigger down with it.
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [verifyOpen, setVerifyOpen] = useState(false);

  const verified = campaign.verifiedAt !== null;
  const ended = isOver(status);
  const term = termCopy(slot);
  const note = noteOf(slot);
  const state = STATUS[status];

  async function archiveSlot() {
    try {
      await archive.mutateAsync(campaign.id);
      toast.success(`${campaign.name} archived`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not archive the slot");
    }
  }

  return (
    <li className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-3 px-6 py-4 md:grid-cols-[minmax(0,1fr)_9rem_12rem_auto]">
      <div className="flex min-w-0 items-center gap-3">
        {listing?.logoUrl ? (
          <img
            src={listing.logoUrl}
            alt=""
            className="size-10 shrink-0 rounded-md border object-cover"
          />
        ) : (
          <div
            aria-hidden="true"
            className="flex size-10 shrink-0 items-center justify-center rounded-md bg-muted text-sm font-medium text-muted-foreground"
          >
            {campaign.name.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-sm font-medium">
            <span className="truncate">{campaign.name}</span>
            {/* Only when the domain really is verified. A seal on an unverified
                slot would be a claim we cannot back. */}
            {verified && (
              <SealCheck
                size={16}
                weight="fill"
                aria-label="Verified domain"
                className="shrink-0 text-primary"
              />
            )}
          </p>
          <p className="truncate text-sm text-muted-foreground">
            {listing?.tagline ?? "No ad written yet"}
          </p>
          <p className="truncate font-mono text-xs text-muted-foreground/80">
            {position !== null && `Slot #${position} · `}
            {campaign.domain}
          </p>
        </div>
      </div>

      {/* Actions ride the first row on a phone, and the last column from md. */}
      <div className="flex items-center justify-end gap-1 md:order-last">
        {status === "action" && listing && (
          <Button size="sm" variant="outline" onClick={() => setVerifyOpen(true)}>
            <ShieldCheck size={14} />
            Verify
          </Button>
        )}
        {status === "action" && !listing && (
          <Button size="sm" variant="outline" onClick={() => onEdit(slot)}>
            Write ad
          </Button>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              className="-mr-2 shrink-0"
              aria-label={`More actions for ${campaign.name}`}
            >
              <DotsThreeVertical size={18} weight="bold" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem onSelect={() => onEdit(slot)}>
              <PencilSimple size={14} className="mr-2" />
              Edit ad
            </DropdownMenuItem>
            {/* No pause: a slot runs its term to the end (docs/adr/0009). An edit
                sends the ad back to review; an archive is the exit. */}
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onSelect={() => setConfirmOpen(true)}>
              <Trash size={14} className="mr-2" />
              Archive
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="col-span-2 min-w-0 md:col-span-1">
        {note ? (
          <Tooltip>
            <TooltipTrigger className="cursor-help">
              <Badge variant={state.variant} dot>
                {state.label}
              </Badge>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">{note}</TooltipContent>
          </Tooltip>
        ) : (
          <Badge variant={state.variant} dot>
            {state.label}
          </Badge>
        )}
      </div>

      <div className="col-span-2 min-w-0 space-y-1.5 text-xs md:col-span-1 text-muted-foreground tabular-nums">
        <div className="flex justify-between gap-2">
          <span className="font-medium text-foreground">{term.left}</span>
          <span>{term.dates}</span>
        </div>
        {/* Decorative: the line above already says the days left in words. */}
        <div aria-hidden="true" className="h-1 overflow-hidden rounded-full bg-muted">
          <div
            className={`h-full rounded-full ${status === "running" ? "bg-primary" : "bg-muted-foreground/40"}`}
            style={{ width: `${slot.elapsed * 100}%` }}
          />
        </div>
      </div>

      <Dialog open={verifyOpen} onOpenChange={setVerifyOpen}>
        <DialogContent className="gap-6 p-8 sm:max-w-xl">
          <DialogHeader className="gap-2">
            <DialogTitle>Verify your domain</DialogTitle>
            <DialogDescription>One check and your ad can go on the ticker.</DialogDescription>
          </DialogHeader>
          <VerifyPanel campaign={campaign} onDone={() => setVerifyOpen(false)} />
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive {campaign.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              {ended
                ? "The term is over, so this only clears the row."
                : "The ad leaves the ticker at once, and the slot goes back to the loop."}{" "}
              The record stays, because your wallet history references it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={archiveSlot}
              disabled={archive.isPending}
            >
              {archive.isPending ? "Archiving…" : "Archive"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </li>
  );
}
