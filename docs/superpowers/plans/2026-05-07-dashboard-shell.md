# Dashboard Shell Improvements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a desktop topbar (page title, search trigger, notifications, user avatar with sign-out dropdown), fix mobile navigation with a slide-in drawer, implement redirect-back on protected routes, and add proper tooltips on collapsed sidebar nav items.

**Architecture:** Split `DashboardShell` into composable pieces — `DashboardTopbar` owns the topbar and mobile drawer state, `MobileNavDrawer` is a Sheet-based nav drawer, and `DashboardShell` gains a `topbar` slot prop. Sign-out moves from sidebar to the topbar avatar dropdown. Protected route redirect-back uses `?redirect=<pathname>` validated against open redirect. Tasks are ordered so typecheck passes after every commit.

**Tech Stack:** React 19, React Router v7, shadcn/ui (Sheet, DropdownMenu, Tooltip), Lucide icons, Tailwind v4, pnpm monorepo (`@praxor-kit/ui` package)

---

## File Map

| Status | File | Change |
|--------|------|--------|
| Create | `packages/ui/src/primitives/sheet.tsx` | shadcn Sheet |
| Create | `packages/ui/src/primitives/dropdown-menu.tsx` | shadcn DropdownMenu |
| Create | `packages/ui/src/primitives/tooltip.tsx` | shadcn Tooltip |
| Create | `packages/ui/src/patterns/mobile-nav-drawer.tsx` | Sheet-based mobile nav |
| Create | `packages/ui/src/patterns/dashboard-topbar.tsx` | Topbar with search, bell, avatar, hamburger |
| Modify | `packages/ui/src/patterns/dashboard-shell.tsx` | Add `topbar` slot, remove `onSignOut` and sidebar sign-out button, add Tooltip on collapsed nav |
| Modify | `packages/ui/src/index.ts` | Export new components |
| Modify | `apps/app/src/routes/dashboard/layout.tsx` | Compose `DashboardTopbar`, pass as `topbar` prop, remove `onSignOut` from `DashboardShell` |
| Modify | `apps/app/src/components/protected-route.tsx` | Append `?redirect=<pathname>` before login redirect |
| Modify | `apps/app/src/routes/login.tsx` | Read, validate, consume `?redirect=` after auth |

**Task order** is chosen so typecheck passes after every commit: new components are built before the shell is modified to depend on them.

---

### Task 1: Add shadcn primitives — Sheet, DropdownMenu, Tooltip

**Files:**
- Create: `packages/ui/src/primitives/sheet.tsx`
- Create: `packages/ui/src/primitives/dropdown-menu.tsx`
- Create: `packages/ui/src/primitives/tooltip.tsx`
- Modify: `packages/ui/src/index.ts`

- [ ] **Step 1: Add sheet**

```bash
cd packages/ui && pnpm dlx shadcn@latest add sheet
```

Open `packages/ui/src/primitives/sheet.tsx`. If any import references `@praxor-kit/ui/lib/utils`, change it to `../lib/utils`.

- [ ] **Step 2: Add dropdown-menu**

```bash
cd packages/ui && pnpm dlx shadcn@latest add dropdown-menu
```

Open `packages/ui/src/primitives/dropdown-menu.tsx`. Fix any `@praxor-kit/ui/lib/utils` import → `../lib/utils`.

- [ ] **Step 3: Add tooltip**

```bash
cd packages/ui && pnpm dlx shadcn@latest add tooltip
```

Open `packages/ui/src/primitives/tooltip.tsx`. Fix any `@praxor-kit/ui/lib/utils` import → `../lib/utils`.

- [ ] **Step 4: Export from index.ts**

`packages/ui/src/index.ts` uses named exports. Check what each generated primitive exports (open each file), then add to `packages/ui/src/index.ts`. For a standard shadcn install the exports will be:

```ts
export {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetOverlay,
  SheetPortal,
  SheetTitle,
  SheetTrigger,
} from './primitives/sheet'

export {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from './primitives/dropdown-menu'

export {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './primitives/tooltip'
```

> If the generated files export differently, match your exports exactly to what's in each file.

- [ ] **Step 5: Verify typecheck**

