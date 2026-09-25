import type { DeletePresetResponse, PresetList, PresetMedia } from "@repo/contracts/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "./api";
import { uploadPreset } from "./uploads";

const presetsKey = ["presets"] as const;

/**
 * The pictures and clips an admin put in every member's library. Members and
 * the admin desk read the same list, so one key serves both, and a change on
 * the desk shows in the library at once.
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

/** Admin: presign, PUT to storage, then record the key. */
export function useUploadPreset() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({
      file,
      name,
      onProgress,
    }: {
      file: File;
      name: string;
      onProgress: (fraction: number) => void;
    }) => uploadPreset(file, name, onProgress),
    onSuccess: invalidate,
  });
}

export function useRenamePreset() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      apiFetch<PresetMedia>(`/admin/presets/${id}`, { method: "PATCH", body: { name } }),
    onSuccess: invalidate,
  });
}

/** Admin: out of every library, then out of the bucket. */
export function useDeletePreset() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<DeletePresetResponse>(`/admin/presets/${id}`, { method: "DELETE" }),
    onSuccess: invalidate,
  });
}
