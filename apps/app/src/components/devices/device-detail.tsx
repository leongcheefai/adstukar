import { ArrowsClockwise, Plus, Prohibit, Trash, X } from "@phosphor-icons/react";
import { economy } from "@repo/config/economy";
import type {
  Device,
  DeviceWithTerms,
  Placement,
  PlacementFormat,
  PlacementSize,
} from "@repo/contracts/types";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Slider,
  Switch,
} from "@repo/ui";
import { useState } from "react";
import { toast } from "sonner";
import {
  useArchiveDevice,
  useEligibleListings,
  useRotateKey,
  useSetExcludedTerms,
  useSetPromotion,
  useSetVetoes,
  useUpdateDevice,
} from "../../lib/devices";
import {
  useCreatePlacement,
  useDeletePlacement,
  usePlacements,
  useUpdatePlacement,
} from "../../lib/placements";
import { CopyButton } from "../copy-button";
import { CapyTvScreen } from "./capytv-screen";
import { OpenHoursFields, statedHoursOf } from "./open-hours";

const FORMAT_LABEL: Record<PlacementFormat, string> = {
  band: "Band · a strip across the foot of the screen",
  float: "Float · a card in one corner",
  ticker: "Ticker · one thin line",
};

const SIZE_LABEL: Record<PlacementSize, string> = {
  small: "Small",
  medium: "Medium",
  large: "Large",
};

/**
 * One region on the device. A device may hold several, but only one paid listing
 * is on screen at a time, so each row sets its own shape and timing and nothing
 * else.
 */
