# @repo/embed

The ad snippet that member sites load. Vanilla TypeScript, no dependencies, one request to
`/serve` and one beacon to `/beacon`. No cookies, no storage, no third-party requests.

## Snippet

```html
<div data-adstukar-key="pk_xxx"></div>
<script async src="https://<host>/embed/adstukar.js"></script>
```

The script mounts every `[data-adstukar-key]` element on `DOMContentLoaded`. Single-page
apps that add slots later call `window.AdsTukar.mountAll()` or
`window.AdsTukar.mount(el, { key })`.

## Data attributes

| Attribute            | Purpose                                                          |
| -------------------- | ---------------------------------------------------------------- |
| `data-adstukar-key`  | The placement key from the dashboard. Required.                  |
| `data-adstukar-api`  | API origin override for self-hosting. Defaults to the build-time `VITE_API_URL`. |

The script sets `data-adstukar-ready="1"` on a mounted element so a second mount is a no-op.

## React

```tsx
import { AdsTukar } from "@repo/embed/react";

<AdsTukar apiKey="pk_xxx" />;
```

`api`, `className`, and `style` are optional props. The component mounts the card directly;
it does not inject the script.

## Card

The server picks the size per placement: `small` is 320 x 64, `medium` is 300 x 120
(`economy.cardSizes`). The beacon fires once, when the card stays at least 50% visible for
1 s (`economy.viewability`).

## Build

```sh
pnpm --filter @repo/embed build
```

Outputs `dist/adstukar.js` (IIFE), `dist/react.js` (ES module, React external), and
`dist/playground.html`. `scripts/check-size.mjs` fails the build when `adstukar.js` gzips
above 10 kB.

## Playground

With the API running, open `http://localhost:3001/embed/playground.html?key=pk_xxx`. The
page shows one slot at the top and one 2000 px lower, so a scroll shows the viewability
beacon in the network panel.
