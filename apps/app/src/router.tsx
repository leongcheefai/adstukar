import { Suspense, lazy } from "react";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router";
import { CampaignsPage } from "./routes/dashboard/campaigns";
import { DashboardHome } from "./routes/dashboard/index";
import { DashboardLayout } from "./routes/dashboard/layout";
import { SettingsPage } from "./routes/dashboard/settings";
import { SlotBookPage } from "./routes/dashboard/slot-book";
import { LedgerPage } from "./routes/dashboard/wallet";
import { MemberLayout } from "./routes/member-layout";

const DevComponentsPage = import.meta.env.DEV
  ? lazy(() => import("./routes/_dev/components"))
  : null;
const DevTvEmbedsPage = import.meta.env.DEV ? lazy(() => import("./routes/_dev/tv-embeds")) : null;

/**
 * `/login` and `/signup` become `?auth=` on the front door. Any other query
 * rides along, so an OAuth `?error=` from the API reaches the form.
 */
function AuthRedirect({ view }: { view: "login" | "signup" | "forgot" }) {
  const { search } = useLocation();
  const params = new URLSearchParams(search);
  params.set("auth", view);
  return <Navigate to={`/?${params.toString()}`} replace />;
}

function LedgerRedirect() {
  const { search } = useLocation();
  return <Navigate to={`/dashboard/wallet${search}`} replace />;
}

export function Router() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MemberLayout />}>
          <Route path="login" element={<AuthRedirect view="login" />} />
          <Route path="signup" element={<AuthRedirect view="signup" />} />
          <Route path="forgot-password" element={<AuthRedirect view="forgot" />} />
          <Route path="dashboard" element={<DashboardLayout />}>
            <Route index element={<DashboardHome />} />
            <Route path="campaigns" element={<CampaignsPage />} />
            <Route path="campaigns/book" element={<SlotBookPage />} />
            <Route path="campaigns/:campaignId/edit" element={<SlotBookPage />} />
            <Route path="devices" element={<Navigate to="/dashboard" replace />} />
            <Route path="placements" element={<Navigate to="/" replace />} />
            {/* Phase 0 renamed products. Keep the links people already saved. */}
            <Route path="products" element={<Navigate to="/dashboard/campaigns" replace />} />
            <Route path="wallet" element={<LedgerPage />} />
            {/* The page was at /ledger. Saved links and an open Stripe checkout
                still return there, so the old path keeps its query string. */}
            <Route path="ledger" element={<LedgerRedirect />} />
            <Route path="settings" element={<SettingsPage />} />
            {/* Admin lives in Settings now; keep the old links working. */}
            <Route
              path="admin/moderation"
              element={<Navigate to="/dashboard/settings?tab=moderation" replace />}
            />
            <Route
              path="admin/releases"
              element={<Navigate to="/dashboard/settings?tab=releases" replace />}
            />
          </Route>
        </Route>
        {import.meta.env.DEV && DevComponentsPage && (
          <Route
            path="/_dev/components"
            element={
              <Suspense fallback={null}>
                <DevComponentsPage />
              </Suspense>
            }
          />
        )}
        {import.meta.env.DEV && DevTvEmbedsPage && (
          <Route
            path="/_dev/tv-embeds"
            element={
              <Suspense fallback={null}>
                <DevTvEmbedsPage />
              </Suspense>
            }
          />
        )}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
