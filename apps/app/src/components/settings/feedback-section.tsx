import { ChatCenteredDots } from "@phosphor-icons/react";
import type { FeedbackReview, FeedbackType } from "@repo/contracts/types";
import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  EmptyState,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui";
import { useState } from "react";
import { toast } from "sonner";
import { useFeedbackQueue, useSetFeedbackResolved } from "../../lib/admin";

const TYPE_LABEL: Record<FeedbackType, string> = {
  bug: "Bug",
  feature: "Feature",
  other: "Other",
};

const TYPE_VARIANT: Record<FeedbackType, "danger" | "info" | "neutral"> = {
  bug: "danger",
  feature: "info",
  other: "neutral",
};

function StateBadge({ resolvedAt }: { resolvedAt: string | null }) {
  return resolvedAt ? (
    <Badge variant="success">Resolved</Badge>
  ) : (
    <Badge variant="warning">Open</Badge>
  );
}

function FeedbackReviewRow({
  item,
  onOpen,
}: {
  item: FeedbackReview;
  onOpen: (item: FeedbackReview) => void;
}) {
  const { feedback, owner } = item;
  const resolved = feedback.resolvedAt !== null;
  return (
    <TableRow
      onClick={() => onOpen(item)}
      className={resolved ? "cursor-pointer text-muted-foreground" : "cursor-pointer"}
    >
      <TableCell className="whitespace-nowrap">
        {new Date(feedback.createdAt).toLocaleDateString()}
      </TableCell>
      <TableCell className="min-w-0">
        <p data-usertext className="truncate font-medium">
          {owner.name}
        </p>
        <p data-usertext className="truncate font-mono text-xs text-muted-foreground">
          {owner.email}
        </p>
      </TableCell>
      <TableCell>
        <Badge variant={TYPE_VARIANT[feedback.type]}>{TYPE_LABEL[feedback.type]}</Badge>
      </TableCell>
      <TableCell className="max-w-md">
        <p data-usertext className="truncate">
          {feedback.message}
        </p>
      </TableCell>
      <TableCell>
        <StateBadge resolvedAt={feedback.resolvedAt} />
      </TableCell>
    </TableRow>
  );
}

/**
 * The feedback desk. A member sends feedback from the account menu, and an
 * admin reads it here, open rows first. A row opens to the whole message, and
 * the one act is to mark it resolved. The mark clears again from the same
 * place, because a wrong press has no confirm step in front of it.
 */
export function FeedbackSection() {
  const { data: queue, isLoading } = useFeedbackQueue();
  const setResolved = useSetFeedbackResolved();
  const [target, setTarget] = useState<FeedbackReview | null>(null);

  // Read the live row, so the dialog follows the list after a mark.
  const current = target
    ? (queue?.items.find((item) => item.feedback.id === target.feedback.id) ?? target)
    : null;

  function toggle() {
    if (!current) return;
    const resolved = current.feedback.resolvedAt === null;
    setResolved.mutate(
      { id: current.feedback.id, resolved },
      {
        onSuccess: () => toast.success(resolved ? "Marked resolved" : "Reopened"),
        onError: (err) => toast.error(err.message),
      },
    );
  }

  return (
    <div className="space-y-6">
      {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}

      {queue?.items.length === 0 && (
        <EmptyState
          icon={<ChatCenteredDots />}
          title="No feedback yet"
          description="Feedback appears here once a member sends it from the account menu."
        />
      )}

      {queue && queue.items.length > 0 && (
        <div className="rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sent</TableHead>
                <TableHead>Member</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Message</TableHead>
                <TableHead>State</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {queue.items.map((item) => (
                <FeedbackReviewRow key={item.feedback.id} item={item} onOpen={setTarget} />
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={current !== null} onOpenChange={(open) => !open && setTarget(null)}>
        <DialogContent className="sm:max-w-xl">
          {current && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Badge variant={TYPE_VARIANT[current.feedback.type]}>
                    {TYPE_LABEL[current.feedback.type]}
                  </Badge>
                  <StateBadge resolvedAt={current.feedback.resolvedAt} />
                </DialogTitle>
                <DialogDescription>
                  <span data-usertext>{current.owner.name}</span>{" "}
                  <span data-usertext className="font-mono text-xs">
                    {current.owner.email}
                  </span>
                  {" · "}
                  {new Date(current.feedback.createdAt).toLocaleString()}
                  {current.feedback.resolvedAt &&
                    ` · resolved ${new Date(current.feedback.resolvedAt).toLocaleString()}`}
                </DialogDescription>
              </DialogHeader>
              <p
                data-usertext
                className="max-h-[60vh] overflow-y-auto whitespace-pre-wrap break-words text-sm"
              >
                {current.feedback.message}
              </p>
              <DialogFooter>
                <Button
                  variant={current.feedback.resolvedAt ? "outline" : "default"}
                  onClick={toggle}
                  disabled={setResolved.isPending}
                >
                  {setResolved.isPending
                    ? "Saving…"
                    : current.feedback.resolvedAt
                      ? "Reopen"
                      : "Mark resolved"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
