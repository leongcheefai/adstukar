import {
  CalendarBlank,
  CheckCircle,
  CircleNotch,
  Tag,
  Trash,
  UploadSimple,
} from "@phosphor-icons/react";
import { economy, slotPrice, slotTermEnd } from "@repo/config/economy";
import { media, megabytes } from "@repo/config/media";
import { usd, usdCents } from "@repo/config/money";
import { project } from "@repo/config/project";
import type { Campaign, LoopBand } from "@repo/contracts/types";
import {
  Button,
  Card,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
} from "@repo/ui";
import { useMutation } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  uploadLogo,
  useCreateListing,
  useUpdateCampaign,
  useUpdateListing,
} from "../../lib/campaigns";
import { lookUpSite } from "../../lib/site-lookup";
import { type Slot, type SlotPosition, firstOpenPosition } from "../../lib/slots";
import { useBookSlot } from "../../lib/slots-api";
import { domainOf, isProbablyUrl, normalizeUrl } from "../../lib/url";
import { AddFundsButton } from "../topups/add-funds-button";
import { Fact } from "./slot-fact";
import { SlotPreview } from "./slot-preview";
import { SlotTicker } from "./slot-ticker";
import { VerifyPanel } from "./verify-panel";

interface SlotFormProps {
  /** Leaves the page: the work is done, or the member put the last step off. */
  onDone: () => void;
  /** When set, the form edits this slot's creative; otherwise it books a new one. */
  slot?: Slot | null;
  /** The loop as it stands, so the form can show which positions are open. */
  bands: LoopBand[];
  /** The position a press on the loop picked. Null takes the first open one. */
  position: SlotPosition | null;
  /** Domains this member already holds a slot for. One domain, one slot. */
  takenDomains: string[];
  /** Settled points in the wallet, or undefined while the figure loads. */
  balance: number | undefined;
  /** False when the loop is full, so a new booking cannot go through. */
  slotsOpen: boolean;
  /** Opens the top-up dialog. The wallet is short, so the booking waits for it. */
  onAddFunds: () => void;
}

/** The last day of a term, with the year: a booking in late December ends in the next one. */
const END_DAY = new Intl.DateTimeFormat(undefined, {
  day: "numeric",
  month: "short",
  year: "numeric",
});

type Step = "form" | "verify";

type LookupState = "idle" | "checking" | "ok" | "failed";

/** How long the URL field stays quiet before the site check starts. */
const LOOKUP_DELAY_MS = 600;

const LOOKUP_MESSAGE: Record<LookupState, string> = {
  idle: "",
  checking: "",
  // The mark in the field says it. A line of text under a field that is right is noise.
  ok: "",
  failed: "We could not reach this site. Check the address.",
};

/** Autofocus is right in a modal on desktop and wrong on touch: it opens the keyboard. */
const isTouchDevice = typeof window !== "undefined" && "ontouchstart" in window;

/** What the presign route and the copy below both accept. */
const LOGO_TYPES = media.image.types.join(",");
const LOGO_MAX_BYTES = media.image.maxBytes;
const LOGO_MAX_LABEL = megabytes(LOGO_MAX_BYTES);
const NAME_MAX = economy.slot.nameMaxLength;
const TAGLINE_MAX = economy.slot.taglineMaxLength;

function Counter({ used, max }: { used: number; max: number }) {
  return (
    <span
      className={`text-xs tabular-nums ${used > max ? "text-destructive" : "text-muted-foreground"}`}
    >
      {used}/{max}
    </span>
  );
}

/**
 * Books one slot, or edits the creative of a slot the member holds. It is a
 * page and not a dialog: the form, the preview and the loop are too much for a
 * panel over another page.
 *
 * The form stands beside the band it produces, so every keystroke shows on the
 * ticker at once. The price is flat, so the order has no choice in it: one
 * slot, one term, one figure.
 */
