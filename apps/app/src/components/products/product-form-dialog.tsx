import {
  ArrowLeft,
  ArrowRight,
  Check,
  CircleNotch,
  Globe,
  Trash,
  UploadSimple,
} from "@phosphor-icons/react";
import { economy } from "@repo/config/economy";
import type { CreateProductInput, Product } from "@repo/contracts/types";
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
import { useMutation } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { type Campaign, campaignOf, isVerified, useCampaigns } from "../../lib/campaigns";
import { uploadLogo, useCreateProduct, useUpdateProduct } from "../../lib/products";
import { domainOf } from "../../lib/url";
import { VerifyPanel } from "./verify-panel";

interface ProductFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** When set, the dialog edits this product; otherwise it lists a new one. */
  product?: Product | null;
  /**
   * When set, the fields start from this product but the save creates a new
   * listing. Used to run a second tagline against the same site.
   */
  duplicateOf?: Product | null;
  /**
   * When set, the flow skips the chooser and points the new ad at this
   * campaign's site. The tagline starts empty.
   */
  campaign?: Campaign | null;
}

type Step = "campaign" | "ads" | "verify";

const STEPS: { key: Step; label: string }[] = [
  { key: "campaign", label: "Campaign" },
  { key: "ads", label: "Ad" },
];

/** Each step gets the width its content needs, not one width for all three. */
const STEP_WIDTH: Record<Step, string> = {
  campaign: "sm:max-w-lg",
  ads: "sm:max-w-lg",
  verify: "sm:max-w-xl",
};

/** Autofocus is right in a modal on desktop and wrong on touch: it opens the keyboard. */
const isTouchDevice = typeof window !== "undefined" && "ontouchstart" in window;

/** What the presign route and the copy below both accept. */
const LOGO_TYPES = "image/png,image/jpeg,image/webp";
const LOGO_MAX_BYTES = 5 * 1024 * 1024;

const PANEL =
  "animate-in fade-in-0 slide-in-from-right-2 duration-200 ease-out motion-reduce:animate-none";

function StepRail({ step }: { step: Step }) {
  const current = STEPS.findIndex((s) => s.key === step);
  return (
    <ol className="mb-2 flex items-center gap-2 text-xs">
      {STEPS.map((s, i) => {
        const state = i < current ? "done" : i === current ? "current" : "todo";
        return (
          <li key={s.key} className="flex items-center gap-2">
            <span
              className={
                state === "current"
                  ? "flex items-center gap-1.5 font-medium text-foreground"
                  : "flex items-center gap-1.5 text-muted-foreground"
              }
            >
              <span
                aria-hidden
                className={`flex size-5 items-center justify-center rounded-full font-mono text-[10px] ${
                  state === "todo"
                    ? "bg-muted text-muted-foreground"
                    : "bg-primary text-primary-foreground"
                }`}
              >
                {state === "done" ? <Check size={11} weight="bold" /> : i + 1}
              </span>
              {s.label}
            </span>
            {i < STEPS.length - 1 && <span aria-hidden className="h-px w-6 bg-border" />}
          </li>
        );
      })}
    </ol>
  );
}

