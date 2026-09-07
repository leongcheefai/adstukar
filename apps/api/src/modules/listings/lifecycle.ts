import type { ListingState, OwnerListingState } from "@repo/db/enums";

export type StateChange = { ok: true; state: OwnerListingState } | { ok: false; message: string };

/**
 * Pausing stops an approved listing and keeps its approval, so starting it again
 * needs no second review. Nothing else moves: a listing still in the queue, one
 * the queue refused, and an archived one are not the advertiser's to run.
 */
export function listingStateChange(current: ListingState, wanted: OwnerListingState): StateChange {
  if (current === wanted) return { ok: true, state: wanted };
  if (current === "approved" && wanted === "paused") return { ok: true, state: "paused" };
  if (current === "paused" && wanted === "approved") return { ok: true, state: "approved" };
  if (current === "archived") return { ok: false, message: "Listing is archived" };
  if (current === "pending") return { ok: false, message: "This listing is still in review" };
  return {
    ok: false,
    message: "A rejected listing cannot run. Edit it to send it back to review.",
  };
}
