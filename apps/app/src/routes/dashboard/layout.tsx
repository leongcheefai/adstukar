import { project } from "@repo/config/project";
import { Button, DashboardShell, DashboardTopbar, type NavItem } from "@repo/ui";
import {
  BookOpen,
  Code2,
  Inbox,
  LayoutDashboard,
  Package,
  Rocket,
  Settings,
  Shield,
} from "lucide-react";
import { Link, Outlet, useLocation, useNavigate } from "react-router";
import { FeedbackDialog } from "../../components/feedback-dialog";
import { ProtectedRoute } from "../../components/protected-route";
import { ThemeToggle } from "../../components/theme-toggle";
import { signOut, useSession } from "../../lib/auth";

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Overview",
  "/dashboard/products": "Products",
  "/dashboard/placements": "Placements",
  "/dashboard/ledger": "Ledger",
  "/dashboard/settings": "Settings",
  "/dashboard/admin/moderation": "Moderation",
  "/dashboard/admin/releases": "Releases",
};

function navItems(pathname: string, role?: string | null): NavItem[] {
  const items: NavItem[] = [
    {
      label: "Overview",
      href: "/dashboard",
      active: pathname === "/dashboard",
      icon: <LayoutDashboard size={16} />,
    },
    {
      label: "Products",
      href: "/dashboard/products",
      active: pathname === "/dashboard/products",
      icon: <Package size={16} />,
    },
    {
      label: "Placements",
      href: "/dashboard/placements",
      active: pathname === "/dashboard/placements",
      icon: <Code2 size={16} />,
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

  if (role === "admin") {
    items.push({
      label: "Admin",
      icon: <Shield size={16} />,
      children: [
        {
          label: "Moderation",
          href: "/dashboard/admin/moderation",
          active: pathname === "/dashboard/admin/moderation",
          icon: <Inbox size={16} />,
        },
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
  const title = PAGE_TITLES[pathname] ?? "Overview";

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
