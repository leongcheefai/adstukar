import { economy } from "@repo/config/economy";
import type { Product } from "@repo/contracts/types";
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
import { Upload } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { uploadLogo, useCreateProduct, useUpdateProduct } from "../../lib/products";

interface ProductFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** When set, the dialog edits this product; otherwise it creates one. */
  product?: Product | null;
}

export function ProductFormDialog({ open, onOpenChange, product }: ProductFormDialogProps) {
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [tagline, setTagline] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setName(product?.name ?? "");
    setUrl(product?.url ?? "");
    setTagline(product?.tagline ?? "");
    setLogoUrl(product?.logoUrl ?? "");
  }, [open, product]);

  const create = useCreateProduct();
  const update = useUpdateProduct();
  const pending = create.isPending || update.isPending;

  const logoUpload = useMutation({
    mutationFn: uploadLogo,
    onSuccess: (publicUrl) => {
      setLogoUrl(publicUrl);
      toast.success("Logo uploaded");
    },
    onError: (err: Error) => toast.error(err.message),
  });

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
        toast.success("Product updated");
      } else {
        await create.mutateAsync(input);
        toast.success("Product created. Verify the domain next.");
      }
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    }
  }

  const remaining = economy.taglineMaxLength - tagline.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{product ? "Edit product" : "Register a product"}</DialogTitle>
          <DialogDescription>
            The card preview updates as you type. Keep the tagline short and concrete.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="grid gap-6 sm:grid-cols-[1fr_auto]">
          <div className="space-y-4">
            <div className="space-y-1.5">
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
            <div className="space-y-1.5">
              <Label htmlFor="product-url">Product URL</Label>
              <Input
                id="product-url"
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                required
                placeholder="https://craftlog.app"
                className="font-mono text-[13px]"
              />
              {product && (
                <p className="text-xs text-muted-foreground">
                  Changing the domain resets verification and sends the product back to review.
                </p>
              )}
            </div>
            <div className="space-y-1.5">
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
            <div className="space-y-1.5">
              <Label htmlFor="product-logo">Logo URL</Label>
              <div className="flex gap-2">
                <Input
                  id="product-logo"
                  type="url"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder="https://…/logo.png (optional)"
                  className="font-mono text-[13px]"
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
                  <Upload size={14} />
                  {logoUpload.isPending ? "Uploading…" : "Upload"}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                PNG, JPEG or WebP up to 5 MB. Square images look best.
              </p>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={pending || remaining < 0}>
                {pending ? "Saving…" : product ? "Save changes" : "Create product"}
              </Button>
            </div>
          </div>
          <div className="space-y-3">
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
      </DialogContent>
    </Dialog>
  );
}
