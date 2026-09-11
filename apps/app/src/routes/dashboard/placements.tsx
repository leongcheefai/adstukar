import { Button } from "@repo/ui";

/**
 * CapyTV — the placement as a screen, not a snippet.
 *
 * The page is an entrance and nothing more: the title, and one control that
 * starts the screen. Everything a placement used to ask for at this level —
 * mode, product, size, keys, the embed snippet — is gone, because CapyTV asks
 * for none of it.
 *
 * The Campaigns page is independent of this one. Nothing here reads a listing,
 * and no edit there changes what CapyTV plays.
 */
export function PlacementsPage() {
  return (
    <div className="flex min-h-full flex-col">
      <h1 className="text-2xl font-semibold tracking-tight">CapyTV</h1>

      {/* The one action, centred in what is left of the page. The screen is a
          standalone page under public/, outside the SPA, so this is a plain
          anchor rather than a router Link. */}
      <div className="flex flex-1 items-center justify-center">
        <Button asChild size="lg">
          <a href="/capytv/index.html" target="_blank" rel="noreferrer">
            Start CapyTV
          </a>
        </Button>
      </div>
    </div>
  );
}
