import type { MetricsOverview } from "@repo/contracts/types";
import { useQuery } from "@tanstack/react-query";
import { env } from "./env";

export async function fetchMetrics(): Promise<MetricsOverview> {
  const res = await fetch(`${env.VITE_API_URL}/metrics/overview`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to fetch metrics");
  return res.json() as Promise<MetricsOverview>;
}

export function useMetrics() {
  return useQuery({ queryKey: ["metrics"], queryFn: fetchMetrics });
}
