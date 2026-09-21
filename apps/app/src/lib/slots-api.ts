import type { BookSlotInput, ListSlots, SlotLoop, SlotWithCampaign } from "@repo/contracts/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "./api";
import { campaignsKey } from "./campaigns";

/**
 * A slot is one booking on the ticker loop. The API owns it, and the loop it
 * prints, so nothing here keeps a position or a term in the browser.
 */
export const slotsKey = ["slots"] as const;
export const slotLoopKey = ["slots", "loop"] as const;

export function useSlots() {
  return useQuery({
    queryKey: slotsKey,
    queryFn: () => apiFetch<ListSlots>("/slots"),
    select: (data) => data.items,
  });
}

/** The loop every screen prints. It refreshes on its own, because a term can end while the set is on. */
export function useSlotLoop() {
  return useQuery({
    queryKey: slotLoopKey,
    queryFn: () => apiFetch<SlotLoop>("/slots/loop"),
    refetchInterval: 60_000,
  });
}

export function useBookSlot() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: BookSlotInput) =>
      apiFetch<SlotWithCampaign>("/slots", { method: "POST", body: input }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: slotsKey });
      qc.invalidateQueries({ queryKey: campaignsKey });
      // The balance moved, so the figure on the Overview must follow.
      qc.invalidateQueries({ queryKey: ["stats"] });
    },
  });
}
