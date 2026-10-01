import type {
  CompSlotInput,
  CompedSlot,
  CompedSlots,
  DeviceForAdmin,
  Feedback,
  FeedbackQueue,
  Listing,
  ModerationQueue,
  Pool,
  Topup,
  TopupQueue,
} from "@repo/contracts/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "./api";
import { campaignsKey } from "./campaigns";
import { slotLoopKey, slotsKey } from "./slots-api";

const queueKey = ["admin", "moderation"] as const;
const topupsKey = ["admin", "topups"] as const;
const feedbackKey = ["admin", "feedback"] as const;
const poolKey = ["admin", "pool"] as const;
const compsKey = ["admin", "slots", "comped"] as const;

/** The listings and the screens that wait for a person to review them. */
export function useModerationQueue() {
  return useQuery({
    queryKey: queueKey,
    queryFn: () => apiFetch<ModerationQueue>("/admin/moderation"),
  });
}

function useInvalidate() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: queueKey });
}

export function useApproveListing() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<Listing>(`/admin/listings/${id}/approve`, { method: "POST" }),
    onSuccess: invalidate,
  });
}

export function useRejectListing() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      apiFetch<Listing>(`/admin/listings/${id}/reject`, { method: "POST", body: { reason } }),
    onSuccess: invalidate,
  });
}

export function useApproveDevice() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<DeviceForAdmin>(`/admin/devices/${id}/approve`, { method: "POST" }),
    onSuccess: invalidate,
  });
}

export function useRejectDevice() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      apiFetch<DeviceForAdmin>(`/admin/devices/${id}/reject`, {
        method: "POST",
        body: { reason },
      }),
    onSuccess: invalidate,
  });
}

/** Every top-up that took money, newest first, and what each may still give back. */
export function useTopupQueue() {
  return useQuery({
    queryKey: topupsKey,
    queryFn: () => apiFetch<TopupQueue>("/admin/topups"),
  });
}

/** Admin: gives the unspent part of one top-up back. A member never calls this. */
export function useRefundTopup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch<Topup>(`/admin/topups/${id}/refund`, { method: "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: topupsKey }),
  });
}

/** Every piece of feedback a member sent, open rows first. */
export function useFeedbackQueue() {
  return useQuery({
    queryKey: feedbackKey,
    queryFn: () => apiFetch<FeedbackQueue>("/admin/feedback"),
  });
}

/** Admin: stamps one piece of feedback resolved, or clears the stamp. */
export function useSetFeedbackResolved() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, resolved }: { id: string; resolved: boolean }) =>
      apiFetch<Feedback>(`/admin/feedback/${id}/${resolved ? "resolve" : "reopen"}`, {
        method: "POST",
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: feedbackKey }),
  });
}

/** The week's slot revenue beside the week's earn. */
export function usePool() {
  return useQuery({
    queryKey: poolKey,
    queryFn: () => apiFetch<Pool>("/admin/pool"),
  });
}

/** The live slots an admin gave away, and how many more the cap allows. */
export function useCompedSlots() {
  return useQuery({
    queryKey: compsKey,
    queryFn: () => apiFetch<CompedSlots>("/admin/slots/comped"),
  });
}

/** Admin: gives a member a slot for nothing. It runs as a paid one does. */
export function useCompSlot() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CompSlotInput) =>
      apiFetch<CompedSlot>("/admin/slots/comped", { method: "POST", body: input }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: compsKey });
      qc.invalidateQueries({ queryKey: slotLoopKey });
      // An admin who gives a slot to their own account sees it at once.
      qc.invalidateQueries({ queryKey: slotsKey });
      qc.invalidateQueries({ queryKey: campaignsKey });
    },
  });
}
