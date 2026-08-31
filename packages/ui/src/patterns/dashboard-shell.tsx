import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import type * as React from "react";
import { useEffect, useState } from "react";
import { cn } from "../lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../primitives/tooltip";

export interface NavItem {
  label: string;
  href?: string;
  icon?: React.ReactNode;
  active?: boolean;
  children?: NavItem[];
}

function NavGroup({
  item,
  isCollapsed,
  renderNavLink,
}: {
  item: NavItem;
  isCollapsed: boolean;
  renderNavLink?: DashboardShellProps["renderNavLink"];
}) {
  const anyChildActive = item.children?.some((c) => c.active) ?? false;
  const [open, setOpen] = useState(anyChildActive);

  if (isCollapsed) {
    return (
      <>
        {item.children?.map((child) => {
          const className = cn(
            "flex w-full items-center justify-center rounded-md py-2 text-sm transition-colors",
            child.active
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
          );
          const linkNode = renderNavLink ? (
            renderNavLink({ ...child, className, isCollapsed: true })
          ) : (
            <a href={child.href ?? "#"} className={className} aria-label={child.label}>
              {child.icon && <span className="size-4 shrink-0">{child.icon}</span>}
            </a>
          );
          return (
            <li key={child.href ?? child.label}>
              <Tooltip>
                <TooltipTrigger asChild>{linkNode}</TooltipTrigger>
                <TooltipContent side="right">{child.label}</TooltipContent>
              </Tooltip>
            </li>
          );
        })}
      </>
    );
  }

  return (
    <li>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
      >
        {item.icon && <span className="size-4 shrink-0">{item.icon}</span>}
        <span className="flex-1 text-left">{item.label}</span>
        <ChevronDown
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
              renderNavLink({ ...child, className, isCollapsed: false })
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
  renderNavLink?: (item: NavItem & { className: string; isCollapsed: boolean }) => React.ReactNode;
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
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key !== "[") return;
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT" ||
        target.isContentEditable
      )
        return;
      setIsCollapsed((prev) => !prev);
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <TooltipProvider>
      <div className="flex h-screen overflow-hidden bg-background">
        <aside
          className={cn(
            "hidden shrink-0 flex-col border-r bg-card md:flex overflow-hidden transition-[width] duration-200 ease-in-out",
            isCollapsed ? "w-16" : "w-60",
          )}
        >
          <div className="flex h-14 shrink-0 items-center border-b px-3 gap-2">
            {!isCollapsed && (
              <span className="flex-1 font-semibold tracking-tight whitespace-nowrap">{brand}</span>
            )}
            <button
              type="button"
              onClick={() => setIsCollapsed((prev) => !prev)}
              className={cn(
                "flex shrink-0 items-center justify-center rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground",
                isCollapsed && "w-full",
              )}
              aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              title={isCollapsed ? "Expand sidebar ([ key)" : "Collapse sidebar ([ key)"}
            >
              {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto px-3 py-4">
            <ul className="space-y-0.5">
              {navItems.map((item) => {
                if (item.children) {
                  return (
                    <NavGroup
                      key={item.label}
                      item={item}
                      isCollapsed={isCollapsed}
                      renderNavLink={renderNavLink}
                    />
                  );
                }
                const className = cn(
                  "flex w-full items-center rounded-md py-2 text-sm transition-colors",
                  isCollapsed ? "justify-center px-0" : "gap-2.5 px-3",
                  item.active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                );
                const linkNode = renderNavLink ? (
                  renderNavLink({ ...item, className, isCollapsed })
                ) : (
                  <a
                    href={item.href ?? "#"}
                    className={className}
                    aria-label={isCollapsed ? item.label : undefined}
                  >
                    {item.icon && <span className="size-4 shrink-0">{item.icon}</span>}
                    {!isCollapsed && item.label}
                  </a>
                );
                return (
                  <li key={item.href ?? item.label}>
                    {isCollapsed ? (
                      <Tooltip>
                        <TooltipTrigger asChild>{linkNode}</TooltipTrigger>
                        <TooltipContent side="right">{item.label}</TooltipContent>
                      </Tooltip>
                    ) : (
                      linkNode
                    )}
                  </li>
                );
              })}
            </ul>
          </nav>

          {!isCollapsed && sidebarFooter && <div className="px-3 pb-3">{sidebarFooter}</div>}
        </aside>

        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          {topbar}
          <main className="flex-1 overflow-y-auto p-6">{children}</main>
        </div>
      </div>
    </TooltipProvider>
  );
}
