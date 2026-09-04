import {
  ArrowLeft,
  ArrowRight,
  Check,
  CircleNotch,
  Globe,
  Plus,
  Rocket,
  Trash,
  UploadSimple,
  X,
} from "@phosphor-icons/react";
import { economy } from "@repo/config/economy";
import type { CreateProductInput, Product } from "@repo/contracts/types";
import {
  AdCard,
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
import {
  findLogoUrl,
  nameFromUrl,
  uploadLogo,
  useCreateProduct,
  useProductMetadata,
  useProducts,
  useUpdateProduct,
} from "../../lib/products";
import { isProbablyUrl, normalizeUrl } from "../../lib/url";
import { type Campaign, groupIntoCampaigns } from "./campaign-section";
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
   * When set, the flow skips straight to the ads step and points the new ad at
   * this campaign's site. The tagline starts empty.
   */
  campaign?: Campaign | null;
}

type Step = "campaign" | "link" | "ads" | "verify";

const STEPS: { key: Step; label: string }[] = [
  { key: "campaign", label: "Campaign" },
  { key: "link", label: "Product link" },
  { key: "ads", label: "Ads" },
];

/** Each step gets the width its content needs, not one width for all four. */
const STEP_WIDTH: Record<Step, string> = {
  campaign: "sm:max-w-lg",
  link: "sm:max-w-lg",
  ads: "sm:max-w-4xl",
  verify: "sm:max-w-xl",
};

/** A queued ad, waiting for the save that creates it. */
interface DraftAd {
  id: string;
  name: string;
  tagline: string;
  logoUrl: string | null;
}

let draftCounter = 0;

/** Autofocus is right in a modal on desktop and wrong on touch: it opens the keyboard. */
const isTouchDevice = typeof window !== "undefined" && "ontouchstart" in window;

const PANEL =
  "animate-in fade-in-0 slide-in-from-right-2 duration-200 ease-out motion-reduce:animate-none";

