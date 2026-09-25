import {
  Coins,
  Megaphone,
  Question,
  Gear as Settings,
  SquaresFour,
  Television,
} from "@phosphor-icons/react";
import { Button, DashboardShell, DashboardTopbar, type NavItem } from "@repo/ui";
import { useEffect, useState } from "react";
import { Link, Navigate, Outlet, useLocation, useNavigate } from "react-router";
import { CapyLockup, HomeLink } from "../../components/capychannel/lockup";
import { clearResume } from "../../components/capychannel/resume";
import { CoachProvider } from "../../components/coach-provider";
import { DashboardSidebarFooter } from "../../components/dashboard-sidebar-footer";
import { SetupCoach } from "../../components/setup-coach";
import { StripeCoach } from "../../components/stripe-coach";
import { signOutThen, useSession } from "../../lib/auth";
import { useCoach } from "../../lib/coach";
import { leaveDashboard } from "../../lib/dashboard-tab";
import { env } from "../../lib/env";

/* The help centre lives on the marketing site, so its link leaves the app. */
const HELP_URL = `${env.VITE_WEB_URL}/help`;

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
      active: pathname.startsWith("/dashboard/campaigns"),
      icon: <Megaphone size={16} />,
    },
    {
      label: "Wallet",
      href: "/dashboard/wallet",
      active: pathname === "/dashboard/wallet",
      icon: <Coins size={16} />,
    },
    {
      label: "Settings",
      href: "/dashboard/settings",
      active: pathname === "/dashboard/settings",
      icon: <Settings size={16} />,
    },
    {
      label: "Help",
      href: HELP_URL,
      icon: <Question size={16} />,
    },
  ];
}

function DashboardContent() {
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
    if (pathname === "/dashboard/campaigns" || pathname === "/dashboard/wallet") {
      dismiss("dashboard");
    }
    // The ledger page holds the buy panel, so reaching it is taking the step.
    if (pathname === "/dashboard/wallet") dismiss("stripe");
  }, [pathname, dismiss]);

  // Three tips for a newcomer, one after the other: the account on the
  // chooser, then these two on the dashboard. Each shows once on this browser.
  // The campaign tip goes first, so the two never sit on screen together.
  const showCoach = dashHint && coachReady;
  const showStripeCoach = stripeHint === "pending" && coachReady && !showCoach;

  async function handleSignOut() {
    clearResume();
    await signOutThen(() => navigate("/", { replace: true }));
  }

  const items = navItems(pathname);

  function renderNavLink({ href, className, label, icon }: NavItem & { className: string }) {
    const ledger = href === "/dashboard/wallet";
    const setup = href === "/dashboard/campaigns" || ledger;
    if (href === HELP_URL) {
      return (
        <a href={href} target="_blank" rel="noreferrer" className={className}>
          {icon && <span className="size-4 shrink-0">{icon}</span>}
          {label}
        </a>
      );
    }
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
    <HomeLink className="inline-flex items-center rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40">
      <CapyLockup variant="off-air" inverted={false} className="h-12 w-auto" />
    </HomeLink>
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
          trailing={
            <Button
              variant="outline"
              size="icon"
              className="size-10 rounded-full text-muted-foreground hover:text-foreground"
              aria-label="Back to the TV"
              onClick={() => leaveDashboard(() => navigate("/"))}
            >
              <Television size={20} />
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

/**
 * The dashboard, as a page of its own. The set opens it in a new tab
 * (`lib/dashboard-tab.ts`). With no session it sends the visitor to the login
 * form on the set, which brings them back here once they sign in.
 */
export function DashboardLayout() {
  const { pathname, search } = useLocation();
  const { data: session, isPending } = useSession();

  if (isPending) return <div className="h-dvh bg-background" />;
  if (!session) {
    const params = new URLSearchParams({ auth: "login", redirect: `${pathname}${search}` });
    return <Navigate to={`/?${params.toString()}`} replace />;
  }
  return (
    <CoachProvider>
      <div className="flex h-dvh flex-col">
        <DashboardContent />
      </div>
    </CoachProvider>
  );
}
