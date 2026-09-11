import { ArrowSquareOut, Check, MapPin, Tray, X } from "@phosphor-icons/react";
import type { DeviceReview, DeviceTier, ListingReview } from "@repo/contracts/types";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from "@repo/ui";
import { useState } from "react";
import { toast } from "sonner";
import {
  useApproveDevice,
  useApproveListing,
  useModerationQueue,
  useRejectDevice,
  useRejectListing,
} from "../../lib/admin";

/** The tier sets the rate, so an admin must choose one before a device may run. */
const TIER_LABEL: Record<DeviceTier, string> = {
  standard: "Standard",
  premium: "Premium",
  flagship: "Flagship",
};

const TIERS = Object.keys(TIER_LABEL) as DeviceTier[];

/** What the reject dialog is acting on. One dialog serves both queues. */
type RejectTarget =
  | { kind: "listing"; id: string; label: string }
  | { kind: "device"; id: string; label: string };

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
        <div className="flex flex-col gap-3 lg:items-end">
          {/* The band at its smallest: the review is about the words, and a
              full-size band would not fit beside them. */}
          <AdCard
            name={campaign.name}
            tagline={listing.tagline}
            logoUrl={listing.logoUrl}
            format="band"
            size="small"
            className="origin-top-right scale-50 lg:origin-top-right"
          />
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
              onClick={() => onReject({ kind: "listing", id: listing.id, label: campaign.name })}
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

function DeviceRow({
  item,
  onReject,
}: { item: DeviceReview; onReject: (target: RejectTarget) => void }) {
  const approve = useApproveDevice();
  const { device, owner } = item;
  const [tier, setTier] = useState<DeviceTier>(device.tier);

  return (
    <Card>
      <CardContent className="flex flex-col gap-4 pt-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 gap-4">
          {/* There is no device attestation, so the photo of the screen in place
              is most of what an admin has to go on — see docs/adr/0003. */}
          {device.photoUrl ? (
            <img
              src={device.photoUrl}
              alt="The screen in place"
              className="h-28 w-40 shrink-0 rounded-md border object-cover"
            />
          ) : (
            <div className="flex h-28 w-40 shrink-0 items-center justify-center rounded-md border border-dashed text-xs text-muted-foreground">
              No photo
            </div>
          )}
          <div className="min-w-0 space-y-2">
            <p data-usertext className="font-medium">
              {device.name}
            </p>
            <p data-usertext className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <MapPin size={14} className="shrink-0" />
              {device.location}
            </p>
            <p className="text-sm text-muted-foreground capitalize">{device.venueType}</p>
            <p className="text-xs text-muted-foreground">
              {owner.name} · <span className="font-mono">{owner.email}</span> · registered{" "}
              {new Date(device.createdAt).toLocaleDateString()}
            </p>
            <p className="font-mono text-xs text-muted-foreground">{device.deviceId}</p>
          </div>
        </div>
        <div className="flex flex-col gap-3 lg:items-end">
          <div className="space-y-1.5">
            <Label htmlFor={`tier-${device.id}`}>Tier</Label>
            <Select value={tier} onValueChange={(v) => setTier(v as DeviceTier)}>
              <SelectTrigger id={`tier-${device.id}`} className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIERS.map((t) => (
                  <SelectItem key={t} value={t}>
                    {TIER_LABEL[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() =>
                approve.mutate(
                  { id: device.id, tier },
                  {
                    onSuccess: () => toast.success(`${device.name} approved`),
                    onError: (err) => toast.error(err.message),
                  },
                )
              }
              disabled={approve.isPending}
            >
              <Check size={14} />
              Approve
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onReject({ kind: "device", id: device.id, label: device.name })}
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
  const rejectDevice = useRejectDevice();
  const [target, setTarget] = useState<RejectTarget | null>(null);
  const [reason, setReason] = useState("");

  const pending = rejectListing.isPending || rejectDevice.isPending;
  const empty = queue && queue.listings.length === 0 && queue.devices.length === 0;

  function submitReject(e: React.FormEvent) {
    e.preventDefault();
    if (!target) return;
    const mutation = target.kind === "listing" ? rejectListing : rejectDevice;
    mutation.mutate(
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

      {queue && queue.devices.length > 0 && (
        <section className="space-y-3">
          <h3 className="text-sm font-medium">Devices</h3>
          {queue.devices.map((item) => (
            <DeviceRow key={item.device.id} item={item} onReject={setTarget} />
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
