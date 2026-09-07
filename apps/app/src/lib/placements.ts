import type { CreatePlacementInput, Placement, UpdatePlacementInput } from "@repo/contracts/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "./api";

/** The overlay regions on a device. One device holds several; one plays at a time. */
export const placementsKey = ["placements"] as const;

export function usePlacements(deviceId?: string) {
  return useQuery({
    queryKey: [...placementsKey, deviceId ?? null],
    queryFn: () =>
      apiFetch<Placement[]>(deviceId ? `/placements?deviceId=${deviceId}` : "/placements"),
  });
}

function useInvalidate() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: placementsKey });
}

export function useCreatePlacement() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (input: CreatePlacementInput) =>
      apiFetch<Placement>("/placements", { method: "POST", body: input }),
    onSuccess: invalidate,
  });
}

export function useUpdatePlacement() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdatePlacementInput }) =>
      apiFetch<Placement>(`/placements/${id}`, { method: "PATCH", body: input }),
    onSuccess: invalidate,
  });
}

export function useDeletePlacement() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (id: string) => apiFetch<{ id: string }>(`/placements/${id}`, { method: "DELETE" }),
    onSuccess: invalidate,
  });
}
