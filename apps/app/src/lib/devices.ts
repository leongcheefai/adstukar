import type { CreateDeviceInput, DeviceWithTerms } from "@repo/contracts/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "./api";

/** The member's own screens. Each one was registered from the set it runs on. */
export const devicesKey = ["devices"] as const;

export function useDevices() {
  return useQuery({
    queryKey: devicesKey,
    queryFn: () => apiFetch<DeviceWithTerms[]>("/devices"),
  });
}

export function useCreateDevice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateDeviceInput) =>
      apiFetch<DeviceWithTerms>("/devices", { method: "POST", body: input }),
    onSuccess: () => qc.invalidateQueries({ queryKey: devicesKey }),
  });
}

export function useRenameDevice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      apiFetch<DeviceWithTerms>(`/devices/${id}`, { method: "PATCH", body: { name } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: devicesKey }),
  });
}

/** An archive, not a delete: the plays and the earnings keep pointing at the row. */
export function useArchiveDevice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch<{ id: string }>(`/devices/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: devicesKey }),
  });
}
