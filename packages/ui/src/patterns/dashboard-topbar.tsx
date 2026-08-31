import { Bell, LogOut, Menu, Search } from "lucide-react";
// packages/ui/src/patterns/dashboard-topbar.tsx
import type * as React from "react";
import { useEffect, useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../primitives/dropdown-menu";
import type { NavItem } from "./dashboard-shell";
import { MobileNavDrawer } from "./mobile-nav-drawer";

export interface DashboardTopbarProps {
  brand: React.ReactNode;
  title: string;
  navItems: NavItem[];
  userName?: string;
  userEmail?: string;
  onSignOut?: () => void;
  onSearch?: () => void;
  renderNavLink?: (item: NavItem & { className: string; isCollapsed: boolean }) => React.ReactNode;
  sidebarFooter?: React.ReactNode;
}

export function DashboardTopbar({
  brand,
  title,
  navItems,
  userName,
  userEmail,
  onSignOut,
  onSearch,
  renderNavLink,
  sidebarFooter,
}: DashboardTopbarProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        onSearch?.();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onSearch]);

  return (
    <>
      <header className="flex h-14 shrink-0 items-center gap-3 border-b bg-card px-4">
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className="flex items-center justify-center rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 md:hidden"
          aria-label="Open navigation"
        >
          <Menu size={18} />
        </button>

        <h1 className="text-sm font-semibold">{title}</h1>

        <div className="flex flex-1 items-center justify-end gap-1">
          <button
            type="button"
            onClick={onSearch}
            disabled={!onSearch}
            className="flex items-center justify-center rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-40"
            aria-label="Search (⌘K)"
            title="Search (⌘K)"
          >
            <Search size={16} />
          </button>

          <button
            type="button"
            disabled
            className="flex items-center justify-center rounded-md p-1.5 text-muted-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-40"
            aria-label="Notifications"
            aria-disabled="true"
          >
            <Bell size={16} />
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="ml-1 flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground transition-opacity hover:opacity-80"
                aria-label="User menu"
              >
                {(userName ?? userEmail ?? "?")[0]?.toUpperCase()}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {(userName || userEmail) && (
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col gap-0.5">
                    {userName && <span className="text-sm font-medium">{userName}</span>}
                    {userEmail && (
                      <span className="text-xs text-muted-foreground">{userEmail}</span>
                    )}
                  </div>
                </DropdownMenuLabel>
              )}
              {onSignOut && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={onSignOut} className="text-muted-foreground">
                    <LogOut size={14} className="mr-2" />
                    Sign out
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <MobileNavDrawer
        brand={brand}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        navItems={navItems}
        userName={userName}
        userEmail={userEmail}
        onSignOut={onSignOut}
        renderNavLink={renderNavLink}
        sidebarFooter={sidebarFooter}
      />
    </>
  );
}
