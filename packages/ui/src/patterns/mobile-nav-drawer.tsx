import type * as React from "react";
import { cn } from "../lib/utils";
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle } from "../primitives/sheet";
import { type NavItem, type RenderNavLink, handleNavArrowKeys } from "./dashboard-shell";

export interface MobileNavDrawerProps {
  brand: React.ReactNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  navItems: NavItem[];
  renderNavLink?: RenderNavLink;
  /** Rendered in the pinned bottom bar; the account menu lives here. */
  sidebarFooter?: React.ReactNode;
}

export function MobileNavDrawer({
  brand,
  open,
  onOpenChange,
  navItems,
  renderNavLink,
  sidebarFooter,
}: MobileNavDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-72 sm:w-72 sm:max-w-72 p-0 flex flex-col">
        <SheetHeader className="flex h-14 shrink-0 flex-row items-center border-b px-4 space-y-0">
          <SheetTitle className="flex-1 font-semibold tracking-tight">{brand}</SheetTitle>
        </SheetHeader>

        <nav className="flex-1 overflow-y-auto px-3 py-4" onKeyDown={handleNavArrowKeys}>
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
                                renderNavLink({ ...child, className: childClassName })
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
                      renderNavLink({ ...item, className })
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

        {sidebarFooter && <div className="border-t px-3 py-3">{sidebarFooter}</div>}
      </SheetContent>
    </Sheet>
  );
}