export function SlotForm({
  onDone,
  slot,
  bands,
  position: pickedPosition,
  takenDomains,
  balance,
  slotsOpen,
  onAddFunds,
}: SlotFormProps) {
  const editing = slot ?? null;
  const [step, setStep] = useState<Step>("form");
  const [name, setName] = useState("");
  const [tagline, setTagline] = useState("");
  const [url, setUrl] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [dragging, setDragging] = useState(false);
  const [position, setPosition] = useState<SlotPosition | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  /** The campaign a new booking made, kept for the verify step. */
  const [booked, setBooked] = useState<Campaign | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [lookup, setLookup] = useState<LookupState>("idle");
  /** What the last site check put in the form, so a later check may replace it. */
  const filled = useRef({ name: "", logoUrl: "" });
  /**
   * What the server refused, and the form as it stood then. The message shows
   * only while the form still reads the same, so any edit clears it without
   * an effect that watches every field.
   */
  const [refusal, setRefusal] = useState<{ message: string; form: string } | null>(null);

  const bookSlot = useBookSlot();
  // An edit on a slot whose creative was archived writes a new one; that is the
  // only path that still creates a listing on its own.
  const createListing = useCreateListing();
  const updateCampaign = useUpdateCampaign();
  const updateListing = useUpdateListing();
  const saving =
    bookSlot.isPending ||
    createListing.isPending ||
    updateCampaign.isPending ||
    updateListing.isPending;

  useEffect(() => {
    setStep("form");
    setBooked(null);
    setDragging(false);
    setName(editing?.item.campaign.name ?? "");
    setUrl(editing?.item.campaign.url ?? "");
    setTagline(editing?.listing?.tagline ?? "");
    setLogoUrl(editing?.listing?.logoUrl ?? "");
    setPosition(pickedPosition);
  }, [editing, pickedPosition]);

  const logoUpload = useMutation({
    mutationFn: uploadLogo,
    onSuccess: (publicUrl) => setLogoUrl(publicUrl),
    onError: (err: Error) => toast.error(err.message),
  });

  function takeLogo(file: File) {
    if (!LOGO_TYPES.split(",").includes(file.type)) {
      toast.error("Use a PNG, JPEG or WebP image");
      return;
    }
    if (file.size > LOGO_MAX_BYTES) {
      toast.error(`That image is over ${LOGO_MAX_LABEL}`);
      return;
    }
    logoUpload.mutate(file);
  }

  const formKey = JSON.stringify([name, tagline, url, logoUrl, position]);
  const serverError = refusal?.form === formKey ? refusal.message : null;

  const targetUrl = normalizeUrl(url);
  const urlValid = isProbablyUrl(targetUrl);
  const domain = urlValid ? domainOf(targetUrl) : "";
  const ownDomain = editing?.item.campaign.domain;
  const domainTaken = domain.length > 0 && domain !== ownDomain && takenDomains.includes(domain);
  const domainChanges = editing !== null && urlValid && domain !== ownDomain;

  // The site check. It waits for the member to stop typing, and a newer URL
  // stops the check of an older one. It fills a field only when the field is
  // empty or still holds what an earlier check put there, so it never writes
  // over the member's own words or logo.
  const lookupTarget = !editing && urlValid && !domainTaken ? targetUrl : "";
  useEffect(() => {
    if (!lookupTarget) {
      setLookup("idle");
      return;
    }
    const stop = new AbortController();
    const wait = setTimeout(() => {
      setLookup("checking");
      lookUpSite(lookupTarget, stop.signal)
        .then((site) => {
          if (stop.signal.aborted) return;
          const found = { name: site.name.slice(0, NAME_MAX), logoUrl: site.logoUrl ?? "" };
          setName((was) => (was === "" || was === filled.current.name ? found.name : was));
          setLogoUrl((was) => (was === "" || was === filled.current.logoUrl ? found.logoUrl : was));
          filled.current = found;
          setLookup("ok");
        })
        .catch(() => {
          if (!stop.signal.aborted) setLookup("failed");
        });
    }, LOOKUP_DELAY_MS);
    return () => {
      clearTimeout(wait);
      stop.abort();
    };
  }, [lookupTarget]);

  // A pick somebody took in the meantime falls back to the first open position.
  const pickIsOpen = position !== null && bands[position - 1]?.kind === "open";
  const bookedPosition = pickIsOpen ? position : firstOpenPosition(bands);

  const short = !editing && balance !== undefined && balance < slotPrice();
  const valid =
    name.trim().length > 0 &&
    name.length <= NAME_MAX &&
    tagline.trim().length > 0 &&
    tagline.length <= TAGLINE_MAX &&
    urlValid &&
    !domainTaken;
  const canSubmit = valid && !saving && !short && (editing !== null || slotsOpen);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    const logo = logoUrl.trim() ? logoUrl.trim() : null;

    try {
      if (editing) {
        const { campaign } = editing.item;
        const nameChanges = name.trim() !== campaign.name;
        const urlChanges = targetUrl !== campaign.url;
        if (nameChanges || urlChanges) {
          await updateCampaign.mutateAsync({
            id: campaign.id,
            input: {
              ...(nameChanges ? { name: name.trim() } : {}),
              ...(urlChanges ? { url: targetUrl } : {}),
            },
          });
        }
        if (editing.listing) {
          const creativeChanges =
            tagline.trim() !== editing.listing.tagline || logo !== editing.listing.logoUrl;
          if (creativeChanges) {
            await updateListing.mutateAsync({
              id: editing.listing.id,
              input: { tagline: tagline.trim(), logoUrl: logo },
            });
          }
        } else {
          await createListing.mutateAsync({
            campaignId: campaign.id,
            tagline: tagline.trim(),
            logoUrl: logo,
          });
        }
        toast.success("Slot updated. A changed creative goes back for review.");
        onDone();
        return;
      }

      if (bookedPosition === null) {
        toast.error("Every slot is taken. A slot opens when a term ends.");
        return;
      }
      // One request books the campaign, the creative and the charge together,
      // so a short balance or a taken position leaves nothing behind.
      const created = await bookSlot.mutateAsync({
        name: name.trim(),
        url: targetUrl,
        tagline: tagline.trim(),
        logoUrl: logo,
        position: bookedPosition,
      });

      if (created.campaign.verifiedAt) {
        toast.success(`Slot #${created.slot.position} booked. Your ad is in review.`);
        onDone();
        return;
      }
      // The domain has never been proved, so the token step is still owed.
      toast.success(`Slot #${created.slot.position} booked. One step left.`);
      setBooked(created.campaign);
      setStep("verify");
    } catch (err) {
      setRefusal({
        message: err instanceof Error ? err.message : "Could not save the slot",
        form: formKey,
      });
    }
  }

  const price = usdCents(economy.slot.priceUsdCents);
  const term = `${economy.slot.termDays} days`;

  const message = domainTaken
    ? `${domain} already holds a slot. Edit that slot instead.`
    : domainChanges
      ? `This moves the slot to ${domain}. It stops until you verify the new domain.`
      : LOOKUP_MESSAGE[lookup];
  const messageIsError = domainTaken || (!domainChanges && lookup === "failed");

  if (step === "verify" && booked) {
    return (
      <Card className="max-w-xl gap-6 p-8">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">Verify your domain</h1>
          <p className="text-sm text-muted-foreground">
            One check and your ad can go on the ticker.
          </p>
        </div>
        <VerifyPanel campaign={booked} onDone={onDone} doneLabel="I will do this later" />
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          {editing ? "Edit your ad" : "Book a slot"}
        </h1>
        <p className="max-w-3xl text-sm text-muted-foreground">
          {editing
            ? "The slot and its term stay as they are. A changed creative goes back for review."
            : `The ticker on every ${project.name} screen holds ${economy.slot.count} slots. Your brand takes one slot and crosses the screen in turn with the others, so each advertiser gets the same time. A booking runs for ${term}. There is no bid and no budget for each day.`}
        </p>
      </div>

      <Card className="p-6 sm:p-8">
        <form onSubmit={submit} className="grid gap-8 lg:grid-cols-2">
          {/* The fields and the preview take half of the card each. */}
          <div className="space-y-6">
            {/* The URL goes first: the form checks the site, then fills the name
                and the logo from it, so the member starts with a band and not
                with three empty fields. */}
            <div className="relative space-y-2">
              <Label htmlFor="slot-url" data-plain>
                Destination URL
              </Label>
              <div className="relative">
                <Input
                  id="slot-url"
                  type="text"
                  inputMode="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onBlur={() => urlValid && setUrl(targetUrl)}
                  required
                  autoFocus={!isTouchDevice}
                  autoComplete="url"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  placeholder="https://yourbrand.com"
                  className="pr-10"
                />
                {/* A check, not the seal: the seal on a slot row means the domain
                  is proved to be the member's, and this says only that the
                  site answers. */}
                <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                  {lookup === "checking" && (
                    <CircleNotch
                      size={18}
                      className="animate-spin text-muted-foreground"
                      aria-label="Checking the site"
                    />
                  )}
                  {lookup === "ok" && (
                    <CheckCircle
                      size={18}
                      weight="fill"
                      className="text-primary"
                      aria-label="Site found"
                    />
                  )}
                </span>
              </div>
              {/* Out of the flow, in the gap the stack already has, so every
                  field keeps the same space under it with or without a message. */}
              <p
                aria-live="polite"
                title={message}
                className={`absolute top-full right-0 left-0 truncate pt-0.5 text-xs ${messageIsError ? "text-destructive" : "text-muted-foreground"}`}
              >
                {message}
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="slot-name" data-plain>
                  Brand name
                </Label>
                <Counter used={name.length} max={NAME_MAX} />
              </div>
              <Input
                id="slot-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={NAME_MAX}
                required
                placeholder="Craftlog"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="slot-tagline" data-plain>
                  Tagline
                </Label>
                <Counter used={tagline.length} max={TAGLINE_MAX} />
              </div>
              <Input
                id="slot-tagline"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                maxLength={TAGLINE_MAX}
                required
                placeholder="Ship notes for indie makers."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slot-logo" data-plain>
                Logo
              </Label>
              <input
                ref={fileRef}
                id="slot-logo"
                type="file"
                accept={LOGO_TYPES}
                className="sr-only"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) takeLogo(file);
                  // Cleared so picking the same file twice still fires a change.
                  e.target.value = "";
                }}
              />

              {logoUrl ? (
                <div className="flex items-center gap-3 rounded-lg border p-3">
                  <img
                    src={logoUrl}
                    alt=""
                    className="size-12 shrink-0 rounded-md border object-cover"
                  />
                  <span className="flex-1" />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => fileRef.current?.click()}
                    disabled={logoUpload.isPending}
                  >
                    Replace
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Remove the logo"
                    onClick={() => setLogoUrl("")}
                    className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash size={16} />
                  </Button>
                </div>
              ) : (
                /* A whole area, not a button beside a field: the target is the
                   drop zone, so pointing at it and dropping on it agree. */
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragging(true);
                  }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragging(false);
                    const file = e.dataTransfer.files[0];
                    if (file) takeLogo(file);
                  }}
                  disabled={logoUpload.isPending}
                  className={`flex w-full items-center gap-3 rounded-lg border border-dashed px-4 py-4 text-left transition-colors duration-150 hover:bg-accent focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:outline-none disabled:pointer-events-none ${
                    dragging ? "border-primary bg-accent" : "border-border"
                  }`}
                >
                  {logoUpload.isPending ? (
                    <CircleNotch
                      size={20}
                      className="shrink-0 animate-spin text-muted-foreground"
                    />
                  ) : (
                    <UploadSimple size={20} className="shrink-0 text-muted-foreground" />
                  )}
                  <span className="min-w-0">
                    <span className="block text-sm font-medium">
                      {logoUpload.isPending ? "Uploading…" : "Drop a logo, or click to choose"}
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      Optional. PNG, JPEG or WebP up to {LOGO_MAX_LABEL}. It must read on black.
                    </span>
                  </span>
                </button>
              )}
            </div>

            {/* The position is one more field. The loop itself opens in a
                dialog: twenty bands are a picker, and a picker left open on the
                page pushed the button that books the slot far below the fold. */}
            {!editing && bookedPosition !== null && (
              <div className="space-y-2">
                <Label htmlFor="slot-position" data-plain>
                  Position on the ticker
                </Label>
                <Button
                  id="slot-position"
                  type="button"
                  variant="outline"
                  onClick={() => setPickerOpen(true)}
                  className="w-full justify-between font-normal"
                >
                  <span className="tabular-nums">
                    Slot {bookedPosition} of {bands.length}
                  </span>
                  <span className="text-muted-foreground">Change</span>
                </Button>
              </div>
            )}

            {/* A field like the ones above it: what the wallet holds, and the
                way to add to it, beside each other and above the button that
                spends it. */}
            {!editing && (
              <div className="space-y-2">
                <Label data-plain asChild>
                  <p>Available funds</p>
                </Label>
                <div className="flex items-center gap-3">
                  <p
                    className={`flex h-9 min-w-0 flex-1 items-center rounded-lg border bg-muted/40 px-3 text-sm font-medium tabular-nums ${short ? "text-[color:var(--on-air)]" : ""}`}
                  >
                    {balance === undefined ? "…" : usd(balance)}
                  </p>
                  <AddFundsButton onClick={onAddFunds} />
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4">
            {/* What the button below charges, said once more beside the band it
                buys. An edit buys nothing, so it shows neither figure. */}
            {!editing && (
              <div className="grid grid-cols-2 gap-3">
                <Fact icon={<Tag />} value={price} label="Flat rate for each slot" />
                <Fact
                  icon={<CalendarBlank />}
                  value={term}
                  label={`From approval. Ends ${END_DAY.format(slotTermEnd(new Date()))} at the earliest`}
                />
              </div>
            )}
            <SlotPreview name={name} tagline={tagline} logoUrl={logoUrl || null} />
          </div>

          <div className="flex flex-wrap items-center justify-end gap-3 lg:col-span-2">
            {serverError && (
              <p role="alert" className="text-sm text-destructive">
                {serverError}
              </p>
            )}
            <Button type="submit" variant="inverted" size="lg" disabled={!canSubmit}>
              {saving ? "Saving…" : editing ? "Save changes" : `Book slot · ${price}`}
            </Button>
          </div>
        </form>
      </Card>

      {bookedPosition !== null && (
        <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
          <DialogContent className="max-h-[calc(100dvh-2rem)] gap-5 overflow-y-auto p-6 sm:max-w-5xl">
            <DialogHeader>
              <DialogTitle>Pick your position</DialogTitle>
              <DialogDescription>
                Press an open slot. Your brand takes that position on the ticker.
              </DialogDescription>
            </DialogHeader>
            <SlotTicker
              bands={bands}
              draft={{
                position: bookedPosition,
                name: name.trim() || "Your brand",
                tagline: tagline.trim() || "One short line about it",
                logoUrl: logoUrl || null,
              }}
              onPick={(next) => {
                setPosition(next);
                setPickerOpen(false);
              }}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
