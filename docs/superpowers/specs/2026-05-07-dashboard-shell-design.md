# Dashboard Shell Improvements

Date: 2026-05-07
Status: Approved

## Overview

Improve the dashboard shell across four areas: add a desktop topbar, fix mobile navigation, implement redirect-back on protected routes, and fix the collapsed sidebar sign-out dead end.

The approach is composable — split the monolithic `DashboardShell` into focused pieces that consumers can swap independently.

## Architecture

### New components (`packages/ui/src/patterns/`)

- `dashboard-topbar.tsx` — page title, search trigger, notifications bell, user avatar dropdown, mobile hamburger
- `mobile-nav-drawer.tsx` — Sheet-based nav drawer, mirrors sidebar contents, mobile only

### Modified files

- `packages/ui/src/patterns/dashboard-shell.tsx` — accepts `topbar` slot prop; removes the mobile-only `<header>`; always renders sidebar + topbar slot + main
- `packages/ui/src/index.ts` — export `DashboardTopbar`, `MobileNavDrawer`
- `apps/app/src/routes/dashboard/layout.tsx` — compose `DashboardTopbar` + pass as `topbar` prop to `DashboardShell`
- `apps/app/src/components/protected-route.tsx` — append `?redirect=<pathname>` before login redirect
- `apps/app/src/routes/login.tsx` — read, validate, and consume `?redirect=` after successful auth

### New shadcn primitives (`packages/ui`)

- `sheet` — used by `MobileNavDrawer`
- `dropdown-menu` — used by user avatar in topbar
- `tooltip` — used by collapsed sidebar nav items

## Component Designs

### `DashboardShell`

```ts
interface DashboardShellProps {
  children: React.ReactNode
  topbar?: React.ReactNode          // new slot
  navItems: NavItem[]
  userName?: string
  userEmail?: string
  // onSignOut removed — sign out lives in DashboardTopbar avatar dropdown only
  renderNavLink?: (item: NavItem & { className: string; isCollapsed: boolean }) => React.ReactNode
  sidebarFooter?: React.ReactNode
}
```

Changes:
- Remove the `md:hidden` mobile `<header>` — topbar slot replaces it
- Render `{topbar}` above `<main>` inside the right column
- Sidebar user section (collapsed): avatar circle only — sign out no longer lives here
- Collapsed nav items: wrap with shadcn `Tooltip` showing `item.label` on hover

### `DashboardTopbar`

```ts
interface DashboardTopbarProps {
  title: string
  navItems: NavItem[]
  userName?: string
  userEmail?: string
  onSignOut?: () => void
  onSearch?: () => void
  renderNavLink?: (item: NavItem & { className: string; isCollapsed: boolean }) => React.ReactNode
  sidebarFooter?: React.ReactNode
}
```

Layout (left → right):
1. Hamburger button (`md:hidden`) — opens `MobileNavDrawer`
2. Page title (`text-sm font-semibold`)
3. `flex-1` spacer
4. Search icon button — calls `onSearch`; `Cmd+K` / `Ctrl+K` keyboard listener wired internally
5. Notifications bell icon button — slot only, no logic
6. User avatar circle → `DropdownMenu` containing name, email, sign out

State: `drawerOpen` owned internally by `DashboardTopbar` — not exposed to `layout.tsx`.

### `MobileNavDrawer`

```ts
interface MobileNavDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  navItems: NavItem[]
  userName?: string
  userEmail?: string
  onSignOut?: () => void
  renderNavLink?: (item: NavItem & { className: string; isCollapsed: boolean }) => React.ReactNode
  sidebarFooter?: React.ReactNode
}
```

Structure (Sheet from left, `md:hidden`):
- Header: brand name + close button
- Nav: same `<ul>` as sidebar, full-width, never collapsed
- Footer: `sidebarFooter` slot
- Bottom: user avatar + name + email + sign out

Behavior: drawer closes when any nav link is clicked. Each `renderNavLink` invocation wraps the returned element with an `onClick` that calls `onOpenChange(false)`.

## Protected Route: Redirect-Back

### `ProtectedRoute`

Capture `pathname` via `useLocation()` before redirecting:

```ts
<Navigate to={`/login?redirect=${encodeURIComponent(pathname)}`} replace />
```

### `LoginPage`

After successful auth, read and validate the redirect param:

```ts
const redirect = new URLSearchParams(search).get('redirect')
const safe = redirect?.startsWith('/') && !redirect.startsWith('//') ? redirect : '/dashboard'
navigate(safe, { replace: true })
```

Validation rule: must start with `/` and not start with `//` — prevents open redirect to external URLs.

Scope: `pathname` only. Query string and hash are not preserved.

## Sidebar: Collapsed State

- Nav items: shadcn `Tooltip` wrapping each link, label shown on hover when `isCollapsed`
- Sign out: removed from sidebar entirely — lives in topbar avatar `DropdownMenu`
- Sidebar user section collapsed: avatar circle only
- All other behavior unchanged (collapse toggle, `[` shortcut, active states)

## Out of Scope

- Command palette UI (`onSearch` wires the trigger only — implementation left to the product)
- Notifications logic (bell icon is a slot, no real-time or badge logic)
- Role-based access control
- Query string / hash preservation in redirect-back