```bash
pnpm typecheck
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add packages/ui/src/primitives/sheet.tsx packages/ui/src/primitives/dropdown-menu.tsx packages/ui/src/primitives/tooltip.tsx packages/ui/src/index.ts
git commit -m "feat: add sheet, dropdown-menu, tooltip shadcn primitives"
```

---

### Task 2: Create MobileNavDrawer

**Files:**
- Create: `packages/ui/src/patterns/mobile-nav-drawer.tsx`
- Modify: `packages/ui/src/index.ts`

- [ ] **Step 1: Create the file**

`NavItem` is imported as a type from the existing `dashboard-shell.tsx` — no changes to that file needed here.

```tsx
// packages/ui/src/patterns/mobile-nav-drawer.tsx
import type * as React from 'react'
import { cn } from '../lib/utils'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '../primitives/sheet'
import type { NavItem } from './dashboard-shell'

export interface MobileNavDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  navItems: NavItem[]
  userName?: string
  userEmail?: string
  onSignOut?: () => void
  renderNavLink?: (item: NavItem & { className: string; isCollapsed: boolean }) => React.ReactNode
  sidebarFooter?: React.ReactNode
}

export function MobileNavDrawer({
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
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-72 p-0 flex flex-col">
        <SheetHeader className="flex h-14 shrink-0 flex-row items-center border-b px-4 space-y-0">
          <SheetTitle className="flex-1 font-semibold tracking-tight">Praxor Kit</SheetTitle>
        </SheetHeader>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <ul className="space-y-0.5">
            {navItems.map((item) => {
              const className = cn(
                'flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors',
                item.active
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
              )
              return (
                <li key={item.href}>
                  <div onClick={close}>
                    {renderNavLink ? (
                      renderNavLink({ ...item, className, isCollapsed: false })
                    ) : (
                      <a href={item.href} className={className}>
                        {item.icon && <span className="size-4 shrink-0">{item.icon}</span>}
                        {item.label}
                      </a>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        </nav>

        {sidebarFooter && <div className="px-3 pb-2">{sidebarFooter}</div>}

        <div className="border-t p-3">
          <div className="flex items-center gap-2.5 rounded-md px-3 py-2">
            <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground">
              {(userName ?? userEmail ?? '?')[0]?.toUpperCase()}
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
                onSignOut()
                close()
              }}
              className="mt-0.5 w-full rounded-md px-3 py-2 text-left text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              Sign out
            </button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
```

- [ ] **Step 2: Export from index.ts**

Add to `packages/ui/src/index.ts`:
```ts
export { MobileNavDrawer } from './patterns/mobile-nav-drawer'
export type { MobileNavDrawerProps } from './patterns/mobile-nav-drawer'
```

- [ ] **Step 3: Verify typecheck**

```bash
pnpm typecheck
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add packages/ui/src/patterns/mobile-nav-drawer.tsx packages/ui/src/index.ts
git commit -m "feat: add MobileNavDrawer pattern component"
```

---

### Task 3: Create DashboardTopbar

**Files:**
- Create: `packages/ui/src/patterns/dashboard-topbar.tsx`
- Modify: `packages/ui/src/index.ts`

- [ ] **Step 1: Create the file**

```tsx
// packages/ui/src/patterns/dashboard-topbar.tsx
import type * as React from 'react'
import { useState, useEffect } from 'react'
import { Menu, Search, Bell, LogOut } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../primitives/dropdown-menu'
import { MobileNavDrawer } from './mobile-nav-drawer'
import type { NavItem } from './dashboard-shell'

export interface DashboardTopbarProps {
  title: string
  navItems: NavItem[]
  userName?: string
  userEmail?: string
  onSignOut?: () => void
  onSearch?: () => void
  renderNavLink?: (item: NavItem & { className: string; isCollapsed: boolean }) => React.ReactNode
  sidebarFooter?: React.ReactNode
}

export function DashboardTopbar({
  title,
  navItems,
  userName,
  userEmail,
  onSignOut,
  onSearch,
  renderNavLink,
  sidebarFooter,
}: DashboardTopbarProps) {
  const [drawerOpen, setDrawerOpen] = useState(false)

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        onSearch?.()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onSearch])

  return (
    <>
      <header className="flex h-14 shrink-0 items-center gap-3 border-b bg-card px-4">
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className="flex items-center justify-center rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground md:hidden"
          aria-label="Open navigation"
        >
          <Menu size={18} />
        </button>

        <h1 className="text-sm font-semibold">{title}</h1>

        <div className="flex flex-1 items-center justify-end gap-1">
          <button
            type="button"
            onClick={onSearch}
            className="flex items-center justify-center rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            aria-label="Search (⌘K)"
            title="Search (⌘K)"
          >
            <Search size={16} />
          </button>

          <button
            type="button"
            className="flex items-center justify-center rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            aria-label="Notifications"
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
                {(userName ?? userEmail ?? '?')[0]?.toUpperCase()}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col gap-0.5">
                  {userName && <span className="text-sm font-medium">{userName}</span>}
                  {userEmail && <span className="text-xs text-muted-foreground">{userEmail}</span>}
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {onSignOut && (
                <DropdownMenuItem onClick={onSignOut} className="text-muted-foreground">
                  <LogOut size={14} className="mr-2" />
                  Sign out
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <MobileNavDrawer
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
  )
}
```

