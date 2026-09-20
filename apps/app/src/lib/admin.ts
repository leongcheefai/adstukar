import type { Listing, ModerationQueue, Topup, TopupQueue } from "@repo/contracts/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "./api";

const queueKey = ["admin", "moderation"] as const;
const topupsKey = ["admin", "topups"] as const;

/** The listings that wait for a person to read them. */
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
