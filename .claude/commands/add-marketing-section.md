Add a new section to the marketing site in `apps/web`.

Ask the user for the section name, purpose, and where it should appear on the page, then:

1. Check the pattern exports in `packages/ui/src/index.ts` before creating anything new. If an existing pattern fits, use it directly.

2. If a new pattern is needed:
   - Create `packages/ui/src/patterns/<name>.tsx`
   - Export it from `packages/ui/src/index.ts`

3. Add the section to `apps/web/src/components/LandingContent.tsx` (or `PricingContent.tsx` for pricing-related content) in the correct position.

4. React renders to static HTML by default. If the section needs browser-side state or events, add the appropriate `client:*` directive where the component is used from an `.astro` page. CSS hover/focus states do not require hydration.

5. Tailwind classes from new pattern components are only generated if the `@source` directive in `apps/web/src/styles/global.css` covers `packages/ui/src`. It does by default — do not remove it.

6. Run `pnpm --filter @repo/web typecheck`, then start `pnpm --filter @repo/web dev` and verify the section at `http://localhost:4321`. Run `pnpm verify` before finishing.
