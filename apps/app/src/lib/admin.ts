import type { DeviceForAdmin, DeviceTier, Listing, ModerationQueue } from "@repo/contracts/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "./api";

const queueKey = ["admin", "moderation"] as const;

/** One queue, two kinds of work: listings to read and devices to price. */
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

/** Approving a device stamps its tier, and the tier sets the rate it earns. */
export function useApproveDevice() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, tier }: { id: string; tier: DeviceTier }) =>
      apiFetch<DeviceForAdmin>(`/admin/devices/${id}/approve`, { method: "POST", body: { tier } }),
    onSuccess: invalidate,
  });
}

export function useRejectDevice() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      apiFetch<DeviceForAdmin>(`/admin/devices/${id}/reject`, { method: "POST", body: { reason } }),
    onSuccess: invalidate,
  });
}
