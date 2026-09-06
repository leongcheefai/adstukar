# packages/ui

## Purpose
Shared React component library. Two layers: low-level shadcn `primitives` and higher-level marketing/dashboard `patterns`. It also owns the Tailwind v4 CSS entrypoint, self-hosted Poppins fonts, and all design tokens.

## Conventions
- Retheme by editing only `src/styles/tokens.css` — change palette primitives and their semantic mappings there. Never touch `src/styles/index.css` or add a Tailwind config for a color-only rebrand
- `src/index.ts` is the single export barrel — every new component must be added here
- No build step — consuming apps compile source directly via their bundler

## Common tasks

### Retheme / rebrand
Edit `src/styles/tokens.css`. The palette is defined as reusable primitives (`--ink-*`, `--brand-*`, status colors) mapped into shadcn semantic tokens for both `:root` and `.dark`. Change the primitives first so semantic and pattern-level tokens stay aligned.

The brand and ink ramps are `oklch()`, one hue (264.2) for both, so lightness steps stay perceptually even and the neutrals agree with the blue. `--brand-500` is the deck blue `#001CD8`. A new semantic token also needs a `--color-*` line in `@theme inline` in `index.css`, or Tailwind generates no utility for it — that is the one reason to open `index.css`.

### Per-app theme overrides
`src/styles/theme-dashboard.css` holds the neutral shadcn preset (`b27GdjG4`) for `apps/app` only. It is the one allowed exception to the "edit `tokens.css` only" rule, because a single file cannot give two apps different palettes.

- `apps/web` imports `@repo/ui/styles` only, so the landing page gets the CapyAds blue brand theme.
- `apps/app` imports `@repo/ui/styles` and then `@repo/ui/styles/theme-dashboard`. Import order is what makes the override win — both files use `:root` and `.dark`, so the later file applies.
- The file overrides the shadcn semantic, chart, sidebar, and radius tokens. Everything else — type scale, spacing, elevation, motion, icon sizes — still comes from `tokens.css`.
- It defines `--destructive-foreground` and `--radius-full` by hand. The preset omits both, but `index.css` maps them.
- To give the landing page the same theme, add the second import to `apps/web/src/styles/global.css`. To go back to one theme, delete the file and its import.

### Add a shadcn primitive
```bash
cd packages/ui
pnpm dlx shadcn@latest add <component>
```
Then export the new component from `src/index.ts`. After adding, fix any package-relative imports (e.g. `@repo/ui/lib/utils`) to relative paths (`../lib/utils`) — shadcn CLI generates these incorrectly for in-package use.

`components.json` sets `iconLibrary: "phosphor"`, so the CLI emits `@phosphor-icons/react` imports. Phosphor takes `weight` (`bold`, `fill`, …) where lucide took `strokeWidth`.

### Add a new pattern component
1. Create `src/patterns/<name>.tsx`
2. Export from `src/index.ts`

## Gotchas
- No `tailwind.config.ts` — Tailwind v4 is entirely CSS-first; all token wiring is in `src/styles/index.css` under `@theme inline`
- The self-hosted Poppins files are a public entrypoint (`@repo/ui/assets/fonts/*`); `apps/web` reads them from disk to draw OG images
- `apps/web` needs `@source "../../../../packages/ui/src"` in its `global.css` for Tailwind to scan UI pattern class names — removing it causes classes to be purged
- `DashboardShell` takes a `renderNavLink` prop instead of hard-coding `<a>` tags — keeps it router-agnostic; pass React Router `<Link>` from the app
- `DashboardShell` binds Up/Down/Home/End on its sidebar `<nav>` to move focus between nav items. It reads the DOM on each key press, so a new item or a collapsed group needs no registration. Tab still visits every item; the arrows are an extra path, not a roving tabindex
- `apps/web` still imports `lucide-react` directly in three of its own components; the shared patterns here are all Phosphor
- Tokens map to Tailwind utilities via `@theme inline` in `index.css`: `--primary` → `bg-primary`, `text-primary`, etc.
