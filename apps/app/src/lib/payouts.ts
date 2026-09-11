import type {
  PayoutAccount,
  PayoutOverview,
  PayoutQueue,
  PayoutRequest,
  SavePayoutAccountInput,
} from "@repo/contracts/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "./api";

const overviewKey = ["payouts"] as const;
const queueKey = ["admin", "payouts"] as const;

/** What may leave the account, and every request this member already made. */
export function usePayouts() {
  return useQuery({
    queryKey: overviewKey,
    queryFn: () => apiFetch<PayoutOverview>("/payouts"),
  });
}

/**
 * A payout moves points and a play pays them, so both the cash-out panel and the
 * balance above it go stale together. Refresh the ledger and the stats with it.
 */
function useRefreshMoney() {
  const qc = useQueryClient();
  return () => {
    void qc.invalidateQueries({ queryKey: overviewKey });
    void qc.invalidateQueries({ queryKey: ["ledger"] });
    void qc.invalidateQueries({ queryKey: ["stats"] });
  };
}

export function useSavePayoutAccount() {
  const refresh = useRefreshMoney();
  return useMutation({
    mutationFn: (body: SavePayoutAccountInput) =>
      apiFetch<PayoutAccount>("/payouts/account", { method: "PUT", body }),
    onSuccess: refresh,
  });
}

export function useRequestPayout() {
  const refresh = useRefreshMoney();
  return useMutation({
    mutationFn: () => apiFetch<PayoutRequest>("/payouts", { method: "POST" }),
    onSuccess: refresh,
  });
}

/** Admin: every open request, with the history behind it. */
export function usePayoutQueue() {
  return useQuery({
    queryKey: queueKey,
    queryFn: () => apiFetch<PayoutQueue>("/admin/payouts"),
  });
}

function useInvalidateQueue() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: queueKey });
}

export function usePayPayout() {
  const invalidate = useInvalidateQueue();
  return useMutation({
    mutationFn: ({ id, reference }: { id: string; reference: string }) =>
      apiFetch<PayoutRequest>(`/admin/payouts/${id}/pay`, { method: "POST", body: { reference } }),
    onSuccess: invalidate,
  });
}

export function useRejectPayout() {
  const invalidate = useInvalidateQueue();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      apiFetch<PayoutRequest>(`/admin/payouts/${id}/reject`, { method: "POST", body: { reason } }),
    onSuccess: invalidate,
  });
}
