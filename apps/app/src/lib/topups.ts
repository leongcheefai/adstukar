import type { TopupCheckoutResponse, TopupOverview } from "@repo/contracts/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiFetch } from "./api";

const topupsKey = ["topups"] as const;

/** What we sell, and every top-up this member already made. */
/**
 * What a press does on a button whose panel waits for a query. The button is
 * never disabled: a slow read opens the panel as soon as it lands, and a read
 * that failed says so and runs again. A dead button says nothing.
 */
export function openWhenReady(
  query: { isError: boolean; refetch: () => unknown },
  open: () => void,
  failed: string,
) {
  // A failed read does not open the panel. The panel would then appear by
  // itself, long after the press, when a later read lands.
  if (query.isError) {
    toast.error(failed);
    void query.refetch();
    return;
  }
  open();
}

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
          successUrl: `${window.location.origin}/dashboard/wallet?topup=paid`,
          cancelUrl: `${window.location.origin}/dashboard/wallet?topup=cancelled`,
        },
      }),
  });
}
