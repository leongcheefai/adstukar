import type {
  ConnectStripeInput,
  ConnectStripeResponse,
  PayoutOverview,
  PayoutQueue,
  PayoutRequest,
  StripeAccount,
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
 * A payout moves money and a play pays it, so both the cash-out panel and the
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

/** Opens Stripe's onboarding. The first call also creates the connected account. */
export function useConnectStripe() {
  return useMutation({
    mutationFn: (body: ConnectStripeInput) =>
      apiFetch<ConnectStripeResponse>("/payouts/stripe/connect", { method: "POST", body }),
  });
}

/** Reads the flags back from Stripe, for the moment the member returns. */
export function useRefreshStripeAccount() {
  const refresh = useRefreshMoney();
  return useMutation({
    mutationFn: () => apiFetch<StripeAccount>("/payouts/stripe/refresh", { method: "POST" }),
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
    mutationFn: ({ id }: { id: string }) =>
      apiFetch<PayoutRequest>(`/admin/payouts/${id}/pay`, { method: "POST" }),
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
