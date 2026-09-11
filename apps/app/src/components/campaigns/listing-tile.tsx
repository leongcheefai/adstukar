import { Copy, DotsThreeVertical, Pause, PencilSimple, Play, Trash } from "@phosphor-icons/react";
import type { Campaign, Listing } from "@repo/contracts/types";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Button,
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
import { useArchiveListing, useUpdateListing } from "../../lib/campaigns";
import { StatusBadge } from "../status-badge";

/**
 * One listing, drawn as a bare grid cell. The cell owns its right and bottom
 * rule, so the grid needs no gap and no wrapper box.
 *
 * The name and the logo fall back to the campaign's, because a listing carries
 * only what changes between variants.
 */
export function ListingTile({
  listing,
  campaign,
  onEdit,
  onDuplicate,
  canDuplicate,
}: {
  listing: Listing;
  campaign: Campaign;
  onEdit: (listing: Listing) => void;
  onDuplicate: (listing: Listing) => void;
  /** False once the campaign holds every listing it may. A copy would be the fifth. */
  canDuplicate: boolean;
}) {
  const archive = useArchiveListing();
  const update = useUpdateListing();

  // Pausing keeps the approval, so starting the listing again needs no second
  // review. Only an approved or a paused listing is the advertiser's to move.
  const paused = listing.state === "paused";
  const canMove = paused || listing.state === "approved";

  function toggleRunning() {
    update.mutate(
      { id: listing.id, input: { state: paused ? "approved" : "paused" } },
      {
        onSuccess: () => toast.success(paused ? "Listing running" : "Listing paused"),
        onError: (err) => toast.error(err.message),
      },
    );
  }
  // The archive dialog is controlled: a DropdownMenuItem unmounts its own subtree on
  // select, which would take an AlertDialogTrigger nested inside it down with it.
  const [confirmOpen, setConfirmOpen] = useState(false);

  const rejected = listing.state === "rejected" && listing.rejectionReason;

  return (
    <div className="flex min-h-56 flex-col gap-4 border-r border-b p-5">
      {/* State and actions ride the top rule, so every tile in the grid shows its
          state on the same line no matter how tall its tagline runs. */}
      <div className="flex items-center justify-between gap-2">
        {rejected ? (
          <Tooltip>
            <TooltipTrigger className="min-w-0 cursor-help">
              <StatusBadge status={listing.state} />
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">{listing.rejectionReason}</TooltipContent>
          </Tooltip>
        ) : (
          <StatusBadge status={listing.state} />
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              className="-mr-2 shrink-0"
              aria-label={`More actions for this ${campaign.name} listing`}
            >
              <DotsThreeVertical size={18} weight="bold" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuItem onSelect={() => onEdit(listing)}>
              <PencilSimple size={14} className="mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem disabled={!canDuplicate} onSelect={() => onDuplicate(listing)}>
              <Copy size={14} className="mr-2" />
              {canDuplicate ? "Duplicate" : "Duplicate (campaign full)"}
            </DropdownMenuItem>
            <DropdownMenuItem disabled={!canMove} onSelect={toggleRunning}>
              {paused ? <Play size={14} className="mr-2" /> : <Pause size={14} className="mr-2" />}
              {paused ? "Start" : "Pause"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {/* variant, not hand-written classes: it is what turns the trash icon
                red as well as the word. */}
            <DropdownMenuItem variant="destructive" onSelect={() => setConfirmOpen(true)}>
              <Trash size={14} className="mr-2" />
              Archive
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex min-w-0 items-start gap-3">
        {listing.logoUrl ? (
          <img
            src={listing.logoUrl}
            alt=""
            className="size-9 shrink-0 rounded-md border object-cover"
          />
        ) : (
          <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted text-sm font-semibold text-muted-foreground">
            {campaign.name.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{campaign.name}</p>
          <p className="line-clamp-3 text-sm text-muted-foreground">{listing.tagline}</p>
        </div>
      </div>

      {/* mt-auto pins the line to the bottom rule whatever the tagline does, so
          the dates sit level across the whole grid. */}
      <p className="mt-auto text-xs text-muted-foreground">
        Added {new Date(listing.createdAt).toLocaleDateString()}
      </p>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive this listing?</AlertDialogTitle>
            <AlertDialogDescription>
              It stops playing at once. The record stays, because the plays it earned reference it.
              Your CapyPoints stay.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() =>
                archive.mutate(listing.id, {
                  onSuccess: () => toast.success("Listing archived"),
                  onError: (err) => toast.error(err.message),
                })
              }
            >
              Archive
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
