import type { NetworkStats, StatsOverview } from "@repo/contracts/types";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "./api";

export function useStats() {
  return useQuery({
    queryKey: ["stats"],
    queryFn: () => apiFetch<StatsOverview>("/stats/overview"),
  });
}

/** The API caches the network figures for 30 seconds, so asking more often reads the same answer. */
const NETWORK_POLL_MS = 30_000;

/**
 * The network's live figures. Polls while the tab is visible and rests while it
 * is hidden; a failed poll keeps the last good answer.
 */
export function useNetworkStats() {
  return useQuery({
    queryKey: ["network-stats"],
    queryFn: () => apiFetch<NetworkStats>("/stats/network"),
    staleTime: NETWORK_POLL_MS,
    refetchInterval: NETWORK_POLL_MS,
  });
}
