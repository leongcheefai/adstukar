# apps/web

## Purpose
Astro 5 marketing site, statically generated at the canonical URL from `@repo/config/project`. One landing page ("Play ads and earn money") plus a help centre, blog, releases, and legal pages. No pricing page yet — top-up and payout are a later phase. It also generates OG images at build time with Satori.

## Conventions
- Pages live in `src/pages/` as `.astro` files — use `BaseLayout` for consistent `<head>` SEO and OG meta
- Product name, site URL, and public email addresses come from `@repo/config/project` — do not duplicate them here
- React components in `src/components/*.tsx` render server-side by default — add `client:load`, `client:visible`, or another `client:*` directive only when they need browser-side behavior
- The landing page is one pure function of a config: `src/components/landing/Landing.tsx` renders `src/lib/landing.config.json`. Landing copy lives in that component; the crawl, the drawn screen, and the FAQ blocks are its siblings in `src/components/landing/`. FAQ questions live in `src/lib/faq.ts` in three groups, and the landing page prints the first few of each; there is no `/faq` page. The help centre is `/help`, under `src/layouts/HelpLayout.astro` (side menu, no site header, no ticker): one file in `src/content/help/` is one topic and one page, its `##` headings are the sections the side menu and the search link to, and a topic that quotes a number is `.mdx` and imports it from `@repo/config/economy`. Every "Refer to …" that names another section or topic is a link: `[Refund of a slot](/help/advertising#refund-of-a-slot)`, or `[Remove an ad](#remove-an-ad)` on the same page; the anchor is the heading's slug (`helpSectionSlug` in `src/lib/help.ts`). The help home shows a greeting and the search only. Help copy is written in ASD-STE100 Simplified Technical English; page metadata is centralized in `src/lib/pages.ts`; page-specific copy stays with its route or content entry
- Every invented number on the landing page (the sample venue, the crawl's listings, the chart) is drawn from the config's `seed` through `src/lib/landing/prng.ts` and `src/lib/landing/sample.ts`. Never call `Math.random` in a component: the same seed must draw the same page
- Economy numbers shown on the site come from `@repo/config/economy` — never type an amount. The rate is one number for every screen (`earnPerPlay()`), and the slot price is `economy.slot`
- Browser-exposed env goes through `src/lib/env.ts` (validated via `@t3-oss/env-core`) — never read `import.meta.env` directly, and never import `@repo/env`, which is server-only. Add new vars to the schema there and to the root `.env.example`; they must carry the `PUBLIC_` prefix to reach the bundle.
- Tailwind utility classes from `@repo/ui` patterns are only generated because of the `@source` directive in `src/styles/global.css` — do not remove it

## Common tasks

### Change how the landing page looks
Start the dev server and open `http://localhost:4321/lab/landing`. Pick a mode, move the knobs, click the page for a new seed, and press Save: it writes `src/lib/landing.config.json` (through a dev-only Vite middleware in `astro.config.ts`) and the site re-renders from it. The route builds nothing in production. Bounds for every knob live in `src/lib/landing/config.ts`.

### Update marketing copy
Edit `src/components/landing/Landing.tsx` for the landing page, `src/lib/faq.ts` for FAQ items, and `src/lib/pages.ts` for page metadata. Legal, help, customer, security, and blog copy lives in the corresponding route or `src/content/` entry. `pnpm launch:check` lists remaining placeholders.

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
- `landing.config.json` is validated with zod when a page imports it. A hand edit outside the bounds in `src/lib/landing/config.ts` fails the build on purpose
- The fixed ticker at the foot of every page (`src/components/landing/Ticker.tsx`, set in Inter Display from `src/assets/fonts`) follows `footCrawl` in the landing config, and `BaseLayout` reserves its height on `body[data-crawl]`. A page passes `crawl={false}` to opt out. It carries the live play total through `src/lib/play-count.ts`; the ad crawl (`Crawl.tsx`) now lives only inside the drawn set
- Type-check with `astro check`, not `tsc`
- OG image generation (`src/pages/og/[slug].png.ts`) fetches fonts from jsDelivr at build time — offline builds fail; swap to `fs.readFileSync` for local testing
- React components render static HTML by default. Add a `client:*` directive in the `.astro` file only when browser-side behavior is required; CSS-only interactions do not need hydration.
