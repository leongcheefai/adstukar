# apps/capytv

## Purpose
CapyTV: the screen app a distributor installs. A Vite + React PWA that runs in a
kiosk browser on a TV, a stick, a tablet, or an old laptop. It shows thin content
— a clock, the weather, a local feed — and plays listings over that content. The
content is the reason a venue leaves the screen on. Runs on port 3002 in
development. See `docs/adr/0003`.

## How the screen runs
1. It is paired with a device key, taken from `?key=` or typed in once. The key
   is the whole credential: there is no session on a screen.
2. `GET /loop` hands it a batch of already-open plays. It holds the batch in
   `localStorage`.
3. It shows one play for its dwell, then holds the whole device quiet for the
   gap. Only one paid listing is on screen at a time. The cycle runs only while
   the page is visible: a minimised or covered page shows nothing and owes
   nothing, and a play cut short stays in the batch.
4. Each finished play joins the report queue. The queue drains whenever the
   screen has a network, and survives a reload.
5. A batch running low, or a network coming back, takes the next batch.

## Layout
| File | What it owns |
|---|---|
| `src/lib/queue.ts` | the report queue rules (pure) |
| `src/lib/schedule.ts` | which cached play comes next, and when (pure) |
| `src/lib/feed.ts` | reading headlines out of RSS or Atom (pure) |
| `src/lib/weather.ts` | WMO code to a word (pure) |
| `src/lib/poll.ts` | ask again on an interval, keep the last answer |
| `src/lib/player.ts` | the timers and the state that tie those together |
| `src/lib/storage.ts` | everything the device keeps across a reload |
| `src/lib/api.ts` | the two calls: loop and report |
| `src/components/spot.tsx` | one listing drawn in one overlay region |
| `public/sw.js` | the offline shell |

## Conventions
- All env access through `src/lib/env.ts` — never `import.meta.env.VITE_*` directly
- Types come from `@repo/contracts/types`, never the root specifier
- Economy numbers come from `@repo/config/economy` — never a literal here
- The pure files hold the rules and the components hold the timers. A rule that
  needs a `Date` takes one; nothing pure reads the clock

## Gotchas
- The report body goes as **text/plain**, because the same shape leaves through
  `navigator.sendBeacon` when the page is torn down and a beacon cannot send a
  JSON content type. `POST /report` on the API parses it by hand
- `localStorage` throws in some contexts (a private window, blocked site data).
  Every read in `storage.ts` answers with a default rather than failing the screen
- The service worker never caches the API. A stale batch would be plays the
  server has already voided, and a cached report would be a play counted twice
- Open-Meteo and the venue's feed are called straight from the device, so the
  feed has to answer with CORS. A feed that refuses shows nothing rather than
  breaking the screen
- `parseFeed` needs a DOM, so `vitest.config.ts` sets the jsdom environment. The
  rest of the suite is pure, except `player.test.ts`, which mounts the hook
- Node 22+ owns a `localStorage` global of its own, undefined without a flag, so
  jsdom's never lands. `player.test.ts` installs a Map-backed one
