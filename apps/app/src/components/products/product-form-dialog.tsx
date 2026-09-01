import { ArrowLeft, ArrowRight, Check, CircleNotch, UploadSimple, X } from "@phosphor-icons/react";
import { economy } from "@repo/config/economy";
import type { Product } from "@repo/contracts/types";
import {
  AdCard,
  Button,
  Dialog,
  DialogContent,
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
  useUpdateProduct,
} from "../../lib/products";
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
}

type Step = "url" | "details" | "verify";

/** Each step gets the width its content needs, not one width for all three. */
const STEP_WIDTH: Record<Step, string> = {
  url: "sm:max-w-lg",
  details: "sm:max-w-4xl",
  verify: "sm:max-w-xl",
};

function isProbablyUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

/** Accepts "craftlog.app" as readily as the full URL. */
function normalizeUrl(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export function ProductFormDialog({
  open,
  onOpenChange,
  product,
  duplicateOf,
}: ProductFormDialogProps) {
  // Both modes prefill from a product; only `product` makes the save an update.
  const seed = product ?? duplicateOf ?? null;
  const [step, setStep] = useState<Step>("url");
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [tagline, setTagline] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  /** The product to verify. Set after a successful create, so step three has a token. */
  const [created, setCreated] = useState<Product | null>(null);
  /** null before a check has run, then whether the origin answered. */
  const [reached, setReached] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(false);
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const create = useCreateProduct();
  const update = useUpdateProduct();
  const metadata = useProductMetadata();
  const saving = create.isPending || update.isPending;

  useEffect(() => {
    if (!open) return;
    setName(seed?.name ?? "");
    setUrl(seed?.url ?? "");
    setTagline(seed?.tagline ?? "");
    setLogoUrl(seed?.logoUrl ?? "");
    setCreated(null);
    setReached(null);
    setChecking(false);
    // A prefilled form already has a URL, so the link step would waste a click.
    setStep(seed ? "details" : "url");
  }, [open, seed]);

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
    const target = normalizeUrl(url);
    if (!isProbablyUrl(target)) return;
    setUrl(target);
    setReached(null);
    setChecking(true);

    const [meta, icon] = await Promise.all([
      metadata.mutateAsync(target).catch(() => null),
      findLogoUrl(target),
    ]);

    // Either signal means something answered at that origin.
    const ok = Boolean(meta || icon);
    setChecking(false);
    setReached(ok);
    if (!ok) return;

    setName(meta?.name ?? nameFromUrl(target));
    if (meta?.tagline) setTagline(meta.tagline);
    const logo = meta?.logoUrl ?? icon;
    if (logo) setLogoUrl(logo);

    // Hold the badge long enough to register, then move on.
    advanceTimer.current = setTimeout(() => setStep("details"), 900);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const input = {
      name: name.trim(),
      url: url.trim(),
      tagline: tagline.trim(),
      logoUrl: logoUrl.trim() ? logoUrl.trim() : null,
    };
    try {
      if (product) {
        await update.mutateAsync({ id: product.id, input });
        toast.success("Ad updated");
        onOpenChange(false);
      } else {
        const saved = await create.mutateAsync(input);
        toast.success("Ad listed. One step left.");
        setCreated(saved);
        setStep("verify");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    }
  }

  const hostLabel = (() => {
    try {
      return new URL(normalizeUrl(url)).hostname.replace(/^www\./, "");
    } catch {
      return url;
    }
  })();

  const remaining = economy.taglineMaxLength - tagline.length;
  const canContinue = isProbablyUrl(normalizeUrl(url));

  const TITLE: Record<Step, string> = {
    url: "List an ad",
    details: product ? "Edit ad" : duplicateOf ? "Duplicate ad" : "Review your ad",
    verify: "Verify your domain",
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={`gap-8 p-8 transition-[max-width] duration-200 ease-out ${STEP_WIDTH[step]}`}
      >
        <DialogHeader>
          <DialogTitle>{TITLE[step]}</DialogTitle>
        </DialogHeader>

        {step === "url" && (
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
                if (e.key === "Enter" && canContinue && !checking) {
                  e.preventDefault();
                  goToDetails();
                }
              }}
              autoFocus
              disabled={checking}
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
              aria-label="Continue"
              onClick={goToDetails}
              disabled={!canContinue || checking}
              className="absolute top-2 right-2 size-10 rounded-full disabled:bg-muted disabled:text-muted-foreground/40 disabled:opacity-100"
            >
              {checking ? (
                <CircleNotch size={16} className="animate-spin" />
              ) : (
                <ArrowRight size={16} />
              )}
            </Button>

            {reached === false && (
              <p className="mt-3 pl-6 text-xs text-destructive">
                We could not reach that address. Check it, or continue and fill the details in
                yourself.
              </p>
            )}
          </div>
        )}

        {step === "details" && (
          <form onSubmit={submit} className="grid gap-8 sm:grid-cols-[1fr_20rem]">
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="product-url-edit">Product URL</Label>
                <Input
                  id="product-url-edit"
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  required
                  placeholder="https://craftlog.app"
                  className="font-mono text-sm"
                />
                {product && (
                  <p className="text-xs text-muted-foreground">
                    Changing the domain resets verification and sends the ad back to review.
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
                    className={`font-mono text-xs ${remaining < 0 ? "text-destructive" : "text-muted-foreground"}`}
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

              <div className="flex justify-end gap-3 pt-2">
                {!product && (
                  <Button type="button" variant="ghost" onClick={() => setStep("url")}>
                    <ArrowLeft size={16} />
                    Back
                  </Button>
                )}
                <Button type="submit" disabled={saving || remaining < 0}>
                  {saving ? "Saving…" : product ? "Save changes" : "List ad"}
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
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
