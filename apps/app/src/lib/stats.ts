import type { StatsOverview } from "@repo/contracts/types";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "./api";

export function useStats() {
  return useQuery({
    queryKey: ["stats"],
    queryFn: () => apiFetch<StatsOverview>("/stats/overview"),
  });
}
