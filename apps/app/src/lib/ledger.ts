import type { LedgerReason, LedgerState, ListLedgerResponse } from "@repo/contracts/types";
import { useInfiniteQuery } from "@tanstack/react-query";
import { apiFetch } from "./api";

export interface LedgerFilters {
  reason?: LedgerReason;
  state?: LedgerState;
}

export function useLedger(filters: LedgerFilters) {
  return useInfiniteQuery({
    queryKey: ["ledger", filters],
    initialPageParam: null as string | null,
    queryFn: ({ pageParam }) => {
      const params = new URLSearchParams();
      if (filters.reason) params.set("reason", filters.reason);
      if (filters.state) params.set("state", filters.state);
      if (pageParam) params.set("cursor", pageParam);
      params.set("limit", "50");
      return apiFetch<ListLedgerResponse>(`/ledger?${params.toString()}`);
    },
    getNextPageParam: (last) => last.nextCursor,
  });
}
