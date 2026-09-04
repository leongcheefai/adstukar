import { PencilSimple, Plus, Trash } from "@phosphor-icons/react";
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
import { useDeleteProduct, useUpdateProduct } from "../../lib/products";
import { domainOf, isProbablyUrl, normalizeUrl } from "../../lib/url";
import type { Campaign } from "./campaign-section";

/** Autofocus is right in a modal on desktop and wrong on touch: it opens the keyboard. */
const isTouchDevice = typeof window !== "undefined" && "ontouchstart" in window;

/**
 * The campaign header's action cluster: edit the site, delete the campaign, add
 * an ad.
 *
 * A campaign is not a table. It is every ad that shares a domain, so both
 * campaign-level actions are loops over the ads in the group. Sequential, so a
 * failure halfway leaves a count the member can act on.
 */
export function CampaignActions({
  campaign,
  onAddAd,
}: {
  campaign: Campaign;
  onAddAd: (campaign: Campaign) => void;
}) {
  const [editOpen, setEditOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");

  const update = useUpdateProduct();
  const remove = useDeleteProduct();

  const count = campaign.ads.length;
  const adWord = count === 1 ? "ad" : "ads";

  function openEdit() {
    setName(campaign.name);
    setUrl(campaign.ads[0]?.url ?? `https://${campaign.domain}`);
    setEditOpen(true);
  }

  const nextName = name.trim();
  const nextUrl = normalizeUrl(url);
  const nextDomain = domainOf(nextUrl);
  const domainChanges = isProbablyUrl(nextUrl) && nextDomain !== campaign.domain;
  const urlChanges = isProbablyUrl(nextUrl) && nextUrl !== (campaign.ads[0]?.url ?? "");
  // Only ads that actually differ get written, so an unchanged name is never
  // forced onto an ad the member renamed on purpose.
  const nameChanges = nextName.length > 0 && nextName !== campaign.name;
  const canSave =
    isProbablyUrl(nextUrl) &&
    nextName.length > 0 &&
    (urlChanges || nameChanges) &&
    !update.isPending;

  async function saveCampaign(e: React.FormEvent) {
    e.preventDefault();
    if (!canSave) return;
    const input = {
      ...(nameChanges ? { name: nextName } : {}),
      ...(urlChanges ? { url: nextUrl } : {}),
    };
    try {
      for (const ad of campaign.ads) {
        await update.mutateAsync({ id: ad.id, input });
      }
      toast.success(
        domainChanges
          ? `${count} ${adWord} moved to ${nextDomain}. Verify the new domain.`
          : "Campaign updated",
      );
      setEditOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update the campaign");
    }
  }

  async function deleteCampaign() {
    try {
      for (const ad of campaign.ads) {
        await remove.mutateAsync(ad.id);
      }
      toast.success(`${campaign.domain} deleted`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not delete the campaign");
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
            onClick={() => onAddAd(campaign)}
            aria-label={`Add an ad to ${campaign.domain}`}
          >
            <Plus size={18} />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Add an ad here</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setConfirmOpen(true)}
            aria-label={`Delete the campaign ${campaign.domain}`}
            className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash size={16} />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Delete campaign</TooltipContent>
      </Tooltip>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit campaign</DialogTitle>
            <DialogDescription>
              Both fields apply to every ad in this campaign. Taglines stay as they are.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={saveCampaign} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor={`campaign-name-${campaign.domain}`}>Campaign name</Label>
              <Input
                id={`campaign-name-${campaign.domain}`}
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={60}
                required
                autoFocus={!isTouchDevice}
                placeholder="Craftlog"
              />
              <p className="text-xs text-muted-foreground">
                The product name every card in this campaign shows.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor={`campaign-url-${campaign.domain}`}>Product URL</Label>
              <Input
                id={`campaign-url-${campaign.domain}`}
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

            {domainChanges && (
              <p className="rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-2 text-xs text-destructive">
                This moves the campaign to {nextDomain}. Every ad loses verification and returns to
                review.
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
            <AlertDialogTitle>Delete {campaign.domain}?</AlertDialogTitle>
            <AlertDialogDescription>
              {count === 1
                ? "This removes the ad in this campaign and every placement under it."
                : `This removes all ${count} ads in this campaign and every placement under them.`}{" "}
              Your CapyPoints stay.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={deleteCampaign}
              disabled={remove.isPending}
            >
              {remove.isPending ? "Deleting…" : `Delete ${count} ${adWord}`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
