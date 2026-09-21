import { ChatCenteredDots } from "@phosphor-icons/react";
import type { FeedbackReview, FeedbackType } from "@repo/contracts/types";
import {
  Badge,
  EmptyState,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui";
import { useFeedbackQueue } from "../../lib/admin";

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

function FeedbackReviewRow({ item }: { item: FeedbackReview }) {
  const { feedback, owner } = item;
  return (
    <TableRow>
      <TableCell className="whitespace-nowrap align-top">
        {new Date(feedback.createdAt).toLocaleDateString()}
      </TableCell>
      <TableCell className="min-w-0 align-top">
        <p data-usertext className="truncate font-medium">
          {owner.name}
        </p>
        <p data-usertext className="truncate font-mono text-xs text-muted-foreground">
          {owner.email}
        </p>
      </TableCell>
      <TableCell className="align-top">
        <Badge variant={TYPE_VARIANT[feedback.type]}>{TYPE_LABEL[feedback.type]}</Badge>
      </TableCell>
      <TableCell className="max-w-xl align-top">
        <p data-usertext className="whitespace-pre-wrap break-words">
          {feedback.message}
        </p>
      </TableCell>
    </TableRow>
  );
}

/**
 * The feedback desk. A member sends feedback from the account menu, and an
 * admin reads it here, newest first. There is nothing to press: the row is the
 * whole act.
 */
export function FeedbackSection() {
  const { data: queue, isLoading } = useFeedbackQueue();

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
              </TableRow>
            </TableHeader>
            <TableBody>
              {queue.items.map((item) => (
                <FeedbackReviewRow key={item.feedback.id} item={item} />
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
