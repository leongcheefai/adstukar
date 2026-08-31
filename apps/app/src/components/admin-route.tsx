import { Navigate, useLocation } from "react-router";
import { useSession } from "../lib/auth";

export function AdminRoute({ children }: { children: React.ReactNode }) {
  const { data: session, isPending } = useSession();
  const { pathname, search } = useLocation();

  if (isPending) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!session) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(pathname + search)}`} replace />;
  }

  if (session.user.role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
