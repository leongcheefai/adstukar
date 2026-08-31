import type { ModerationItem, Product } from "@repo/contracts/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "./api";

const queueKey = ["admin", "moderation"] as const;

export function useModerationQueue() {
  return useQuery({
    queryKey: queueKey,
    queryFn: () => apiFetch<ModerationItem[]>("/admin/moderation"),
  });
}

export function useApproveProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<Product>(`/admin/products/${id}/approve`, { method: "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: queueKey }),
  });
}

export function useRejectProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      apiFetch<Product>(`/admin/products/${id}/reject`, { method: "POST", body: { reason } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: queueKey }),
  });
}
