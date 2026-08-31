# Dark Mode Design

**Date:** 2026-05-03
**Status:** Approved

## Summary

Add light/dark mode toggle to the authenticated dashboard app. CSS tokens for both modes already exist in `packages/ui/src/styles/tokens.css`. Work is wiring up state management, flash prevention, and toggle UI.

## Architecture

### Flash Prevention (index.html inline script)

A small inline `<script>` in `apps/app/index.html` runs before React mounts. It reads `localStorage.getItem('theme')` and falls back to `window.matchMedia('(prefers-color-scheme: dark)').matches`. If dark, it adds `class="dark"` to `<html>` immediately. This prevents any flash of unstyled content on reload.

### Theme Hook (`apps/app/src/lib/theme.ts`)

A `ThemeProvider` React context and `useTheme` hook manage theme state in React. State is `'light' | 'dark' | 'system'`. The provider:
- Initializes from localStorage (or `'system'` if absent)
- Keeps `<html>` class in sync on every state change
- Persists to localStorage on change
- Exposes `{ theme, setTheme }` via context

`'system'` means: read `prefers-color-scheme` at runtime and apply the matching class, but don't persist a hard override.

### Toggle Component (`apps/app/src/components/theme-toggle.tsx`)

Icon-only button using Lucide `Sun` / `Moon` icons (already available via shadcn). Clicking cycles `light → dark → light`. Uses shadcn `Button` with `variant="ghost" size="icon"`. Shows Sun when light, Moon when dark (system resolves to whichever it currently is).

### Wiring

- `apps/app/src/main.tsx` — wrap root with `ThemeProvider`
- `apps/app/src/routes/dashboard/layout.tsx` — add `ThemeToggle` to `sidebarFooter` alongside existing `FeedbackDialog` button

## Data Flow

```
index.html script
  → reads localStorage / matchMedia
  → sets html.className before React mounts

ThemeProvider (main.tsx)
  → reads localStorage on mount
  → syncs html.className on setTheme
  → writes localStorage on setTheme

ThemeToggle (sidebar footer)
  → calls setTheme
  → icon reflects current resolved theme
```

## Files

| File | Action |
|------|--------|
| `apps/app/index.html` | Add inline script before `</head>` |
| `apps/app/src/lib/theme.ts` | Create — ThemeProvider + useTheme |
| `apps/app/src/components/theme-toggle.tsx` | Create — Sun/Moon toggle button |
| `apps/app/src/main.tsx` | Wrap with ThemeProvider |
| `apps/app/src/routes/dashboard/layout.tsx` | Add ThemeToggle to sidebarFooter |

## Out of Scope

- `apps/web` (marketing site) dark mode — not needed now
- Moving ThemeProvider to `packages/ui` — YAGNI
- Three-way system/light/dark picker — overkill for sidebar footer
