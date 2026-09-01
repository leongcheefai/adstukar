import { BookOpen, Code, Package, Gear as Settings, SquaresFour } from "@phosphor-icons/react";
import { project } from "@repo/config/project";
import { DashboardShell, DashboardTopbar, type NavItem } from "@repo/ui";
import { Link, Outlet, useLocation, useNavigate } from "react-router";
import { DashboardSidebarFooter } from "../../components/dashboard-sidebar-footer";
import { ProtectedRoute } from "../../components/protected-route";
import { signOut, useSession } from "../../lib/auth";
import { designMode } from "../../lib/design-mode";

function navItems(pathname: string): NavItem[] {
  return [
    {
      label: "Overview",
      href: "/dashboard",
      active: pathname === "/dashboard",
      icon: <SquaresFour size={16} />,
    },
    {
      label: "Listing",
      href: "/dashboard/products",
      active: pathname === "/dashboard/products",
      icon: <Package size={16} />,
    },
    {
      label: "Placements",
      href: "/dashboard/placements",
      active: pathname === "/dashboard/placements",
      icon: <Code size={16} />,
    },
    {
      label: "Ledger",
      href: "/dashboard/ledger",
      active: pathname === "/dashboard/ledger",
      icon: <BookOpen size={16} />,
    },
    {
      label: "Settings",
      href: "/dashboard/settings",
      active: pathname === "/dashboard/settings",
      icon: <Settings size={16} />,
    },
  ];
}

function DashboardContent() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { data: session } = useSession();

  async function handleSignOut() {
    await signOut();
    navigate("/login");
  }

  const items = navItems(pathname);

  function renderNavLink({ href, className, label, icon }: NavItem & { className: string }) {
    return (
      <Link to={href ?? "#"} className={className}>
        {icon && <span className="size-4 shrink-0">{icon}</span>}
        {label}
      </Link>
    );
  }

  const sidebarFooter = (
    <DashboardSidebarFooter
      userName={session?.user.name}
      userEmail={session?.user.email}
      userImage={session?.user.image}
      onSignOut={handleSignOut}
    />
  );

  return (
    <DashboardShell
      brand={project.name}
      navItems={items}
      renderNavLink={renderNavLink}
      sidebarFooter={sidebarFooter}
      topbar={
        <DashboardTopbar
          brand={project.name}
          navItems={items}
          renderNavLink={renderNavLink}
          sidebarFooter={sidebarFooter}
          actions={<DesignModeBadge />}
        />
      }
    >
      <Outlet />
    </DashboardShell>
  );
}

/** Dev-only marker. Fixture data must never look like real data. */
function DesignModeBadge() {
  if (!designMode) return null;
  return (
    <a
      href="?design=0"
      className="rounded-full border border-border bg-card px-3 py-1 font-mono text-xs text-muted-foreground transition-colors hover:text-foreground"
      title="Sample data, no API. Click to leave design mode."
    >
      design mode
    </a>
  );
}

export function DashboardLayout() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}
