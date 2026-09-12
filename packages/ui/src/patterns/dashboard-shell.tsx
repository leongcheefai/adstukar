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

/**
 * Arrow-key movement inside one nav.
 *
 * Up and Down walk the items, Home and End jump to the ends, and both wrap. It
 * reads the DOM rather than an index, so a collapsed group contributes no items
 * and the order always matches what is on screen.
 *
 * Tab is left alone. This is a list of links, not a composite widget, so every
 * item keeps its own tab stop; the arrows are a faster way through, not the
 * only way in.
 *
 * Exported so the mobile drawer binds the same handler to the same nav.
 */
export function handleNavArrowKeys(event: React.KeyboardEvent<HTMLElement>) {
  const keys = ["ArrowDown", "ArrowUp", "Home", "End"];
  if (!keys.includes(event.key) || event.metaKey || event.ctrlKey || event.altKey) return;

  const nav = event.currentTarget;
  const items = [...nav.querySelectorAll<HTMLElement>("a[href], button:not(:disabled)")];
  if (items.length === 0) return;

  const current = items.indexOf(document.activeElement as HTMLElement);
  let next: number;
  if (event.key === "Home") next = 0;
  else if (event.key === "End") next = items.length - 1;
  else if (event.key === "ArrowDown") next = current < 0 ? 0 : (current + 1) % items.length;
  else next = current < 0 ? items.length - 1 : (current - 1 + items.length) % items.length;

  // Only after an item is found, so an unhandled key still scrolls the page.
  event.preventDefault();
  items[next]?.focus();
}

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
        aria-expanded={open}
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
      <div className="flex h-full overflow-hidden bg-background">
        <aside className="hidden w-60 shrink-0 flex-col overflow-hidden border-r bg-card md:flex">
          {/* No rule under the brand. The topbar drops its own at the same
              height, and the two together drew one line across the whole top. */}
          <div className="flex h-14 shrink-0 items-center px-4">
            <span className="flex-1 font-semibold tracking-tight whitespace-nowrap">{brand}</span>
          </div>

          <nav
            className="flex-1 overflow-y-auto px-3 py-4"
            onKeyDown={handleNavArrowKeys}
            aria-label="Main"
          >
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
          {/* The home indicator sits over the last 34px on iOS, so the scroll
              area ends above it rather than under it. */}
          <main className="flex-1 overflow-y-auto p-6 pb-[calc(var(--space-6)+env(safe-area-inset-bottom))]">
            {children}
          </main>
        </div>
      </div>
    </TooltipProvider>
  );
}
