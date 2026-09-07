import type { CreateDeviceInput, DeviceWithTerms, UpdateDeviceInput } from "@repo/contracts/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "./api";

export const devicesKey = ["devices"] as const;

export function useDevices() {
  return useQuery({
    queryKey: devicesKey,
    queryFn: () => apiFetch<DeviceWithTerms[]>("/devices"),
  });
}

function useInvalidate() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: devicesKey });
}

export function useCreateDevice() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (input: CreateDeviceInput) =>
      apiFetch<DeviceWithTerms>("/devices", { method: "POST", body: input }),
    onSuccess: invalidate,
  });
}

export function useUpdateDevice() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateDeviceInput }) =>
      apiFetch<DeviceWithTerms>(`/devices/${id}`, { method: "PATCH", body: input }),
    onSuccess: invalidate,
  });
}

export function useRotateKey() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<DeviceWithTerms>(`/devices/${id}/rotate-key`, { method: "POST" }),
    onSuccess: invalidate,
  });
}

export function useSetExcludedTerms() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, phrases }: { id: string; phrases: string[] }) =>
      apiFetch<DeviceWithTerms>(`/devices/${id}/excluded-terms`, {
        method: "PUT",
        body: { phrases },
      }),
    onSuccess: invalidate,
  });
}

export function useArchiveDevice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch<{ id: string }>(`/devices/${id}`, { method: "DELETE" }),
    onSuccess: (_data, id) => {
      qc.setQueryData<DeviceWithTerms[]>(devicesKey, (old) =>
        old?.filter((row) => row.device.id !== id),
      );
      qc.invalidateQueries({ queryKey: devicesKey });
      qc.invalidateQueries({ queryKey: ["placements"] });
    },
  });
}
