import { PencilSimple, Trash } from "@phosphor-icons/react";
import { economy } from "@repo/config/economy";
import type { CampaignWithListings } from "@repo/contracts/types";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@repo/ui";
import { useState } from "react";
import { toast } from "sonner";
import { useArchiveCampaign, useUpdateCampaign } from "../../lib/campaigns";
import { domainOf, isProbablyUrl, normalizeUrl } from "../../lib/url";

/** Autofocus is right in a modal on desktop and wrong on touch: it opens the keyboard. */
const isTouchDevice = typeof window !== "undefined" && "ontouchstart" in window;

/**
 * The campaign header's action cluster: edit the site and the budget, archive
 * the campaign.
 *
 * Adding a listing is not here. That control is the empty slot at the end of the
 * campaign's own grid, where the new listing will appear.
 *
 * A campaign is one row now, so both actions are one call. The name, the URL and
 * the budget all belong to the campaign, so its listings need no edit of their own.
 */
export function CampaignActions({ item }: { item: CampaignWithListings }) {
  const { campaign, listings } = item;
  const [editOpen, setEditOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [budget, setBudget] = useState("");

  const update = useUpdateCampaign();
  const archive = useArchiveCampaign();

  const count = listings.length;
  const listingWord = count === 1 ? "listing" : "listings";

  function openEdit() {
    setName(campaign.name);
    setUrl(campaign.url);
    setBudget(String(campaign.dailyBudget));
    setEditOpen(true);
  }

  const nextName = name.trim();
  const nextUrl = normalizeUrl(url);
  const nextDomain = domainOf(nextUrl);
  const nextBudget = Number.parseInt(budget, 10);
  const budgetValid = Number.isFinite(nextBudget) && nextBudget >= economy.caps.minDailyBudget;
  const domainChanges = isProbablyUrl(nextUrl) && nextDomain !== campaign.domain;
  const urlChanges = isProbablyUrl(nextUrl) && nextUrl !== campaign.url;
  const nameChanges = nextName.length > 0 && nextName !== campaign.name;
  const budgetChanges = budgetValid && nextBudget !== campaign.dailyBudget;
  const canSave =
    isProbablyUrl(nextUrl) &&
    nextName.length > 0 &&
    budgetValid &&
    (urlChanges || nameChanges || budgetChanges) &&
    !update.isPending;

  async function saveCampaign(e: React.FormEvent) {
    e.preventDefault();
    if (!canSave) return;
    try {
      await update.mutateAsync({
        id: campaign.id,
        input: {
          ...(nameChanges ? { name: nextName } : {}),
          ...(urlChanges ? { url: nextUrl } : {}),
          ...(budgetChanges ? { dailyBudget: nextBudget } : {}),
        },
      });
      toast.success(
        domainChanges
          ? `Campaign moved to ${nextDomain}. Verify the new domain.`
          : "Campaign updated",
      );
      setEditOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update the campaign");
    }
  }

  async function archiveCampaign() {
    try {
      await archive.mutateAsync(campaign.id);
      toast.success(`${campaign.domain} archived`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not archive the campaign");
    }
  }

  return (
    <div className="ml-auto flex shrink-0 items-center gap-1">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="icon"
            variant="ghost"
            onClick={openEdit}
            aria-label={`Edit the campaign ${campaign.name}`}
          >
            <PencilSimple size={16} />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Edit campaign</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setConfirmOpen(true)}
            aria-label={`Archive the campaign ${campaign.domain}`}
            className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash size={16} />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Archive campaign</TooltipContent>
      </Tooltip>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit campaign</DialogTitle>
            <DialogDescription>
              The name, the site and the budget belong to the campaign. Taglines stay as they are.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={saveCampaign} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor={`campaign-name-${campaign.id}`}>Campaign Name</Label>
              <Input
                id={`campaign-name-${campaign.id}`}
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={60}
                required
                autoFocus={!isTouchDevice}
                placeholder="Craftlog"
              />
              <p className="text-xs text-muted-foreground">
                The name every listing in this campaign shows.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor={`campaign-url-${campaign.id}`}>Target URL</Label>
              <Input
                id={`campaign-url-${campaign.id}`}
                type="text"
                inputMode="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                required
                autoComplete="url"
                spellCheck={false}
                placeholder="https://craftlog.app"
                className="font-mono text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`campaign-budget-${campaign.id}`}>Daily budget</Label>
              <Input
                id={`campaign-budget-${campaign.id}`}
                type="number"
                inputMode="numeric"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                min={economy.caps.minDailyBudget}
                step={100}
                required
                className="font-mono text-sm tabular-nums"
              />
              <p className="text-xs text-muted-foreground">
                The most CapyPoints this campaign spends in one day. At least{" "}
                {economy.caps.minDailyBudget.toLocaleString()}.
              </p>
            </div>

            {domainChanges && (
              <p className="rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-2 text-xs text-destructive">
                This moves the campaign to {nextDomain}. It stops running until you verify the new
                domain.
              </p>
            )}

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setEditOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={!canSave}>
                {update.isPending ? "Saving…" : "Save changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive {campaign.domain}?</AlertDialogTitle>
            <AlertDialogDescription>
              {count === 0
                ? "This campaign has no listing yet, so only the campaign goes."
                : `This stops all ${count} ${listingWord} in this campaign.`}{" "}
              The record stays, because your CapyPoints reference it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={archiveCampaign}
              disabled={archive.isPending}
            >
              {archive.isPending ? "Archiving…" : "Archive"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