- [ ] **Step 2: Export from index.ts**

Add to `packages/ui/src/index.ts`:
```ts
export { DashboardTopbar } from './patterns/dashboard-topbar'
export type { DashboardTopbarProps } from './patterns/dashboard-topbar'
```

- [ ] **Step 3: Verify typecheck**

```bash
pnpm typecheck
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add packages/ui/src/patterns/dashboard-topbar.tsx packages/ui/src/index.ts
git commit -m "feat: add DashboardTopbar pattern component"
```

---

### Task 4: Update DashboardShell — topbar slot, Tooltip nav, remove onSignOut

**Files:**
- Modify: `packages/ui/src/patterns/dashboard-shell.tsx`

Changes: add `topbar` slot prop, remove `onSignOut` prop (sign-out now lives in topbar dropdown), remove sidebar sign-out button, remove mobile-only `<header>` (topbar slot replaces it), wrap collapsed nav items in `Tooltip`.

Do Tasks 1–3 before this task. The layout.tsx in `apps/app` still passes `onSignOut` to `DashboardShell` at this point — that type error is fixed in the next task.

- [ ] **Step 1: Replace the full file**

```tsx
import type * as React from 'react'
import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '../lib/utils'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../primitives/tooltip'

export interface NavItem {
  label: string
  href: string
  icon?: React.ReactNode
  active?: boolean
}

export interface DashboardShellProps {
  children: React.ReactNode
  topbar?: React.ReactNode
  navItems: NavItem[]
  userName?: string
  userEmail?: string
  renderNavLink?: (item: NavItem & { className: string; isCollapsed: boolean }) => React.ReactNode
  sidebarFooter?: React.ReactNode
}

export function DashboardShell({
  children,
  topbar,
  navItems,
  userName,
  userEmail,
  renderNavLink,
  sidebarFooter,
}: DashboardShellProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key !== '[') return
      const target = e.target as HTMLElement
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable
      )
        return
      setIsCollapsed((prev) => !prev)
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <TooltipProvider>
      <div className="flex h-screen overflow-hidden bg-background">
        <aside
          className={cn(
            'hidden shrink-0 flex-col border-r bg-card md:flex overflow-hidden transition-[width] duration-200 ease-in-out',
            isCollapsed ? 'w-16' : 'w-60',
          )}
        >
          <div className="flex h-14 shrink-0 items-center border-b px-3 gap-2">
            {!isCollapsed && (
              <span className="flex-1 font-semibold tracking-tight whitespace-nowrap">Praxor Kit</span>
            )}
            <button
              type="button"
              onClick={() => setIsCollapsed((prev) => !prev)}
              className={cn(
                'flex shrink-0 items-center justify-center rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground',
                isCollapsed && 'w-full',
              )}
              aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              title={isCollapsed ? 'Expand sidebar ([ key)' : 'Collapse sidebar ([ key)'}
            >
              {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto px-3 py-4">
            <ul className="space-y-0.5">
              {navItems.map((item) => {
                const className = cn(
                  'flex w-full items-center rounded-md py-2 text-sm transition-colors',
                  isCollapsed ? 'justify-center px-0' : 'gap-2.5 px-3',
                  item.active
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                )
                const linkNode = renderNavLink ? (
                  renderNavLink({ ...item, className, isCollapsed })
                ) : (
                  <a href={item.href} className={className} aria-label={isCollapsed ? item.label : undefined}>
                    {item.icon && <span className="size-4 shrink-0">{item.icon}</span>}
                    {!isCollapsed && item.label}
                  </a>
                )
                return (
                  <li key={item.href}>
                    {isCollapsed ? (
                      <Tooltip>
                        <TooltipTrigger asChild>{linkNode}</TooltipTrigger>
                        <TooltipContent side="right">{item.label}</TooltipContent>
                      </Tooltip>
                    ) : (
                      linkNode
                    )}
                  </li>
                )
              })}
            </ul>
          </nav>

          {!isCollapsed && sidebarFooter && (
            <div className="px-3 pb-2">{sidebarFooter}</div>
          )}

          <div className="border-t p-3">
            <div
              className={cn(
                'flex items-center rounded-md py-2',
                isCollapsed ? 'justify-center px-0' : 'gap-2.5 px-3',
              )}
            >
              <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground">
                {(userName ?? userEmail ?? '?')[0]?.toUpperCase()}
              </div>
              {!isCollapsed && (
                <div className="min-w-0 flex-1">
                  {userName && (
                    <p className="truncate text-sm font-medium leading-none">{userName}</p>
                  )}
                  {userEmail && (
                    <p className="truncate text-xs text-muted-foreground">{userEmail}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          {topbar}
          <main className="flex-1 overflow-y-auto p-6">{children}</main>
        </div>
      </div>
    </TooltipProvider>
  )
}
```