export function ProductFormDialog({
  open,
  onOpenChange,
  product,
  duplicateOf,
  campaign,
}: ProductFormDialogProps) {
  const { campaigns } = useCampaigns();
  /**
   * The open effect needs the campaign list but must not re-run when it changes:
   * it is rebuilt on every render, and a background refetch would reset a
   * half-typed form. A ref gives the effect the current list at no cost.
   */
  const campaignsRef = useRef(campaigns);
  campaignsRef.current = campaigns;

  // Both modes prefill from a product; only `product` makes the save an update.
  const seed = product ?? duplicateOf ?? null;
  const [step, setStep] = useState<Step>("campaign");
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [tagline, setTagline] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  /** The campaign the new ad joins. Null until the chooser answers. */
  const [target, setTarget] = useState<Campaign | null>(null);
  /** The product to verify. Set after a successful create, so the last step has a token. */
  const [created, setCreated] = useState<Product | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const create = useCreateProduct();
  const update = useUpdateProduct();
  const saving = create.isPending || update.isPending;

  useEffect(() => {
    if (!open) return;
    const preset =
      campaign ?? (duplicateOf ? campaignOf(campaignsRef.current, duplicateOf.domain) : null);
    setName(seed?.name ?? preset?.name ?? "");
    setUrl(seed?.url ?? preset?.url ?? "");
    setTagline(duplicateOf?.tagline ?? product?.tagline ?? "");
    setLogoUrl(seed?.logoUrl ?? preset?.logoUrl ?? "");
    setDragging(false);
    setTarget(preset);
    setCreated(null);
    // Editing, duplicating and joining a campaign all know the site already, so
    // the chooser would waste a click.
    if (seed || preset) setStep("ads");
    else setStep("campaign");
  }, [open, seed, campaign, duplicateOf, product]);

  function takeLogo(file: File) {
    if (!LOGO_TYPES.split(",").includes(file.type)) {
      toast.error("Use a PNG, JPEG or WebP image");
      return;
    }
    if (file.size > LOGO_MAX_BYTES) {
      toast.error("That image is over 5 MB");
      return;
    }
    logoUpload.mutate(file);
  }

  const logoUpload = useMutation({
    mutationFn: uploadLogo,
    onSuccess: (publicUrl) => {
      setLogoUrl(publicUrl);
      toast.success("Logo uploaded");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  function chooseCampaign(next: Campaign) {
    setTarget(next);
    setUrl(next.url);
    setName(next.name);
    setLogoUrl(next.logoUrl ?? "");
    setTagline("");
    setStep("ads");
  }

  /**
   * A campaign created before its first ad has no verified domain, so joining
   * one still owes the token step. Only a campaign with a verified ad skips it.
   */
  const targetVerified = target ? isVerified(target) : false;

  const site = campaignOf(campaigns, domainOf(url));

  const remaining = economy.taglineMaxLength - tagline.length;
  const valid = name.trim().length > 0 && tagline.trim().length > 0 && remaining >= 0;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const current: CreateProductInput = {
      name: name.trim(),
      url: url.trim(),
      tagline: tagline.trim(),
      logoUrl: logoUrl.trim() ? logoUrl.trim() : null,
    };

    if (product) {
      try {
        await update.mutateAsync({ id: product.id, input: current });
        toast.success("Ad updated");
        onOpenChange(false);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Save failed");
      }
      return;
    }

    if (!valid) return;

    try {
      const saved = await create.mutateAsync(current);

      if (targetVerified) {
        toast.success("Ad listed");
        onOpenChange(false);
        return;
      }
      // The domain has never been proved, so the token step is still owed.
      toast.success("Ad listed. One step left.");
      setCreated(saved);
      setStep("verify");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    }
  }

  const TITLE: Record<Step, string> = {
    campaign: "Which campaign is this ad for?",
    ads: product ? "Edit ad" : duplicateOf ? "Duplicate ad" : "List your ads",
    verify: "Verify your domain",
  };

  const DESCRIPTION: Record<Step, string> = {
    campaign: "A campaign is one site. Every ad in it points at that site. Step 1 of 2.",
    ads: product ? "Changes go live after review." : "",
    verify: "One check and your ad can start earning.",
  };

  const showRail = !product && !duplicateOf && !campaign && step !== "verify";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* Worst content (a long name plus a queue of taglines) is taller than a
          phone, so the panel scrolls instead of clipping. */}
      <DialogContent
        {...(DESCRIPTION[step] ? {} : { "aria-describedby": undefined })}
        className={`max-h-[calc(100dvh-2rem)] gap-6 overflow-y-auto p-8 transition-[max-width] duration-200 ease-out [&>[data-slot=dialog-close]]:top-6 [&>[data-slot=dialog-close]]:right-6 ${STEP_WIDTH[step]}`}
      >
        <DialogHeader className="gap-2">
          {showRail && <StepRail step={step} />}
          <DialogTitle>{TITLE[step]}</DialogTitle>
          {DESCRIPTION[step] && <DialogDescription>{DESCRIPTION[step]}</DialogDescription>}
        </DialogHeader>

        {step === "campaign" && (
          <div key="campaign" className={PANEL}>
            {campaigns.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No campaign yet. Create one first, then write its ads.
              </p>
            ) : (
              <ul className="max-h-80 space-y-2 overflow-y-auto">
                {campaigns.map((c) => (
                  <li key={c.domain}>
                    <button
                      type="button"
                      onClick={() => chooseCampaign(c)}
                      className="flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-left transition-colors duration-150 hover:bg-accent focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:outline-none"
                    >
                      <Globe size={18} className="shrink-0 text-muted-foreground" />
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium">{c.name}</span>
                        <span className="block truncate font-mono text-xs text-muted-foreground">
                          {c.domain} · {c.ads.length} {c.ads.length === 1 ? "ad" : "ads"}
                        </span>
                      </span>
                      <ArrowRight size={16} className="ml-auto shrink-0 text-muted-foreground" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {step === "ads" && (
          <form key="ads" onSubmit={submit} className={`space-y-6 ${PANEL}`}>
            {/* The campaign the ad joins, shown and not asked. Its name and its
                URL belong to the campaign, so they change in the campaign
                dialog. This form writes the ad. */}
            <div className="space-y-1">
              {/* data-slot="label" is the theme's hook for the caption face, so
                  this row reads as the field it stands in for. */}
              <span data-slot="label" className="block text-muted-foreground">
                Campaign
              </span>
              <p className="truncate text-xl font-semibold tracking-tight">{site?.name ?? name}</p>
              <p className="truncate font-mono text-sm text-muted-foreground">{url}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="product-name">Ad name</Label>
              <Input
                id="product-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={60}
                required
                placeholder="Craftlog"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="product-tagline">Tagline</Label>
                <span
                  className={`font-mono text-xs tabular-nums ${remaining < 0 ? "text-destructive" : "text-muted-foreground"}`}
                >
                  {remaining}
                </span>
              </div>
              <Input
                id="product-tagline"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                maxLength={economy.taglineMaxLength}
                required
                placeholder="Ship notes for indie makers."
                autoFocus={!isTouchDevice && Boolean(target)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="product-logo">Logo</Label>

              <input
                ref={fileRef}
                id="product-logo"
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
                  <p className="min-w-0 flex-1 truncate text-sm text-muted-foreground">
                    Logo added
                  </p>
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
                  className={`flex w-full flex-col items-center justify-center gap-1 rounded-lg border border-dashed px-4 py-6 text-center transition-colors duration-150 hover:bg-accent focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:outline-none disabled:pointer-events-none ${
                    dragging ? "border-primary bg-accent" : "border-border"
                  }`}
                >
                  {logoUpload.isPending ? (
                    <CircleNotch size={20} className="animate-spin text-muted-foreground" />
                  ) : (
                    <UploadSimple size={20} className="text-muted-foreground" />
                  )}
                  <span className="text-sm font-medium">
                    {logoUpload.isPending ? "Uploading…" : "Drop a logo, or click to choose"}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    PNG, JPEG or WebP up to 5 MB. Square images look best.
                  </span>
                </button>
              )}
            </div>

            <div className="flex flex-wrap justify-end gap-3 pt-2">
              {!product && !duplicateOf && !campaign && campaigns.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="lg"
                  onClick={() => setStep("campaign")}
                  // Pulls the label back to the panel edge the fields start at.
                  className="-ml-4 mr-auto"
                >
                  <ArrowLeft size={16} />
                  Back
                </Button>
              )}
              <Button type="submit" variant="inverted" size="lg" disabled={saving || !valid}>
                {saving ? "Saving…" : product ? "Save changes" : "Sent for review"}
              </Button>
            </div>
          </form>
        )}

        {step === "verify" && created && (
          <VerifyPanel
            product={created}
            onDone={() => onOpenChange(false)}
            doneLabel="I will do this later"
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
