import type {
  CreateDeviceInput,
  DeviceWithTerms,
  EligibleListing,
  PresignDevicePhotoResponse,
  SetPromotionInput,
  UpdateDeviceInput,
} from "@repo/contracts/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "./api";
import { designMode } from "./design-mode";

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

/**
 * Every approved listing that could reach this screen. The distributor vetoes
 * from this list, so it is loaded only while the device is open.
 */
export function useEligibleListings(deviceId: string | null) {
  return useQuery({
    queryKey: ["devices", deviceId, "eligible-listings"] as const,
    queryFn: () => apiFetch<EligibleListing[]>(`/devices/${deviceId}/eligible-listings`),
    enabled: deviceId !== null,
  });
}

/** Replaces the whole veto list, because the dashboard always holds all of it. */
export function useSetVetoes() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, listingIds }: { id: string; listingIds: string[] }) =>
      apiFetch<DeviceWithTerms>(`/devices/${id}/vetoes`, { method: "PUT", body: { listingIds } }),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: devicesKey });
      qc.invalidateQueries({ queryKey: ["devices", id, "eligible-listings"] });
    },
  });
}

export function useSetPromotion() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: SetPromotionInput }) =>
      apiFetch<DeviceWithTerms>(`/devices/${id}/promotion`, { method: "PUT", body: input }),
    onSuccess: invalidate,
  });
}

/** Presign + PUT. Returns the public URL to store on the device. */
export async function uploadDevicePhoto(file: File): Promise<string> {
  // Design mode has no bucket to PUT to, so the picked file is shown from memory.
  if (designMode) return URL.createObjectURL(file);
  const { uploadUrl, publicUrl } = await apiFetch<PresignDevicePhotoResponse>(
    "/uploads/device-photo/presign",
    { method: "POST", body: { contentType: file.type, size: file.size } },
  );
  const res = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type },
    body: file,
  });
  if (!res.ok) throw new Error("Failed to upload the photo");
  return publicUrl;
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
