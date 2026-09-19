import type { TopupCheckoutResponse, TopupOverview } from "@repo/contracts/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "./api";

const topupsKey = ["topups"] as const;

/** What we sell, and every top-up this member already made. */
export function useTopups() {
  return useQuery({
    queryKey: topupsKey,
    queryFn: () => apiFetch<TopupOverview>("/topups"),
  });
}

/**
 * A top-up moves money, so the balance above the panel and the ledger below it
 * go stale with it. Refresh all three together.
 */
export function useRefreshMoney() {
  const qc = useQueryClient();
  return () => {
    void qc.invalidateQueries({ queryKey: topupsKey });
    void qc.invalidateQueries({ queryKey: ["ledger"] });
    void qc.invalidateQueries({ queryKey: ["stats"] });
    void qc.invalidateQueries({ queryKey: ["payouts"] });
  };
}

/** Opens the Stripe checkout for one amount, in cents. The money arrives through the webhook. */
export function useTopUp() {
  return useMutation({
    mutationFn: (usdCents: number) =>
      apiFetch<TopupCheckoutResponse>("/topups/checkout", {
        method: "POST",
        body: {
          usdCents,
          successUrl: `${window.location.origin}/dashboard/ledger?topup=paid`,
          cancelUrl: `${window.location.origin}/dashboard/ledger?topup=cancelled`,
        },
      }),
  });
}
