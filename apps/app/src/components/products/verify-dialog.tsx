import type { Product } from "@repo/contracts/types";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@repo/ui";
import { ShieldCheck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useVerifyProduct } from "../../lib/products";
import { CopyButton } from "../copy-button";

export function VerifyDialog({
  open,
  onOpenChange,
  product,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product | null;
}) {
  const verify = useVerifyProduct();
  const [message, setMessage] = useState<string | null>(null);
  if (!product) return null;

  const token = `adstukar-verify=${product.verificationToken}`;
  const wellKnown = `https://${product.domain}/.well-known/adstukar.txt`;

  async function run() {
    if (!product) return;
    setMessage(null);
    try {
      const result = await verify.mutateAsync(product.id);
      setMessage(result.message);
      if (result.verified) {
        toast.success("Domain verified");
        onOpenChange(false);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Verification failed");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Verify {product.domain}</DialogTitle>
          <DialogDescription>
            Prove you control the domain with one of the two methods, then click Verify.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-5">
          <div className="space-y-2">
            <p className="text-sm font-medium">Your token</p>
            <div className="flex items-center gap-2">
              <code className="min-w-0 flex-1 truncate rounded-md border bg-muted px-2 py-1.5 font-mono text-xs">
                {token}
              </code>
              <CopyButton value={token} size="icon" label="Copy token" />
            </div>
          </div>
          <ol className="space-y-4 text-sm">
            <li className="space-y-1">
              <p className="font-medium">Option A — well-known file</p>
              <p className="text-muted-foreground">
                Serve a plain-text file containing the token at{" "}
                <code className="font-mono text-xs">{wellKnown}</code>.
              </p>
            </li>
            <li className="space-y-1">
              <p className="font-medium">Option B — DNS TXT record</p>
              <p className="text-muted-foreground">
                Add a TXT record on <code className="font-mono text-xs">{product.domain}</code> with
                the token as its value. DNS changes can take a few minutes.
              </p>
            </li>
          </ol>
          {message && <p className="text-sm text-muted-foreground">{message}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            <Button type="button" onClick={run} disabled={verify.isPending}>
              <ShieldCheck size={14} />
              {verify.isPending ? "Checking…" : "Verify"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
