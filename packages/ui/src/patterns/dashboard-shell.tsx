import { CaretDown } from "@phosphor-icons/react";
import type * as React from "react";
import { useState } from "react";
import { cn } from "../lib/utils";
import { TooltipProvider } from "../primitives/tooltip";

export interface NavItem {
  label: string;
  href?: string;
  icon?: React.ReactNode;
  active?: boolean;
  children?: NavItem[];
}

export type RenderNavLink = (item: NavItem & { className: string }) => React.ReactNode;

function NavGroup({
  item,
  renderNavLink,
}: {
  item: NavItem;
  renderNavLink?: RenderNavLink;
}) {
  const anyChildActive = item.children?.some((c) => c.active) ?? false;
  const [open, setOpen] = useState(anyChildActive);

  return (
    <li>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
      >
        {item.icon && <span className="size-4 shrink-0">{item.icon}</span>}
        <span className="flex-1 text-left">{item.label}</span>
        <CaretDown
          size={14}
          className={cn("shrink-0 transition-transform", open && "rotate-180")}
        />
      </button>
      {open && (
        <ul className="mt-0.5 space-y-0.5 pl-4">
          {item.children?.map((child) => {
            const className = cn(
              "flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors",
              child.active
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
            );
            const linkNode = renderNavLink ? (
              renderNavLink({ ...child, className })
            ) : (
              <a href={child.href ?? "#"} className={className}>
                {child.icon && <span className="size-4 shrink-0">{child.icon}</span>}
                {child.label}
              </a>
            );
            return <li key={child.href ?? child.label}>{linkNode}</li>;
          })}
        </ul>
      )}
    </li>
  );
}

export interface DashboardShellProps {
  brand: React.ReactNode;
  children: React.ReactNode;
  topbar?: React.ReactNode;
  navItems: NavItem[];
  renderNavLink?: RenderNavLink;
  sidebarFooter?: React.ReactNode;
}

export function DashboardShell({
  brand,
  children,
  topbar,
  navItems,
  renderNavLink,
  sidebarFooter,
}: DashboardShellProps) {
  return (
    <TooltipProvider>
      <div className="flex h-screen overflow-hidden bg-background">
        <aside className="hidden w-60 shrink-0 flex-col overflow-hidden border-r bg-card md:flex">
          <div className="flex h-14 shrink-0 items-center border-b px-4">
            <span className="flex-1 font-semibold tracking-tight whitespace-nowrap">{brand}</span>
          </div>

          <nav className="flex-1 overflow-y-auto px-3 py-4">
            <ul className="space-y-0.5">
              {navItems.map((item) => {
                if (item.children) {
                  return <NavGroup key={item.label} item={item} renderNavLink={renderNavLink} />;
                }
                const className = cn(
                  "flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors",
                  item.active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                );
                const linkNode = renderNavLink ? (
                  renderNavLink({ ...item, className })
                ) : (
                  <a href={item.href ?? "#"} className={className}>
                    {item.icon && <span className="size-4 shrink-0">{item.icon}</span>}
                    {item.label}
                  </a>
                );
                return <li key={item.href ?? item.label}>{linkNode}</li>;
              })}
            </ul>
          </nav>

          {sidebarFooter && <div className="border-t px-3 py-3">{sidebarFooter}</div>}
        </aside>

        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          {topbar}
          <main className="flex-1 overflow-y-auto p-6">{children}</main>
        </div>
      </div>
    </TooltipProvider>
  );
}
