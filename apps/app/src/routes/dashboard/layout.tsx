import { Coins, Megaphone, Monitor, Gear as Settings, SquaresFour, X } from "@phosphor-icons/react";
import {
  Button,
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
import { SetupCoach } from "../../components/setup-coach";
import { StripeCoach } from "../../components/stripe-coach";
import { signOutThen, useSession } from "../../lib/auth";
import { useCoach } from "../../lib/coach";
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
  const { dashboard: dashHint, stripe: stripeHint, dismiss, ignore } = useCoach();
  const [coachReady, setCoachReady] = useState(false);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const id = window.setTimeout(() => setCoachReady(true), reduce ? 0 : 420);
    return () => window.clearTimeout(id);
  }, []);

  useEffect(() => {
    if (pathname === "/dashboard/campaigns" || pathname === "/dashboard/ledger") {
      dismiss("dashboard");
    }
    // The ledger page holds the buy panel, so reaching it is taking the step.
    if (pathname === "/dashboard/ledger") dismiss("stripe");
  }, [pathname, dismiss]);

  // Three tips for a newcomer, one after the other: the account on the
  // chooser, then these two in the drawer. Each shows once on this browser.
  // The campaign tip goes first, so the two never sit on screen together.
  const showCoach = dashHint && coachReady;
  const showStripeCoach = stripeHint === "pending" && coachReady && !showCoach;

  async function handleSignOut() {
    clearResume();
    await signOutThen(() => navigate("/", { replace: true }));
  }

  const items = navItems(pathname);

  function renderNavLink({ href, className, label, icon }: NavItem & { className: string }) {
    const ledger = href === "/dashboard/ledger";
    const setup = href === "/dashboard/campaigns" || ledger;
    return (
      <Link
        to={href ?? "#"}
        className={className}
        onClick={() => {
          if (setup) dismiss("dashboard");
          if (ledger) dismiss("stripe");
        }}
      >
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
      <CapyLockup variant="off-air" inverted={false} className="h-12 w-auto" />
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
          trailing={
            <Button
              variant="outline"
              size="icon"
              className="size-10 rounded-full text-muted-foreground hover:text-foreground"
              aria-label="Close dashboard"
              onClick={onClose}
            >
              <X size={20} />
            </Button>
          }
        />
      }
    >
      <Outlet />
      <SetupCoach open={showCoach} onDismiss={() => dismiss("dashboard")} />
      <StripeCoach open={showStripeCoach} onIgnore={() => ignore("stripe")} />
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

/** Vaul's TRANSITIONS.DURATION: the close animation is 0.5s. */
const DRAWER_CLOSE_MS = 500;

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

  /** Back to the set, once. Every close path lands here, so it checks the route. */
  function leave() {
    if (closing.current && window.location.pathname.startsWith("/dashboard")) {
      closing.current = false;
      navigate("/");
    }
  }

  /**
   * A close from our own control: the logo, the X. Vaul only reports the end
   * of a close it started itself (a swipe, the overlay, Escape); a change to
   * the `open` prop from outside gets no callback. So this path times its own
   * exit, on the drawer's transition length.
   */
  function closeDrawer() {
    closing.current = true;
    setOpen(false);
    window.setTimeout(leave, reduceMotion ? 0 : DRAWER_CLOSE_MS);
  }

  return (
    <Drawer
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) closing.current = true;
      }}
      onAnimationEnd={(isOpen) => {
        if (!isOpen) leave();
      }}
      handleOnly
      shouldScaleBackground={!reduceMotion}
      setBackgroundColorOnScale={!reduceMotion}
    >
      <DrawerContent
        overlayClassName="z-[250]"
        className="z-[250] overflow-hidden p-0 data-[vaul-drawer-direction=bottom]:mt-0 data-[vaul-drawer-direction=bottom]:h-[calc(100dvh-12px)] data-[vaul-drawer-direction=bottom]:max-h-[calc(100dvh-12px)] data-[vaul-drawer-direction=bottom]:rounded-t-2xl"
      >
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
