import { Suspense, lazy } from "react";
import { BrowserRouter, Navigate, Outlet, Route, Routes } from "react-router";
import { AdminRoute } from "./components/admin-route";
import { ModerationPage } from "./routes/dashboard/admin/moderation";
import { AdminReleasesPage } from "./routes/dashboard/admin/releases";
import { DashboardHome } from "./routes/dashboard/index";
import { DashboardLayout } from "./routes/dashboard/layout";
import { LedgerPage } from "./routes/dashboard/ledger";
import { PlacementsPage } from "./routes/dashboard/placements";
import { ProductsPage } from "./routes/dashboard/products";
import { SettingsPage } from "./routes/dashboard/settings";
import { ForgotPasswordPage } from "./routes/forgot-password";
import { LoginPage } from "./routes/login";
import { SignupPage } from "./routes/signup";

const DevComponentsPage = import.meta.env.DEV
  ? lazy(() => import("./routes/_dev/components"))
  : null;

export function Router() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<DashboardHome />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="placements" element={<PlacementsPage />} />
          <Route path="ledger" element={<LedgerPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route
            path="admin"
            element={
              <AdminRoute>
                <Outlet />
              </AdminRoute>
            }
          >
            <Route path="moderation" element={<ModerationPage />} />
            <Route path="releases" element={<AdminReleasesPage />} />
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
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
