import type {
  DeletePresetCollectionResponse,
  DeletePresetResponse,
  PresetCollection,
  PresetCollectionInput,
  PresetList,
  PresetMedia,
  UpdatePresetInput,
} from "@repo/contracts/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "./api";
import { uploadPreset } from "./uploads";

const presetsKey = ["presets"] as const;

/**
 * The wallpaper collections an admin put on every member's set, and their
 * photos. Members and the admin desk read the same list, so one key serves
 * both, and a change on the desk shows on the chooser at once.
 */
export function usePresets() {
  return useQuery({
    queryKey: presetsKey,
    queryFn: () => apiFetch<PresetList>("/presets"),
    staleTime: 5 * 60 * 1000,
  });
}

function useInvalidate() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: presetsKey });
}

/** Admin: presign, PUT to storage, then record the key into a collection. */
export function useUploadPreset() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({
      file,
      name,
      collectionId,
      onProgress,
    }: {
      file: File;
      name: string;
      collectionId: string;
      onProgress: (fraction: number) => void;
    }) => uploadPreset(file, name, collectionId, onProgress),
    onSuccess: invalidate,
  });
}

/** Admin: rename a photo, move it to another collection, or both. */
export function useUpdatePreset() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, ...body }: { id: string } & UpdatePresetInput) =>
      apiFetch<PresetMedia>(`/admin/presets/${id}`, { method: "PATCH", body }),
    onSuccess: invalidate,
  });
}

/** Admin: off every set, then out of the bucket. */
export function useDeletePreset() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<DeletePresetResponse>(`/admin/presets/${id}`, { method: "DELETE" }),
    onSuccess: invalidate,
  });
}

/** Admin: a new collection when `id` is absent, or an edit of one. */
export function useSaveCollection() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, ...body }: { id?: string } & PresetCollectionInput) =>
      id
        ? apiFetch<PresetCollection>(`/admin/presets/collections/${id}`, { method: "PATCH", body })
        : apiFetch<PresetCollection>("/admin/presets/collections", { method: "POST", body }),
    onSuccess: invalidate,
  });
}

/** Admin: the collection and every photo in it. */
export function useDeleteCollection() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<DeletePresetCollectionResponse>(`/admin/presets/collections/${id}`, {
        method: "DELETE",
      }),
    onSuccess: invalidate,
  });
}