function PlacementRow({ placement }: { placement: Placement }) {
  const update = useUpdatePlacement();
  const remove = useDeletePlacement();
  const [dwell, setDwell] = useState(placement.dwellSeconds);
  const [gap, setGap] = useState(placement.gapSeconds);

  const onError = (err: Error) => toast.error(err.message);

  return (
    <div className="space-y-4 rounded-lg border p-4">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1 space-y-1.5">
          <Label>Format</Label>
          <Select
            value={placement.format}
            onValueChange={(v) =>
              update.mutate(
                { id: placement.id, input: { format: v as PlacementFormat } },
                { onError },
              )
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(FORMAT_LABEL) as PlacementFormat[]).map((f) => (
                <SelectItem key={f} value={f}>
                  {FORMAT_LABEL[f]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="w-32 space-y-1.5">
          <Label>Size</Label>
          <Select
            value={placement.size}
            onValueChange={(v) =>
              update.mutate({ id: placement.id, input: { size: v as PlacementSize } }, { onError })
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(SIZE_LABEL) as PlacementSize[]).map((s) => (
                <SelectItem key={s} value={s}>
                  {SIZE_LABEL[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button
          size="icon"
          variant="ghost"
          aria-label="Remove this region"
          className="mt-6 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
          onClick={() =>
            remove.mutate(placement.id, {
              onSuccess: () => toast.success("Region removed"),
              onError,
            })
          }
        >
          <Trash size={16} />
        </Button>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label>Dwell</Label>
            <span className="font-mono text-xs text-muted-foreground">{dwell}s</span>
          </div>
          <Slider
            value={[dwell]}
            min={economy.placement.dwellSeconds.min}
            max={economy.placement.dwellSeconds.max}
            step={1}
            onValueChange={([v]) => setDwell(v ?? dwell)}
            onValueCommit={([v]) =>
              update.mutate(
                { id: placement.id, input: { dwellSeconds: v ?? dwell } },
                { onError, onSuccess: () => toast.success("Dwell saved") },
              )
            }
          />
          <p className="text-xs text-muted-foreground">
            How long one listing stays on this region.
          </p>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label>Gap</Label>
            <span className="font-mono text-xs text-muted-foreground">{gap}s</span>
          </div>
          <Slider
            value={[gap]}
            min={economy.placement.gapSeconds.min}
            max={economy.placement.gapSeconds.max}
            step={30}
            onValueChange={([v]) => setGap(v ?? gap)}
            onValueCommit={([v]) =>
              update.mutate(
                { id: placement.id, input: { gapSeconds: v ?? gap } },
                { onError, onSuccess: () => toast.success("Gap saved") },
              )
            }
          />
          <p className="text-xs text-muted-foreground">
            The quiet time on the whole screen between two plays.
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * The listings this screen refuses by name.
 *
 * A veto is narrower than an excluded term: the term stops anything that reads a
 * certain way, the veto stops exactly the creative the distributor looked at and
 * did not want. Both are the distributor's, and neither goes through moderation.
 */
function VetoList({ deviceId }: { deviceId: string }) {
  const { data: listings, isLoading } = useEligibleListings(deviceId);
  const setVetoes = useSetVetoes();

  if (isLoading) return <p className="text-xs text-muted-foreground">Loading listings…</p>;
  if (!listings || listings.length === 0) {
    return (
      <p className="text-xs text-muted-foreground">
        Nothing is eligible for this screen yet. Approved listings show up here as they arrive.
      </p>
    );
  }

  const toggle = (listingId: string, vetoed: boolean) => {
    const next = vetoed
      ? [...listings.filter((l) => l.vetoed).map((l) => l.listingId), listingId]
      : listings.filter((l) => l.vetoed && l.listingId !== listingId).map((l) => l.listingId);
    setVetoes.mutate(
      { id: deviceId, listingIds: next },
      { onError: (err: Error) => toast.error(err.message) },
    );
  };

  return (
    <div className="divide-y rounded-lg border">
      {listings.map((listing) => (
        <div key={listing.listingId} className="flex items-center gap-3 p-3">
          {listing.logoUrl ? (
            <img src={listing.logoUrl} alt="" className="size-8 shrink-0 rounded object-cover" />
          ) : (
            <div className="size-8 shrink-0 rounded bg-muted" />
          )}
          <div className="min-w-0 flex-1">
            <p data-usertext className="truncate text-sm font-medium">
              {listing.name}
            </p>
            <p data-usertext className="truncate text-xs text-muted-foreground">
              {listing.tagline}
            </p>
          </div>
          <Switch
            checked={listing.vetoed}
            onCheckedChange={(on) => toggle(listing.listingId, on)}
            aria-label={`Refuse ${listing.name}`}
          />
        </div>
      ))}
    </div>
  );
}

/**
 * The distributor's own promotion. It plays free whenever nothing paid is
 * eligible, so it moves no points and never goes through moderation. With none
 * written, the screen plays the CapyAds card instead.
 */
function PromotionForm({ item }: { item: DeviceWithTerms }) {
  const { device } = item;
  const save = useSetPromotion();
  const [name, setName] = useState(device.promotionName ?? "");
  const [tagline, setTagline] = useState(device.promotionTagline ?? "");
  const [url, setUrl] = useState(device.promotionUrl ?? "");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    save.mutate(
      {
        id: device.id,
        input: {
          name: name.trim() || null,
          tagline: tagline.trim() || null,
          url: url.trim() || null,
          logoUrl: device.promotionLogoUrl,
        },
      },
      {
        onSuccess: () =>
          toast.success(name.trim() && tagline.trim() ? "Promotion saved" : "Promotion cleared"),
        onError: (err: Error) => toast.error(err.message),
      },
    );
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor={`promo-name-${device.id}`}>Name</Label>
          <Input
            id={`promo-name-${device.id}`}
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={economy.promotion.nameMaxLength}
            placeholder="Your own shop"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`promo-url-${device.id}`}>Address</Label>
          <Input
            id={`promo-url-${device.id}`}
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            type="url"
            placeholder="https://…"
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`promo-tagline-${device.id}`}>Tagline</Label>
        <Input
          id={`promo-tagline-${device.id}`}
          value={tagline}
          onChange={(e) => setTagline(e.target.value)}
          maxLength={economy.promotion.taglineMaxLength}
          placeholder="Two for one before 11am"
        />
      </div>
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          Leave the name or the tagline empty and the screen plays the CapyAds card instead.
        </p>
        <Button type="submit" size="sm" variant="outline" disabled={save.isPending}>
          {save.isPending ? "Saving…" : "Save"}
        </Button>
      </div>
    </form>
  );
}

/**
 * The expanded view of one device: what CapyTV plays, the credentials that pair
 * the screen, the regions it draws, and the listings its owner refuses.
 */
export function DeviceDetail({
  item,
  open,
  onOpenChange,
}: {
  item: DeviceWithTerms;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { device, excludedTerms } = item;
  const approved = device.state === "approved";
  const { data: placements } = usePlacements(device.id);
  const rotate = useRotateKey();
  const setTerms = useSetExcludedTerms();
  const createPlacement = useCreatePlacement();
  const archive = useArchiveDevice();

  const [term, setTerm] = useState("");
  const onError = (err: Error) => toast.error(err.message);

  function addTerm() {
    const phrase = term.trim().toLowerCase();
    if (!phrase) return;
    if (excludedTerms.includes(phrase)) {
      setTerm("");
      return;
    }
    if (excludedTerms.length >= economy.excludedTerms.max) {
      toast.error(`You can exclude up to ${economy.excludedTerms.max} terms.`);
      return;
    }
    setTerms.mutate(
      { id: device.id, phrases: [...excludedTerms, phrase] },
      { onSuccess: () => setTerm(""), onError },
    );
  }

  function removeTerm(phrase: string) {
    setTerms.mutate(
      { id: device.id, phrases: excludedTerms.filter((t) => t !== phrase) },
      { onError },
    );
  }

  /**
   * The stated hours on a screen that already exists. It saves as soon as a value
   * changes, like the region rows above it: there is no second field to fill in,
   * so a Save button would only add a step to forget.
   */
  function OpenHoursRow({ device }: { device: Device }) {
    const update = useUpdateDevice();
    return (
      <OpenHoursFields
        value={statedHoursOf(device)}
        idPrefix={`hours-${device.id}`}
        onChange={(next) =>
          update.mutate(
            { id: device.id, input: next },
            {
              onSuccess: () => toast.success("Open hours saved"),
              onError: (err) => toast.error(err.message),
            },
          )
        }
      />
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle data-usertext>{device.name}</DialogTitle>
          <DialogDescription>
            {device.location} · CapyTV plays its own content, and shows listings over it. One paid
            listing at a time.
          </DialogDescription>
        </DialogHeader>

        {device.photoUrl ? (
          <img
            src={device.photoUrl}
            alt="The screen in place"
            className="h-40 w-full rounded-lg border object-cover"
          />
        ) : (
          <CapyTvScreen />
        )}

        <div className="space-y-6">
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Screen number</Label>
              <div className="flex items-center gap-2">
                <code className="min-w-0 flex-1 truncate rounded-md border bg-muted px-2 py-1.5 font-mono text-xs">
                  {device.deviceId}
                </code>
                <CopyButton value={device.deviceId} size="icon" label="Copy the screen number" />
              </div>
              <p className="text-xs text-muted-foreground">
                How we name this screen in a support message. CapyTV does not ask for it.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label>Device key</Label>
              <div className="flex items-center gap-2">
                <code className="min-w-0 flex-1 truncate rounded-md border bg-muted px-2 py-1.5 font-mono text-xs">
                  {approved ? device.apiKey : "Issued when an admin approves the screen"}
                </code>
                <CopyButton value={device.apiKey} size="icon" label="Copy device key" />
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="icon" variant="outline" aria-label="Rotate device key">
                      <ArrowsClockwise
                        size={14}
                        className={rotate.isPending ? "animate-spin" : ""}
                      />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Rotate the device key?</AlertDialogTitle>
                      <AlertDialogDescription>
                        The old key stops working at once. The screen must pair again.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() =>
                          rotate.mutate(device.id, {
                            onSuccess: () => toast.success("Device key rotated"),
                            onError,
                          })
                        }
                      >
                        Rotate
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
              <p className="text-xs text-muted-foreground">
                Paste it into CapyTV on the screen. It is the screen&apos;s whole credential.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Regions</Label>
              <Button
                size="sm"
                variant="outline"
                disabled={createPlacement.isPending}
                onClick={() =>
                  createPlacement.mutate(
                    {
                      deviceId: device.id,
                      format: "band",
                      size: "medium",
                      dwellSeconds: economy.placement.dwellSeconds.default,
                      gapSeconds: economy.placement.gapSeconds.default,
                    },
                    { onSuccess: () => toast.success("Region added"), onError },
                  )
                }
              >
                <Plus size={14} className="mr-1" />
                Add region
              </Button>
            </div>
            {placements?.length === 0 && (
              <p className="text-xs text-muted-foreground">
                No region yet. Add one and the screen starts taking listings.
              </p>
            )}
            {placements?.map((placement) => (
              <PlacementRow key={placement.id} placement={placement} />
            ))}
          </div>

          <OpenHoursRow device={device} />

          <div className="space-y-3">
            <Label>Your own promotion</Label>
            <PromotionForm item={item} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor={`term-${device.id}`}>Excluded terms</Label>
            <div className="flex gap-2">
              <Input
                id={`term-${device.id}`}
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addTerm();
                  }
                }}
                maxLength={economy.excludedTerms.maxLength}
                placeholder="e.g. crypto"
              />
              <Button
                type="button"
                variant="outline"
                onClick={addTerm}
                disabled={setTerms.isPending}
              >
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {excludedTerms.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  A listing whose name or tagline carries a term never plays here. Up to{" "}
                  {economy.excludedTerms.max}.
                </p>
              )}
              {excludedTerms.map((t) => (
                <Badge key={t} data-usertext variant="secondary" className="gap-1 pr-1">
                  {t}
                  <button
                    type="button"
                    onClick={() => removeTerm(t)}
                    aria-label={`Remove ${t}`}
                    className="rounded-sm hover:bg-foreground/10"
                  >
                    <X size={12} />
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Prohibit size={14} className="text-muted-foreground" />
              <Label>Listings you refuse</Label>
            </div>
            <VetoList deviceId={device.id} />
          </div>
        </div>

        {/* Archive sits under a rule at the bottom: it is the one action that is
            not about setting this device up. */}
        <div className="flex justify-end border-t pt-4">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="sm" variant="ghost" className="text-destructive">
                <Trash size={14} className="mr-2" />
                Archive device
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Archive this device?</AlertDialogTitle>
                <AlertDialogDescription>
                  The device key stops working immediately and the screen plays nothing. The record
                  stays, because the plays it earned reference it.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  variant="destructive"
                  onClick={() =>
                    archive.mutate(device.id, {
                      onSuccess: () => {
                        toast.success("Device archived");
                        onOpenChange(false);
                      },
                      onError,
                    })
                  }
                >
                  Archive
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </DialogContent>
    </Dialog>
  );
}
