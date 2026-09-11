# The exchange model is campaign, listing, device, placement, play

The original schema gave `product` two jobs — the thing advertised and the ad
creative — and made `placement` a spot on the advertiser's own website. Neither
fits a network of screens owned by other people. `apps/app` had already worked
around it by deriving a campaign from products that share a domain, and by
keeping empty campaigns in `localStorage`.

The model is now five things:

- **campaign** — one destination site, its verified domain, its state, its daily
  budget.
- **listing** — one creative under a campaign, up to four, for comparison.
- **device** — one physical screen running CapyTV; owner, venue type, tier,
  location, approval, daily play cap.
- **placement** — one overlay region on a device (`band`, `float`, `ticker`) with
  its format, dwell, and gap.
- **play** — one listing shown in one placement for its dwell.

A device may hold several placements, but **only one paid listing is on screen at
a time**. Concurrent regions would charge several advertisers for one pair of
eyes, and would make the daily cap meaningless unless it counted at device level.

## Consequences

- `product`, `placement` as a website spot, and the `Host` / `Advertiser`
  glossary pair all get renamed across `db`, `contracts`, `api`, `app`, and `ui`.
- The `localStorage` draft-campaign store in `apps/app/src/lib/draft-campaigns.ts`
  is deleted once the API owns campaigns.
- `MAX_ADS_PER_CAMPAIGN` moves from a client constant into `packages/config`.
- The rate an advertiser pays is `tier x format`, so both need a row to sit on.
- `apps/embed` and the web surface stay in the repo, unmaintained.
