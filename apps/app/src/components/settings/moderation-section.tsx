import { ArrowSquareOut, Check, Tray, X } from "@phosphor-icons/react";
import type { ModerationItem } from "@repo/contracts/types";
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
} from "@repo/ui";
import { useState } from "react";
import { toast } from "sonner";
import { useApproveProduct, useModerationQueue, useRejectProduct } from "../../lib/admin";

function QueueRow({
  item,
  onReject,
}: { item: ModerationItem; onReject: (item: ModerationItem) => void }) {
  const approve = useApproveProduct();
  const { product, owner } = item;
  return (
    <Card>
      <CardContent className="flex flex-col gap-4 pt-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium">{product.name}</p>
            {product.verifiedAt ? (
              <Badge variant="success">Verified</Badge>
            ) : (
              <Badge variant="warning">Domain not verified</Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">{product.tagline}</p>
          <p className="text-xs text-muted-foreground">
            {owner.name} · <span className="font-mono">{owner.email}</span> · submitted{" "}
            {new Date(product.createdAt).toLocaleDateString()}
          </p>
          <a
            href={product.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-mono text-xs underline-offset-4 hover:underline"
          >
            Open landing page <ArrowSquareOut size={11} />
          </a>
        </div>
        <div className="flex flex-col gap-3 lg:items-end">
          <AdCard
            name={product.name}
            tagline={product.tagline}
            logoUrl={product.logoUrl}
            size="small"
            onClick={(e) => e.preventDefault()}
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() =>
                approve.mutate(product.id, {
                  onSuccess: () => toast.success(`${product.name} approved`),
                  onError: (err) => toast.error(err.message),
                })
              }
              disabled={approve.isPending || !product.verifiedAt}
            >
              <Check size={14} />
              Approve
            </Button>
            <Button size="sm" variant="outline" onClick={() => onReject(item)}>
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
  const reject = useRejectProduct();
  const [target, setTarget] = useState<ModerationItem | null>(null);
  const [reason, setReason] = useState("");

  function submitReject(e: React.FormEvent) {
    e.preventDefault();
    if (!target) return;
    reject.mutate(
      { id: target.product.id, reason: reason.trim() },
      {
        onSuccess: () => {
          toast.success(`${target.product.name} rejected`);
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

      {queue && queue.length === 0 && (
        <EmptyState
          icon={<Tray />}
          title="Queue is empty"
          description="Nothing waits for review."
        />
      )}

      <div className="space-y-3">
        {queue?.map((item) => (
          <QueueRow key={item.product.id} item={item} onReject={setTarget} />
        ))}
      </div>

      <Dialog open={target !== null} onOpenChange={(open) => !open && setTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reject {target?.product.name}</DialogTitle>
            <DialogDescription>The owner sees this reason on their product.</DialogDescription>
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
                placeholder="Landing page does not match the tagline."
              />
            </div>
            <Button type="submit" className="w-full" disabled={reject.isPending}>
              {reject.isPending ? "Rejecting…" : "Reject product"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
