import { project } from "@repo/config/project";
import { Button, DashboardShell, DashboardTopbar, type NavItem } from "@repo/ui";
import { CreditCard, LayoutDashboard, Rocket, Settings, Shield } from "lucide-react";
import { Link, Outlet, useLocation, useNavigate } from "react-router";
import { FeedbackDialog } from "../../components/feedback-dialog";
import { ProtectedRoute } from "../../components/protected-route";
import { ThemeToggle } from "../../components/theme-toggle";
import { UpgradeCard } from "../../components/upgrade-card";
import { signOut, useSession } from "../../lib/auth";

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/dashboard/billing": "Billing",
  "/dashboard/settings": "Settings",
  "/dashboard/admin/releases": "Releases",
};

function navItems(pathname: string, role?: string | null): NavItem[] {
  const items: NavItem[] = [
    {
      label: "Dashboard",
      href: "/dashboard",
      active: pathname === "/dashboard",
      icon: <LayoutDashboard size={16} />,
    },
    {
      label: "Billing",
      href: "/dashboard/billing",
      active: pathname === "/dashboard/billing",
      icon: <CreditCard size={16} />,
    },
    {
      label: "Settings",
      href: "/dashboard/settings",
      active: pathname === "/dashboard/settings",
      icon: <Settings size={16} />,
    },
  ];

  if (role === "admin") {
    items.push({
      label: "Admin",
      icon: <Shield size={16} />,
      children: [
        {
          label: "Releases",
          href: "/dashboard/admin/releases",
          active: pathname === "/dashboard/admin/releases",
          icon: <Rocket size={16} />,
        },
      ],
    });
  }

  return items;
}

function DashboardContent() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { data: session } = useSession();

  async function handleSignOut() {
    await signOut();
    navigate("/login");
  }

  const items = navItems(pathname, session?.user.role);
  const title = PAGE_TITLES[pathname] ?? "Dashboard";

  function renderNavLink({
    href,
    className,
    label,
    icon,
    isCollapsed,
  }: NavItem & { className: string; isCollapsed: boolean }) {
    return (
      <Link to={href ?? "#"} className={className}>
        {icon && <span className="size-4 shrink-0">{icon}</span>}
        {!isCollapsed && label}
      </Link>
    );
  }

  const sidebarFooter = (
    <div className="flex flex-col gap-2">
      <UpgradeCard />
      <div className="flex items-center gap-2">
        <FeedbackDialog>
          <Button variant="ghost" size="sm" className="flex-1 justify-start text-muted-foreground">
            Send feedback
          </Button>
        </FeedbackDialog>
        <ThemeToggle />
      </div>
    </div>
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
          title={title}
          navItems={items}
          userName={session?.user.name}
          userEmail={session?.user.email}
          onSignOut={handleSignOut}
          renderNavLink={renderNavLink}
          sidebarFooter={sidebarFooter}
        />
      }
    >
      <Outlet />
    </DashboardShell>
  );
}

export function DashboardLayout() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}
