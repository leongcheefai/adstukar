import { Bell, List } from "@phosphor-icons/react";
// packages/ui/src/patterns/dashboard-topbar.tsx
import type * as React from "react";
import { useState } from "react";
import type { NavItem, RenderNavLink } from "./dashboard-shell";
import { MobileNavDrawer } from "./mobile-nav-drawer";

export interface DashboardTopbarProps {
  brand: React.ReactNode;
  navItems: NavItem[];
  renderNavLink?: RenderNavLink;
  /** Same node the sidebar shows; the drawer carries it on mobile, account menu included. */
  sidebarFooter?: React.ReactNode;
  /** App-supplied controls, placed at the right end before the bell. */
  actions?: React.ReactNode;
}

export function DashboardTopbar({
  brand,
  navItems,
  renderNavLink,
  sidebarFooter,
  actions,
}: DashboardTopbarProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <>
      <header className="flex h-14 shrink-0 items-center gap-3 border-b bg-card px-4">
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className="flex items-center justify-center rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 md:hidden"
          aria-label="Open navigation"
        >
          <List size={18} />
        </button>

        <div className="flex flex-1 items-center justify-end gap-2">
          {actions}

          <button
            type="button"
            disabled
            className="flex items-center justify-center rounded-md p-1.5 text-muted-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-40"
            aria-label="Notifications"
            aria-disabled="true"
          >
            <Bell size={16} />
          </button>
        </div>
      </header>

      <MobileNavDrawer
        brand={brand}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        navItems={navItems}
        renderNavLink={renderNavLink}
        sidebarFooter={sidebarFooter}
      />
    </>
  );
}
