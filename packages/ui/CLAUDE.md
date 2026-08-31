# packages/ui

## Purpose
Shared React component library. Two layers: low-level shadcn `primitives` and higher-level marketing/dashboard `patterns`. It also owns the Tailwind v4 CSS entrypoint, self-hosted Poppins fonts, and all design tokens.

## Conventions
- Retheme by editing only `src/styles/tokens.css` — change palette primitives and their semantic mappings there. Never touch `src/styles/index.css` or add a Tailwind config for a color-only rebrand
- `src/index.ts` is the single export barrel — every new component must be added here
- No build step — consuming apps compile source directly via their bundler

## Common tasks

### Retheme / rebrand
Edit `src/styles/tokens.css`. The palette is defined as reusable hex primitives (`--ink-*`, `--brand-*`, status colors) mapped into shadcn semantic tokens for both `:root` and `.dark`. Change the primitives first so semantic and pattern-level tokens stay aligned.

### Add a shadcn primitive
```bash
cd packages/ui
pnpm dlx shadcn@latest add <component>
```
Then export the new component from `src/index.ts`. After adding, fix any package-relative imports (e.g. `@repo/ui/lib/utils`) to relative paths (`../lib/utils`) — shadcn CLI generates these incorrectly for in-package use.

### Add a new pattern component
1. Create `src/patterns/<name>.tsx`
2. Export from `src/index.ts`

## Gotchas
- No `tailwind.config.ts` — Tailwind v4 is entirely CSS-first; all token wiring is in `src/styles/index.css` under `@theme inline`
- `apps/web` needs `@source "../../../../packages/ui/src"` in its `global.css` for Tailwind to scan UI pattern class names — removing it causes classes to be purged
- `DashboardShell` takes a `renderNavLink` prop instead of hard-coding `<a>` tags — keeps it router-agnostic; pass React Router `<Link>` from the app
- Tokens map to Tailwind utilities via `@theme inline` in `index.css`: `--primary` → `bg-primary`, `text-primary`, etc.
