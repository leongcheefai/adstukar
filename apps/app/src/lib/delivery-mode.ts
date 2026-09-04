/**
 * How a placement reaches its audience.
 *
 * - `snippet` — the member pastes one line into their own site. It shows random
 *   ads from the advertiser pool.
 * - `tv` — CapyTV. No code. A full-screen spot on any display.
 *
 * These are two separate products, not two settings of one, so a placement is
 * born as one or the other and never switches.
 */
export type DeliveryMode = "snippet" | "tv";

/**
 * Browser-only, on purpose. `placement` has no column for this, and adding one
 * is a backend change; localStorage keeps the whole feature inside the app.
 *
 * The cost is real and worth stating: the mode does not follow the member to
 * another browser or another machine, where every placement reads as a snippet.
 */
const key = (placementId: string) => `capytv:mode:${placementId}`;

export function readDeliveryMode(placementId: string): DeliveryMode {
  try {
    return localStorage.getItem(key(placementId)) === "tv" ? "tv" : "snippet";
  } catch {
    // Private windows and blocked site data both throw here. Snippet is the
    // safe default: it is what every placement did before this existed.
    return "snippet";
  }
}

export function rememberDeliveryMode(placementId: string, mode: DeliveryMode) {
  try {
    localStorage.setItem(key(placementId), mode);
  } catch {
    // The placement is still created; it just opens as a snippet.
  }
}
