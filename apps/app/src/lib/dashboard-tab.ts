/**
 * The dashboard is its own tab, so the set keeps playing in the tab it was
 * opened from. Every way in from the set names this one window: a second click
 * brings the dashboard tab back instead of opening another.
 */
export const DASHBOARD_WINDOW = "capychannel-dashboard";

export function openDashboard(path = "/dashboard") {
  const tab = window.open(path, DASHBOARD_WINDOW);
  tab?.focus();
}

/**
 * The way back from the dashboard. A tab the set opened closes, and the set is
 * already behind it. A tab that arrived on its own (a bookmark, a Stripe
 * return) has no set behind it, so it goes to the set instead.
 */
export function leaveDashboard(toSet: () => void) {
  if (window.opener && !window.opener.closed) {
    window.close();
    // A browser that refuses the close leaves the tab open: go to the set.
    if (window.closed) return;
  }
  toSet();
}
