import { ArrowSquareOut, Check, Tray, X } from "@phosphor-icons/react";
import type { ListingReview } from "@repo/contracts/types";
import {
  AdCard,
  Badge,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  EmptyState,
  Label,
  Textarea,
  adCardDimensions,
} from "@repo/ui";
import { useState } from "react";
import { toast } from "sonner";
import { useApproveListing, useModerationQueue, useRejectListing } from "../../lib/admin";

/** The band at its smallest, then halved: the review is about the words, and a
    full-size band would not fit beside them. */
const PREVIEW_FORMAT = "band";
const PREVIEW_SIZE = "small";
const PREVIEW_SCALE = 0.5;

/**
 * A transform draws the card smaller but leaves its layout box at full size,
 * which squeezed the words into one column and pushed the buttons off the card.
 * The wrapper owns the layout at the drawn size, so the row measures what it sees.
 */
function ListingPreview({ item }: { item: ListingReview }) {
  const { listing, campaign } = item;
  const dims = adCardDimensions(PREVIEW_FORMAT, PREVIEW_SIZE);
  return (
    <div
      className="max-w-full shrink-0 overflow-hidden"
      style={{ width: dims.width * PREVIEW_SCALE, height: dims.height * PREVIEW_SCALE }}
    >
      <AdCard
        name={campaign.name}
        tagline={listing.tagline}
        logoUrl={listing.logoUrl}
        format={PREVIEW_FORMAT}
        size={PREVIEW_SIZE}
        className="max-w-none origin-top-left"
        style={{ transform: `scale(${PREVIEW_SCALE})` }}
      />
    </div>
  );
}

/** What the reject dialog is acting on. One dialog serves both queues. */
type RejectTarget = { id: string; label: string };

function ListingRow({
  item,
  onReject,
}: { item: ListingReview; onReject: (target: RejectTarget) => void }) {
  const approve = useApproveListing();
  const { listing, campaign, owner } = item;
  return (
    <Card>
      <CardContent className="flex flex-col gap-4 pt-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium">{campaign.name}</p>
            {campaign.verifiedAt ? (
              <Badge variant="success">Verified</Badge>
            ) : (
              <Badge variant="warning">Domain not verified</Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">{listing.tagline}</p>
          <p className="text-xs text-muted-foreground">
            {owner.name} · <span className="font-mono">{owner.email}</span> · submitted{" "}
            {new Date(listing.createdAt).toLocaleDateString()}
          </p>
          <a
            href={campaign.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-mono text-xs underline-offset-4 hover:underline"
          >
            Open landing page <ArrowSquareOut size={11} />
          </a>
        </div>
        <div className="flex shrink-0 flex-col gap-3 lg:items-end">
          <ListingPreview item={item} />
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() =>
                approve.mutate(listing.id, {
                  onSuccess: () => toast.success(`${campaign.name} approved`),
                  onError: (err) => toast.error(err.message),
                })
              }
              disabled={approve.isPending || !campaign.verifiedAt}
            >
              <Check size={14} />
              Approve
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onReject({ id: listing.id, label: campaign.name })}
            >
              <X size={14} />
              Reject
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function ModerationSection() {
  const { data: queue, isLoading } = useModerationQueue();
  const rejectListing = useRejectListing();
  const [target, setTarget] = useState<RejectTarget | null>(null);
  const [reason, setReason] = useState("");

  const pending = rejectListing.isPending;
  const empty = queue && queue.listings.length === 0;

  function submitReject(e: React.FormEvent) {
    e.preventDefault();
    if (!target) return;
    rejectListing.mutate(
      { id: target.id, reason: reason.trim() },
      {
        onSuccess: () => {
          toast.success(`${target.label} rejected`);
          setTarget(null);
          setReason("");
        },
        onError: (err) => toast.error(err.message),
      },
    );
  }

  return (
    <div className="space-y-6">
      {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}

      {empty && (
        <EmptyState
          icon={<Tray />}
          title="Queue is empty"
          description="Nothing waits for review."
        />
      )}

      {queue && queue.listings.length > 0 && (
        <section className="space-y-3">
          <h3 className="text-sm font-medium">Listings</h3>
          {queue.listings.map((item) => (
            <ListingRow key={item.listing.id} item={item} onReject={setTarget} />
          ))}
        </section>
      )}

      <Dialog open={target !== null} onOpenChange={(open) => !open && setTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reject {target?.label}</DialogTitle>
            <DialogDescription>The owner sees this reason on their dashboard.</DialogDescription>
          </DialogHeader>
          <form onSubmit={submitReject} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="reject-reason">Reason</Label>
              <Textarea
                id="reject-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={4}
                required
                maxLength={500}
                placeholder="The landing page does not match the tagline."
              />
            </div>
            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? "Rejecting…" : "Reject"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