function StepRail({ step }: { step: Step }) {
  const current = STEPS.findIndex((s) => s.key === step);
  return (
    <ol className="flex items-center gap-2 text-xs">
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
  const { data: products } = useProducts();
  const campaigns = groupIntoCampaigns(products ?? []);
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
  /** The campaign the new ad joins. Null while the flow creates a new site. */
  const [target, setTarget] = useState<Campaign | null>(null);
  /** Extra taglines waiting for the save. Only offered on a campaign that exists. */
  const [queued, setQueued] = useState<DraftAd[]>([]);
  /** The product to verify. Set after a successful create, so the last step has a token. */
  const [created, setCreated] = useState<Product | null>(null);
  /** null before a check has run, then whether the origin answered. */
  const [reached, setReached] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(false);
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const taglineRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const create = useCreateProduct();
  const update = useUpdateProduct();
  const metadata = useProductMetadata();
  const saving = create.isPending || update.isPending;

  useEffect(() => {
    if (!open) return;
    const preset =
      campaign ?? (duplicateOf ? campaignOf(campaignsRef.current, duplicateOf.domain) : null);
    setName(seed?.name ?? preset?.ads[0]?.name ?? "");
    setUrl(seed?.url ?? preset?.ads[0]?.url ?? "");
    setTagline(duplicateOf?.tagline ?? product?.tagline ?? "");
    setLogoUrl(seed?.logoUrl ?? preset?.ads[0]?.logoUrl ?? "");
    setTarget(preset);
    setQueued([]);
    setCreated(null);
    setReached(null);
    setChecking(false);
    // Editing, duplicating and joining a campaign all know the site already, so
    // the first two steps would waste a click. A first-ever ad has nothing to
    // choose between, so it starts at the link.
    if (seed || preset) setStep("ads");
    else setStep("campaign");
    // The render-time `effectiveStep` below covers the case where the campaign
    // list is still empty at the moment the dialog opens.
  }, [open, seed, campaign, duplicateOf, product]);

  useEffect(() => {
    return () => {
      if (advanceTimer.current) clearTimeout(advanceTimer.current);
    };
  }, []);

  const logoUpload = useMutation({
    mutationFn: uploadLogo,
    onSuccess: (publicUrl) => {
      setLogoUrl(publicUrl);
      toast.success("Logo uploaded");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  /**
   * Checks the site without leaving the field. A pass fills the form and moves on;
   * a failure stays put with a red badge, so the URL can be corrected in place.
   *
   * "Answered" is not proof of ownership. That comes later, from the token.
   */
  async function goToDetails() {
    const targetUrl = normalizeUrl(url);
    if (!isProbablyUrl(targetUrl)) return;
    setUrl(targetUrl);
    setReached(null);
    setChecking(true);

    const [meta, icon] = await Promise.all([
      metadata.mutateAsync(targetUrl).catch(() => null),
      findLogoUrl(targetUrl),
    ]);

    // Either signal means something answered at that origin.
    const ok = Boolean(meta || icon);
    setChecking(false);
    setReached(ok);
    if (!ok) return;

    setName(meta?.name ?? nameFromUrl(targetUrl));
    if (meta?.tagline) setTagline(meta.tagline);
    const logo = meta?.logoUrl ?? icon;
    if (logo) setLogoUrl(logo);

    // Hold the badge long enough to register, then move on.
    advanceTimer.current = setTimeout(() => setStep("ads"), 900);
  }

  function chooseCampaign(next: Campaign | null) {
    setTarget(next);
    if (!next) {
      setStep("link");
      return;
    }
    const first = next.ads[0];
    setUrl(first?.url ?? "");
    setName(first?.name ?? "");
    setLogoUrl(first?.logoUrl ?? "");
    setTagline("");
    setStep("ads");
  }

  const remaining = economy.taglineMaxLength - tagline.length;
  const draftValid = name.trim().length > 0 && tagline.trim().length > 0 && remaining >= 0;
  const total = queued.length + (draftValid ? 1 : 0);

  function queueDraft() {
    if (!draftValid) return;
    draftCounter += 1;
    setQueued((list) => [
      ...list,
      {
        id: `draft_${draftCounter}`,
        name: name.trim(),
        tagline: tagline.trim(),
        logoUrl: logoUrl.trim() ? logoUrl.trim() : null,
      },
    ]);
    setTagline("");
    // The next tagline is the next thing typed, so the caret goes back there.
    taglineRef.current?.focus();
  }

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

    const inputs: CreateProductInput[] = [
      ...queued.map((draft) => ({
        name: draft.name,
        url: url.trim(),
        tagline: draft.tagline,
        logoUrl: draft.logoUrl,
      })),
      ...(draftValid ? [current] : []),
    ];
    if (inputs.length === 0) return;

    try {
      const saved: Product[] = [];
      // One POST per ad. Sequential, so a failure halfway leaves a clear count.
      for (const input of inputs) {
        saved.push(await create.mutateAsync(input));
      }
      const first = saved[0];
      if (!first) return;

      if (target) {
        toast.success(
          saved.length === 1 ? "Ad listed" : `${saved.length} ads listed on ${target.domain}`,
        );
        onOpenChange(false);
        return;
      }
      toast.success("Ad listed. One step left.");
      setCreated(first);
      setStep("verify");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    }
  }

  const TITLE: Record<Step, string> = {
    campaign: "Which site is this ad for?",
    link: "Link the product",
    ads: product ? "Edit ad" : duplicateOf ? "Duplicate ad" : target ? "Add an ad" : "Write the ad",
    verify: "Verify your domain",
  };

  const DESCRIPTION: Record<Step, string> = {
    campaign: "A campaign groups every ad that points at one site. Step 1 of 3.",
    link: "We read the page for a name, a tagline and a logo. Step 2 of 3.",
    ads: product
      ? "Changes go live after review."
      : target
        ? `It joins ${target.domain}, which is already verified.`
        : "Write the ad your card shows. Step 3 of 3.",
    verify: "One check and your ad can start earning.",
  };

  // A member with nothing listed has no campaign to choose between, so step 1 has
  // no content. This also covers the products query resolving after the dialog opens.
  const effectiveStep: Step = step === "campaign" && campaigns.length === 0 ? "link" : step;
  const showRail = !product && !duplicateOf && !target && effectiveStep !== "verify";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* Worst content (a long name plus a queue of taglines) is taller than a
          phone, so the panel scrolls instead of clipping. */}
      <DialogContent
        className={`max-h-[calc(100dvh-2rem)] gap-6 overflow-y-auto p-8 transition-[max-width] duration-200 ease-out ${STEP_WIDTH[effectiveStep]}`}
      >
        <DialogHeader className="gap-3">
          {showRail && <StepRail step={effectiveStep} />}
          <DialogTitle>{TITLE[effectiveStep]}</DialogTitle>
          <DialogDescription>{DESCRIPTION[effectiveStep]}</DialogDescription>
        </DialogHeader>

        {effectiveStep === "campaign" && (
          <div key="campaign" className={`space-y-2 ${PANEL}`}>
            <button
              type="button"
              onClick={() => chooseCampaign(null)}
              className="flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-left transition-colors duration-150 hover:bg-accent focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:outline-none"
            >
              <Rocket size={18} className="shrink-0 text-muted-foreground" />
              <span className="min-w-0">
                <span className="block text-sm font-medium">A new site</span>
                <span className="block text-xs text-muted-foreground">
                  Add the link and verify the domain.
                </span>
              </span>
              <ArrowRight size={16} className="ml-auto shrink-0 text-muted-foreground" />
            </button>

            <p className="pt-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Or a site you already list
            </p>
            <ul className="max-h-64 space-y-2 overflow-y-auto">
              {campaigns.map((c) => (
                <li key={c.domain}>
                  <button
                    type="button"
                    onClick={() => chooseCampaign(c)}
                    className="flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-left transition-colors duration-150 hover:bg-accent focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:outline-none"
                  >
                    <Globe size={18} className="shrink-0 text-muted-foreground" />
                    <span className="min-w-0">
                      <span className="block truncate font-mono text-sm">{c.domain}</span>
                      <span className="block text-xs text-muted-foreground">
                        {c.ads.length} {c.ads.length === 1 ? "ad" : "ads"} today
                      </span>
                    </span>
                    <ArrowRight size={16} className="ml-auto shrink-0 text-muted-foreground" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {effectiveStep === "link" && (
          <div key="link" className={`space-y-4 ${PANEL}`}>
            <div className="relative">
              <Input
                id="product-url"
                type="text"
                inputMode="url"
                aria-label="Product URL"
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value);
                  // Editing invalidates the last result, so the badge must go.
                  setReached(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !checking) {
                    e.preventDefault();
                    goToDetails();
                  }
                }}
                autoFocus={!isTouchDevice}
                disabled={checking}
                autoComplete="url"
                spellCheck={false}
                placeholder="Place URL here"
                className={`h-14 rounded-full pl-6 font-mono text-sm ${reached === null ? "pr-14" : "pr-24"}`}
              />

              {reached !== null && (
                <output
                  data-slot="url-status"
                  data-state={reached ? "ok" : "failed"}
                  className="absolute top-1/2 right-16 -translate-y-1/2"
                  aria-label={reached ? "Site answered" : "Site did not answer"}
                >
                  {reached ? <Check size={14} weight="bold" /> : <X size={14} weight="bold" />}
                </output>
              )}

              <Button
                type="button"
                size="icon"
                aria-label="Read this site"
                onClick={goToDetails}
                disabled={!isProbablyUrl(normalizeUrl(url)) || checking}
                className="absolute top-2 right-2 size-10 rounded-full disabled:bg-muted disabled:text-muted-foreground/40 disabled:opacity-100"
              >
                {checking ? (
                  <CircleNotch size={16} className="animate-spin" />
                ) : (
                  <ArrowRight size={16} />
                )}
              </Button>
            </div>

            {reached === false && (
              <p className="pl-6 text-xs text-destructive">
                We could not reach that address. Check it, or continue and fill the details in
                yourself.
              </p>
            )}

            <div className="flex justify-between">
              {campaigns.length > 0 ? (
                <Button type="button" variant="ghost" onClick={() => setStep("campaign")}>
                  <ArrowLeft size={16} />
                  Back
                </Button>
              ) : (
                <span />
              )}
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep("ads")}
                disabled={!isProbablyUrl(normalizeUrl(url))}
              >
                Continue without reading
              </Button>
            </div>
          </div>
        )}

        {effectiveStep === "ads" && (
          <form
            key="ads"
            onSubmit={submit}
            className={`grid gap-8 sm:grid-cols-[1fr_20rem] ${PANEL}`}
          >
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="product-url-edit">Product URL</Label>
                <Input
                  id="product-url-edit"
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  required
                  readOnly={Boolean(target)}
                  placeholder="https://craftlog.app"
                  className="font-mono text-sm read-only:text-muted-foreground"
                />
                {product && (
                  <p className="text-xs text-muted-foreground">
                    Changing the domain resets verification and sends the ad back to review.
                  </p>
                )}
                {target && (
                  <p className="text-xs text-muted-foreground">
                    Fixed by the campaign. Pick a new site to change it.
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="product-name">Name</Label>
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
                  ref={taglineRef}
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  maxLength={economy.taglineMaxLength}
                  required
                  placeholder="Ship notes for indie makers."
                  autoFocus={!isTouchDevice && Boolean(target)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="product-logo">Logo URL</Label>
                <div className="flex gap-2">
                  <Input
                    id="product-logo"
                    type="url"
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    placeholder="https://…/logo.png (optional)"
                    className="font-mono text-sm"
                    spellCheck={false}
                  />
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) logoUpload.mutate(file);
                      e.target.value = "";
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileRef.current?.click()}
                    disabled={logoUpload.isPending}
                  >
                    <UploadSimple size={16} />
                    {logoUpload.isPending ? "Uploading…" : "Upload"}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  PNG, JPEG or WebP up to 5 MB. Square images look best.
                </p>
              </div>

              {queued.length > 0 && (
                <ul className="divide-y rounded-lg border">
                  {queued.map((draft) => (
                    <li key={draft.id} className="flex items-center gap-3 py-2 pr-2 pl-3">
                      <span className="min-w-0 flex-1 truncate text-sm">{draft.tagline}</span>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        aria-label={`Remove the tagline "${draft.tagline}"`}
                        onClick={() =>
                          setQueued((list) => list.filter((row) => row.id !== draft.id))
                        }
                      >
                        <Trash size={14} />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}

              <div className="flex flex-wrap justify-end gap-3 pt-2">
                {!product && !target && campaigns.length > 0 && (
                  <Button type="button" variant="ghost" onClick={() => setStep("link")}>
                    <ArrowLeft size={16} />
                    Back
                  </Button>
                )}
                {/* Each ad carries its own verification token, so a brand-new site
                    stays at one ad. More taglines are one click from the campaign
                    header once the domain is verified. */}
                {target && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={queueDraft}
                    disabled={!draftValid}
                  >
                    <Plus size={16} />
                    Add another tagline
                  </Button>
                )}
                <Button
                  type="submit"
                  disabled={saving || remaining < 0 || (!product && total === 0)}
                >
                  {saving
                    ? "Saving…"
                    : product
                      ? "Save changes"
                      : target
                        ? `Add ${total} ${total === 1 ? "ad" : "ads"}`
                        : "List ad"}
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                Preview
              </p>
              <AdCard
                name={name || "Your product"}
                tagline={tagline || "Your tagline appears here."}
                logoUrl={logoUrl || null}
                size="medium"
                onClick={(e) => e.preventDefault()}
              />
              <AdCard
                name={name || "Your product"}
                tagline={tagline || "Your tagline appears here."}
                logoUrl={logoUrl || null}
                size="small"
                onClick={(e) => e.preventDefault()}
              />
            </div>
          </form>
        )}

        {effectiveStep === "verify" && created && (
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

/** The campaign a domain belongs to, or null when it is not listed yet. */
function campaignOf(campaigns: Campaign[], domain: string): Campaign | null {
  return campaigns.find((c) => c.domain === domain) ?? null;
}
