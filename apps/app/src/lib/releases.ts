import type { Release, SyncReleasesResponse } from "@repo/contracts/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { env } from "./env";

async function fetchReleases(): Promise<Release[]> {
  const res = await fetch(`${env.VITE_API_URL}/releases`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch releases");
  return res.json() as Promise<Release[]>;
}

async function syncReleasesRequest(): Promise<SyncReleasesResponse> {
  const res = await fetch(`${env.VITE_API_URL}/releases/sync`, {
    method: "POST",
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to sync releases");
  return res.json() as Promise<SyncReleasesResponse>;
}

export function useReleases() {
  return useQuery({ queryKey: ["releases"], queryFn: fetchReleases });
}

export function useSyncReleases() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: syncReleasesRequest,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["releases"] }),
  });
}
