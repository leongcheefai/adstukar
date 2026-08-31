Add a new page to the authenticated dashboard in `apps/app`.

Ask the user for the page name and what it should display, then:

1. Create `apps/app/src/routes/dashboard/<name>.tsx` — a React component. Use TanStack Query (`useQuery`/`useMutation`) for data fetching. Authenticated fetch calls must include `credentials: 'include'` and use `${env.VITE_API_URL}/<endpoint>`.

2. Add a route in `apps/app/src/router.tsx` nested inside the `/dashboard` parent:
   ```tsx
   <Route path="<name>" element={<NamePage />} />
   ```

3. Add a page title to `PAGE_TITLES` and a nav item in `navItems()` in `apps/app/src/routes/dashboard/layout.tsx`:
   ```ts
   { label: 'Name', href: '/dashboard/<name>', active: pathname === '/dashboard/<name>' }
   ```

4. Run `pnpm verify`.

The page is automatically wrapped in `ProtectedRoute` + `DashboardShell` because it is nested under the `/dashboard` route. Import UI primitives from `@repo/ui`. Use `@repo/ui` `Card` for content sections.
