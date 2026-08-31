# apps/web

## Purpose
Astro 5 marketing site, statically generated at the canonical URL from `@repo/config/project`. It has no protected pages, but interactive pricing can call the API for billing configuration and checkout. It also generates OG images at build time with Satori.

## Conventions
- Pages live in `src/pages/` as `.astro` files — use `BaseLayout` for consistent `<head>` SEO and OG meta
- Product name, site URL, and public email addresses come from `@repo/config/project` — do not duplicate them here
- React components in `src/components/*.tsx` render server-side by default — add `client:load`, `client:visible`, or another `client:*` directive only when they need browser-side behavior
- Landing and pricing section copy lives in `src/components/LandingContent.tsx` and `src/components/PricingContent.tsx`; page metadata is centralized in `src/lib/pages.ts`; page-specific copy stays with its route or content entry
- Browser-exposed env goes through `src/lib/env.ts` (validated via `@t3-oss/env-core`) — never read `import.meta.env` directly, and never import `@repo/env`, which is server-only. Add new vars to the schema there and to the root `.env.example`; they must carry the `PUBLIC_` prefix to reach the bundle.
- Tailwind utility classes from `@repo/ui` patterns are only generated because of the `@source` directive in `src/styles/global.css` — do not remove it

## Common tasks

### Update marketing copy
Edit `src/components/LandingContent.tsx` for the landing page, `src/components/PricingContent.tsx` for pricing, and `src/lib/pages.ts` for page metadata. Legal, FAQ, customer, security, and blog copy lives in the corresponding route or `src/content/` entry. `pnpm launch:check` lists remaining placeholders.

### Add a new page
1. Create `src/pages/<name>.astro`
2. Use `<BaseLayout>` — pass an `ogSlug` prop matching the page name
3. Add the page to `MARKETING_PAGES` in `src/lib/pages.ts`; the OG image route derives its static paths from that registry

### Add a blog post
Create a markdown/MDX file under `src/content/blog/`. Its page and OG image are generated automatically.

### Change the domain / site URL
Update `siteUrl` in `packages/config/src/project.ts`.

## Gotchas
- Dev server runs on port 4321: `pnpm --filter @repo/web dev`
- Type-check with `astro check`, not `tsc`
- OG image generation (`src/pages/og/[slug].png.ts`) fetches fonts from jsDelivr at build time — offline builds fail; swap to `fs.readFileSync` for local testing
- React components render static HTML by default. Add a `client:*` directive in the `.astro` file only when browser-side behavior is required; CSS-only interactions do not need hydration.
