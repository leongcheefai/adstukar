import { Check, CircleNotch, X } from "@phosphor-icons/react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
} from "@repo/ui";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { findLogoUrl, nameFromUrl, useCreateCampaign, useSiteMetadata } from "../../lib/campaigns";
import { domainOf, isProbablyUrl, normalizeUrl } from "../../lib/url";

/** Autofocus is right in a modal on desktop and wrong on touch: it opens the keyboard. */
const isTouchDevice = typeof window !== "undefined" && "ontouchstart" in window;

/**
 * How long the badge stays on screen after the site answers. Long enough to
 * read, short enough that nobody reaches for the mouse.
 */
const HOLD_MS = 2000;

/** The widest label the action ever shows. It sets the button's width. */
const WIDEST_LABEL = "Create Campaign";

type Phase = "idle" | "checking" | "ok" | "failed";

interface CampaignFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Domains already listed. A second campaign on one domain is the same campaign. */
  takenDomains: string[];
  /** Runs after the API stores the campaign, with the id it took. */
  onCreated?: (campaignId: string) => void;
}

/**
 * Creates a campaign: a name and a site, nothing else.
 *
 * Listings are a separate flow. A campaign is the site a member promotes, so the
 * only question this dialog asks is which site, and the only work it does before
 * saving is check that something answers there.
 */
export function CampaignFormDialog({
  open,
  onOpenChange,
  takenDomains,
  onCreated,
}: CampaignFormDialogProps) {
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const metadata = useSiteMetadata();
  const create = useCreateCampaign();

  useEffect(() => {
    // Radix keeps this mounted while closed, so a hold from the last open would
    // otherwise still fire. Both directions of the change cancel it.
    if (holdTimer.current) clearTimeout(holdTimer.current);
    holdTimer.current = null;
    if (!open) return;
    setName("");
    setUrl("");
    setPhase("idle");
  }, [open]);

  // And the page can drop the dialog while a hold is running.
  useEffect(() => {
    return () => {
      if (holdTimer.current) clearTimeout(holdTimer.current);
    };
  }, []);

  const targetUrl = normalizeUrl(url);
  const urlValid = isProbablyUrl(targetUrl);
  const domain = urlValid ? domainOf(targetUrl) : "";
  const taken = domain.length > 0 && takenDomains.includes(domain);
  const ready = name.trim().length > 0 && urlValid && !taken;
  /** The check is running, or its result is still on screen. The form is closed. */
  const busy = phase === "checking" || phase === "ok";

  async function save(finalName: string) {
    const created = await create.mutateAsync({ name: finalName, url: targetUrl });
    return created.campaign.id;
  }

  function finish(finalName: string, campaignId: string) {
    toast.success(`${finalName} created. Write its first listing next.`);
    onOpenChange(false);
    onCreated?.(campaignId);
  }

  /**
   * Checks the site without leaving the field. A pass stores the campaign; a
   * failure stays put with a red badge, so the URL can be corrected in place.
   *
   * "Answered" is not proof of ownership. That comes later, from the token the
   * advertiser publishes on the domain.
   */
  async function submit() {
    if (!ready || busy) return;

    // A failed check has already been reported. A second press accepts the URL.
    if (phase === "failed") {
      try {
        const id = await save(name.trim());
        finish(name.trim(), id);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Could not create the campaign");
      }
      return;
    }

    setUrl(targetUrl);
    setPhase("checking");

    const [meta, icon] = await Promise.all([
      metadata.mutateAsync(targetUrl).catch(() => null),
      findLogoUrl(targetUrl),
    ]);

    // Either signal means something answered at that origin.
    if (!(meta || icon)) {
      setPhase("failed");
      return;
    }

    // The member named the campaign, so their name wins over the page's.
    const finalName = name.trim() || meta?.name || nameFromUrl(targetUrl);
    try {
      // Stored before the hold, so closing the dialog early cannot lose it.
      const id = await save(finalName);
      setPhase("ok");
      holdTimer.current = setTimeout(() => finish(finalName, id), HOLD_MS);
    } catch (err) {
      setPhase("failed");
      toast.error(err instanceof Error ? err.message : "Could not create the campaign");
    }
  }

  const message = taken
    ? `${domain} is already a campaign. Add a listing to it instead.`
    : phase === "failed"
      ? "We could not reach that address. Check it, or create it anyway."
      : "";

  const label =
    phase === "checking"
      ? "Checking…"
      : phase === "ok"
        ? "Verified"
        : phase === "failed"
          ? "Create anyway"
          : WIDEST_LABEL;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-6 p-8 sm:max-w-lg [&>[data-slot=dialog-close]]:top-6 [&>[data-slot=dialog-close]]:right-6">
        <DialogHeader className="gap-2">
          <DialogTitle>New Campaign</DialogTitle>
          <DialogDescription>CapyAds will verify the link.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="campaign-name">Campaign Name</Label>
            <Input
              id="campaign-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={60}
              required
              autoFocus={!isTouchDevice}
              // Read-only, not disabled: a disabled field drops focus and the
              // tab order jumps to the top of the dialog mid-check.
              readOnly={busy}
              placeholder="Craftlog"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="campaign-url">Target URL</Label>
            <div className="relative">
              <Input
                id="campaign-url"
                type="text"
                inputMode="url"
                enterKeyHint="go"
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value);
                  // Editing invalidates the last result, so the badge must go.
                  if (phase !== "checking") setPhase("idle");
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    submit();
                  }
                }}
                required
                readOnly={busy}
                autoComplete="url"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                placeholder="Place URL here"
                // The badge's room is held whether or not a badge is showing,
                // so a long URL never reflows when the check lands.
                className="pr-10 font-mono text-sm"
              />

              {(phase === "ok" || phase === "failed") && (
                <output
                  data-slot="url-status"
                  data-state={phase}
                  // Decorative for the mouse: a click near the edge of the pill
                  // must still land in the field.
                  className="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 select-none"
                  aria-label={phase === "ok" ? "Site answered" : "Site did not answer"}
                >
                  {phase === "ok" ? (
                    <Check size={14} weight="bold" />
                  ) : (
                    <X size={14} weight="bold" />
                  )}
                </output>
              )}
            </div>

            {/* One line is always reserved. A message that appears must not move
                the dialog, which is centred and would shift by half its growth. */}
            <p aria-live="polite" className="min-h-4 text-xs text-destructive">
              {message}
            </p>
          </div>
        </div>

        <div className="flex justify-end">
          <Button
            type="button"
            variant="inverted"
            size="lg"
            onClick={submit}
            // Only an unready form dims the button. A `disabled` verified state
            // would fade the one moment that should read as success, so the
            // busy states are held off with pointer-events and the guard in
            // `submit` instead.
            disabled={!ready}
            aria-disabled={!ready || busy}
            aria-busy={phase === "checking"}
            className={busy ? "pointer-events-none" : undefined}
          >
            {/* The labels are stacked in one cell, so the button is as wide as
                the longest of them and never resizes between states. */}
            <span className="grid items-center justify-items-center">
              <span aria-hidden className="invisible col-start-1 row-start-1 whitespace-nowrap">
                {WIDEST_LABEL}
              </span>
              <span className="col-start-1 row-start-1 flex items-center gap-2 whitespace-nowrap">
                {phase === "checking" && <CircleNotch size={16} className="animate-spin" />}
                {label}
              </span>
            </span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