- [ ] **Step 2: Verify typecheck — expect one error in layout.tsx**

```bash
pnpm typecheck
```

Expected: one error in `apps/app/src/routes/dashboard/layout.tsx` — it still passes `onSignOut` which was removed from `DashboardShellProps`. This is expected and fixed in Task 5. All other files should be clean.

- [ ] **Step 3: Commit**

```bash
git add packages/ui/src/patterns/dashboard-shell.tsx
git commit -m "feat: add topbar slot and Tooltip nav to DashboardShell, remove onSignOut"
```

---

### Task 5: Wire layout.tsx

**Files:**
- Modify: `apps/app/src/routes/dashboard/layout.tsx`

This fixes the typecheck error introduced in Task 4 and wires `DashboardTopbar` as the `topbar` slot.

- [ ] **Step 1: Replace the full file**

```tsx
import { useNavigate, Outlet, useLocation, Link } from 'react-router'
import { DashboardShell, DashboardTopbar, type NavItem, Button } from '@praxor-kit/ui'
import { LayoutDashboard, CreditCard, Settings } from 'lucide-react'
import { ProtectedRoute } from '../../components/protected-route'
import { FeedbackDialog } from '../../components/feedback-dialog'
import { ThemeToggle } from '../../components/theme-toggle'
import { UpgradeCard } from '../../components/upgrade-card'
import { signOut, useSession } from '../../lib/auth'

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/dashboard/billing': 'Billing',
  '/dashboard/settings': 'Settings',
}

function navItems(pathname: string): NavItem[] {
  return [
    {
      label: 'Dashboard',
      href: '/dashboard',
      active: pathname === '/dashboard',
      icon: <LayoutDashboard size={16} />,
    },
    {
      label: 'Billing',
      href: '/dashboard/billing',
      active: pathname === '/dashboard/billing',
      icon: <CreditCard size={16} />,
    },
    {
      label: 'Settings',
      href: '/dashboard/settings',
      active: pathname === '/dashboard/settings',
      icon: <Settings size={16} />,
    },
  ]
}

function DashboardContent() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { data: session } = useSession()

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  const items = navItems(pathname)
  const title = PAGE_TITLES[pathname] ?? 'Dashboard'

  function renderNavLink({
    href,
    className,
    label,
    icon,
    isCollapsed,
  }: NavItem & { className: string; isCollapsed: boolean }) {
    return (
      <Link to={href} className={className}>
        {icon && <span className="size-4 shrink-0">{icon}</span>}
        {!isCollapsed && label}
      </Link>
    )
  }

  const sidebarFooter = (
    <div className="flex flex-col gap-2">
      <UpgradeCard />
      <div className="flex items-center gap-2">
        <FeedbackDialog>
          <Button variant="ghost" size="sm" className="flex-1 justify-start text-muted-foreground">
            Send feedback
          </Button>
        </FeedbackDialog>
        <ThemeToggle />
      </div>
    </div>
  )

  return (
    <DashboardShell
      navItems={items}
      userName={session?.user.name}
      userEmail={session?.user.email}
      renderNavLink={renderNavLink}
      sidebarFooter={sidebarFooter}
      topbar={
        <DashboardTopbar
          title={title}
          navItems={items}
          userName={session?.user.name}
          userEmail={session?.user.email}
          onSignOut={handleSignOut}
          renderNavLink={renderNavLink}
          sidebarFooter={sidebarFooter}
        />
      }
    >
      <Outlet />
    </DashboardShell>
  )
}

export function DashboardLayout() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  )
}
```

