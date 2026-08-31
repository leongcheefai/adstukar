import type {
  CreatePlacementInput,
  PlacementWithTerms,
  UpdatePlacementInput,
} from "@repo/contracts/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "./api";

export const placementsKey = ["placements"] as const;

export function usePlacements() {
  return useQuery({
    queryKey: placementsKey,
    queryFn: () => apiFetch<PlacementWithTerms[]>("/placements"),
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
      apiFetch<PlacementWithTerms>("/placements", { method: "POST", body: input }),
    onSuccess: invalidate,
  });
}

export function useUpdatePlacement() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdatePlacementInput }) =>
      apiFetch<PlacementWithTerms>(`/placements/${id}`, { method: "PATCH", body: input }),
    onSuccess: invalidate,
  });
}

export function useRotateKey() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<PlacementWithTerms>(`/placements/${id}/rotate-key`, { method: "POST" }),
    onSuccess: invalidate,
  });
}

export function useSetExcludedTerms() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, phrases }: { id: string; phrases: string[] }) =>
      apiFetch<PlacementWithTerms>(`/placements/${id}/excluded-terms`, {
        method: "PUT",
        body: { phrases },
      }),
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
