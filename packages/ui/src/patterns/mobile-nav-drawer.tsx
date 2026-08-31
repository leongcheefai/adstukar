import type * as React from "react";
import { cn } from "../lib/utils";
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle } from "../primitives/sheet";
import type { NavItem } from "./dashboard-shell";

export interface MobileNavDrawerProps {
  brand: React.ReactNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  navItems: NavItem[];
  userName?: string;
  userEmail?: string;
  onSignOut?: () => void;
  renderNavLink?: (item: NavItem & { className: string; isCollapsed: boolean }) => React.ReactNode;
  sidebarFooter?: React.ReactNode;
}

export function MobileNavDrawer({
  brand,
  open,
  onOpenChange,
  navItems,
  userName,
  userEmail,
  onSignOut,
  renderNavLink,
  sidebarFooter,
}: MobileNavDrawerProps) {
  function close() {
    onOpenChange(false);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-72 sm:w-72 sm:max-w-72 p-0 flex flex-col">
        <SheetHeader className="flex h-14 shrink-0 flex-row items-center border-b px-4 space-y-0">
          <SheetTitle className="flex-1 font-semibold tracking-tight">{brand}</SheetTitle>
        </SheetHeader>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <ul className="space-y-0.5">
            {navItems.map((item) => {
              if (item.children) {
                return (
                  <li key={item.label}>
                    <div className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm text-muted-foreground">
                      {item.icon && <span className="size-4 shrink-0">{item.icon}</span>}
                      <span className="font-medium">{item.label}</span>
                    </div>
                    <ul className="mt-0.5 space-y-0.5 pl-4">
                      {item.children.map((child) => {
                        const childClassName = cn(
                          "flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors",
                          child.active
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                        );
                        return (
                          <li key={child.href ?? child.label}>
                            <SheetClose asChild>
                              {renderNavLink ? (
                                renderNavLink({
                                  ...child,
                                  className: childClassName,
                                  isCollapsed: false,
                                })
                              ) : (
                                <a href={child.href ?? "#"} className={childClassName}>
                                  {child.icon && (
                                    <span className="size-4 shrink-0">{child.icon}</span>
                                  )}
                                  {child.label}
                                </a>
                              )}
                            </SheetClose>
                          </li>
                        );
                      })}
                    </ul>
                  </li>
                );
              }
              const className = cn(
                "flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors",
                item.active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              );
              return (
                <li key={item.href ?? item.label}>
                  <SheetClose asChild>
                    {renderNavLink ? (
                      renderNavLink({ ...item, className, isCollapsed: false })
                    ) : (
                      <a href={item.href ?? "#"} className={className}>
                        {item.icon && <span className="size-4 shrink-0">{item.icon}</span>}
                        {item.label}
                      </a>
                    )}
                  </SheetClose>
                </li>
              );
            })}
          </ul>
        </nav>

        {sidebarFooter && <div className="px-3 pb-2">{sidebarFooter}</div>}

        <div className="border-t p-3">
          <div className="flex items-center gap-2.5 rounded-md px-3 py-2">
            <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground">
              {(userName ?? userEmail ?? "?")[0]?.toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              {userName && <p className="truncate text-sm font-medium leading-none">{userName}</p>}
              {userEmail && <p className="truncate text-xs text-muted-foreground">{userEmail}</p>}
            </div>
          </div>
          {onSignOut && (
            <button
              type="button"
              onClick={() => {
                onSignOut();
                close();
              }}
              className="mt-0.5 w-full rounded-md px-3 py-2 text-left text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              Sign out
            </button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
