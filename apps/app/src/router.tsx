import { Suspense, lazy } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import { CampaignsPage } from "./routes/dashboard/campaigns";
import { DevicesPage } from "./routes/dashboard/devices";
import { DashboardHome } from "./routes/dashboard/index";
import { DashboardLayout } from "./routes/dashboard/layout";
import { LedgerPage } from "./routes/dashboard/ledger";
import { SettingsPage } from "./routes/dashboard/settings";
import { MemberLayout } from "./routes/member-layout";

const DevComponentsPage = import.meta.env.DEV
  ? lazy(() => import("./routes/_dev/components"))
  : null;

export function Router() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MemberLayout />}>
          <Route path="login" element={<Navigate to="/" replace />} />
          <Route path="signup" element={<Navigate to="/?auth=signup" replace />} />
          <Route path="forgot-password" element={<Navigate to="/?auth=forgot" replace />} />
          <Route path="dashboard" element={<DashboardLayout />}>
            <Route index element={<DashboardHome />} />
            <Route path="campaigns" element={<CampaignsPage />} />
            <Route path="devices" element={<DevicesPage />} />
            <Route path="placements" element={<Navigate to="/" replace />} />
            {/* Phase 0 renamed products. Keep the links people already saved. */}
            <Route path="products" element={<Navigate to="/dashboard/campaigns" replace />} />
            <Route path="ledger" element={<LedgerPage />} />
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
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