- [ ] **Step 2: Verify typecheck**

```bash
pnpm typecheck
```

Expected: no errors.

- [ ] **Step 3: Start dev server and manually verify**

```bash
pnpm db:up && pnpm dev
```

Open `http://localhost:3000/dashboard` and check:

**Desktop (≥768px):**
- Sidebar on left, topbar across top
- Topbar shows page title, search icon, bell icon, user avatar circle
- Click user avatar → dropdown shows name, email, "Sign out"
- Click "Sign out" → redirects to `/login`
- Press `[` → sidebar collapses; hover a collapsed nav icon → tooltip shows label
- Navigate to `/dashboard/billing` → topbar title updates to "Billing"

**Mobile (<768px):**
- Sidebar hidden; hamburger appears in topbar on left
- Click hamburger → Sheet drawer slides in from left with full nav
- Click any nav link in drawer → drawer closes and navigates

- [ ] **Step 4: Commit**

```bash
git add apps/app/src/routes/dashboard/layout.tsx
git commit -m "feat: wire DashboardTopbar into dashboard layout"
```

---

### Task 6: Protected route redirect-back

**Files:**
- Modify: `apps/app/src/components/protected-route.tsx`
- Modify: `apps/app/src/routes/login.tsx`

- [ ] **Step 1: Replace protected-route.tsx**

```tsx
import { Navigate, useLocation } from 'react-router'
import { useSession } from '../lib/auth'

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { data: session, isPending } = useSession()
  const { pathname } = useLocation()

  if (isPending) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!session) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(pathname)}`} replace />
  }

  return <>{children}</>
}
```

- [ ] **Step 2: Replace login.tsx**

The only change from the original is: import `useLocation`, read `search`, and navigate to the validated redirect param instead of hardcoded `/dashboard`.

```tsx
import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router'
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label } from '@praxor-kit/ui'
import { signIn } from '../lib/auth'

export function LoginPage() {
  const navigate = useNavigate()
  const { search } = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const result = await signIn.email({ email, password })
      if (result.error) {
        setError(result.error.message ?? 'Sign in failed')
      } else {
        const params = new URLSearchParams(search)
        const redirectTo = params.get('redirect')
        const safe =
          redirectTo?.startsWith('/') && !redirectTo.startsWith('//')
            ? redirectTo
            : '/dashboard'
        navigate(safe, { replace: true })
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Sign in</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link
                  to="/forgot-password"
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Don't have an account?{' '}
            <Link to="/signup" className="text-foreground underline-offset-4 hover:underline">
              Create one
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
```

- [ ] **Step 3: Verify typecheck**

```bash
pnpm typecheck
```

Expected: no errors.

- [ ] **Step 4: Manually verify redirect-back**

1. Sign out (or clear session cookies in DevTools)
2. Navigate directly to `http://localhost:3000/dashboard/billing`
3. Expect URL to become `/login?redirect=%2Fdashboard%2Fbilling`
4. Log in with valid credentials
5. Expect redirect to `/dashboard/billing` — not `/dashboard`

- [ ] **Step 5: Commit**

```bash
git add apps/app/src/components/protected-route.tsx apps/app/src/routes/login.tsx
git commit -m "feat: implement redirect-back on protected routes"
```
