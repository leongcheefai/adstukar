import { Coins, Megaphone, Monitor, Gear as Settings, SquaresFour } from "@phosphor-icons/react";
import {
  DashboardShell,
  DashboardTopbar,
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
  type NavItem,
} from "@repo/ui";
import { useEffect, useRef, useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router";
import { CapyLockup } from "../../components/capytv/lockup";
import { clearResume } from "../../components/capytv/resume";
import { DashboardSidebarFooter } from "../../components/dashboard-sidebar-footer";
import { signOutThen, useSession } from "../../lib/auth";
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
      label: "Campaigns",
      href: "/dashboard/campaigns",
      active: pathname === "/dashboard/campaigns",
      icon: <Megaphone size={16} />,
    },
    {
      label: "Devices",
      href: "/dashboard/devices",
      active: pathname === "/dashboard/devices",
      icon: <Monitor size={16} />,
    },
    {
      label: "CapyPoints",
      // The path stays /ledger. It is the append-only record either way, and a
      // rename here would break every link people already saved.
      href: "/dashboard/ledger",
      active: pathname === "/dashboard/ledger",
      icon: <Coins size={16} />,
    },
    {
      label: "Settings",
      href: "/dashboard/settings",
      active: pathname === "/dashboard/settings",
      icon: <Settings size={16} />,
    },
  ];
}

function DashboardContent({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { data: session } = useSession();

  async function handleSignOut() {
    clearResume();
    await signOutThen(() => navigate("/", { replace: true }));
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

  const brand = (
    <Link
      to="/"
      className="inline-flex items-center"
      aria-label="CapyTV"
      onClick={(event) => {
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        event.preventDefault();
        onClose();
      }}
    >
      <CapyLockup inverted={false} className="h-12 w-auto" />
    </Link>
  );

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
      brand={brand}
      navItems={items}
      renderNavLink={renderNavLink}
      sidebarFooter={sidebarFooter}
      topbar={
        <DashboardTopbar
          brand={brand}
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
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const closing = useRef(false);
  const [reduceMotion] = useState(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );

  useEffect(() => {
    setOpen(true);
  }, []);

  function closeDrawer() {
    closing.current = true;
    setOpen(false);
  }

  return (
    <Drawer
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) closing.current = true;
      }}
      onAnimationEnd={(isOpen) => {
        if (!isOpen && closing.current && window.location.pathname.startsWith("/dashboard")) {
          navigate("/");
        }
      }}
      handleOnly
      shouldScaleBackground={!reduceMotion}
      setBackgroundColorOnScale={!reduceMotion}
    >
      {/* The drawer keeps the primitives' shared z-50. Every dialog, menu,
          select and tooltip the dashboard opens portals to <body> at z-50 too,
          and lands after the drawer in the DOM, so it wins on order. A higher
          z-index here puts the drawer over all of them, and a listing dialog
          opens behind the sheet where nobody can see it. The CapyTV stage
          underneath is `isolation: isolate`, so its own z scale (up to 200)
          never competes with anything on <body>. */}
      <DrawerContent className="overflow-hidden p-0 data-[vaul-drawer-direction=bottom]:mt-0 data-[vaul-drawer-direction=bottom]:h-[calc(100dvh-12px)] data-[vaul-drawer-direction=bottom]:max-h-[calc(100dvh-12px)] data-[vaul-drawer-direction=bottom]:rounded-t-2xl">
        <DrawerTitle className="sr-only">Dashboard</DrawerTitle>
        <DrawerDescription className="sr-only">
          Campaigns, devices, points, and settings.
        </DrawerDescription>
        <div className="flex min-h-0 flex-1 flex-col">
          <DashboardContent onClose={closeDrawer} />
        </div>
      </DrawerContent>
    </Drawer>
  );
}
