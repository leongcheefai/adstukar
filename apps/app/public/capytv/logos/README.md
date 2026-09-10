# Advertiser logos

Drop a logo file here, then name it on the advertiser in `../index.html`:

```js
{ id: 'kopi', name: 'Kopi Lima', hue: 62, logo: 'kopi-lima.svg',
  head: '1-for-1 iced latte', url: 'kopilima.sg/1for1' },
```

An advertiser with no `logo` falls back to the drawn face in `FACES`.

## Export size

**SVG — preferred. No pixel size applies.** Requirements:

- A `viewBox` trimmed to the artwork. No built-in padding.
- No embedded raster image and no external reference. The file must draw itself.
- Colours that read on a near-black ground.

**PNG — 384 px tall. Transparent. Trimmed.**

Height is the number that matters, because the slot fixes the height and lets
the width follow the artwork. 384 px covers the largest screen this runs on:

| Screen, full width | Interface at 100% | Interface at 130% |
| --- | --- | --- |
| 1080p | 93 px | 121 px |
| 1440p | 124 px | 161 px |
| 4K | 186 px | 242 px |
| 5K | 248 px | 322 px |

## Shape

An **icon mark and a wordmark both work.** The slot is 8.6 units tall and
allows 14 units of width, so anything up to 1.6:1 lands at full height.

The ticker is one long crawling line, so a wider mark costs the run length
rather than layout. It is not rejected: it lands shorter than the slot. Past
about 3:1 a wordmark ends up too small to read at ticker speed.

## Slot size

| Where | Height | Max width |
| --- | --- | --- |
| Ticker | 8.6u — 63 px at 68% | 14u — 103 px |

Both are maximums, so nothing is ever stretched. The height is the name and
the tagline stacked, so the mark and the copy line up top and bottom.

## Two more rules

- **Light or reversed cut.** The bar is black. A mark drawn in dark ink for a
  white page disappears.
- **No file, no logo.** A name that points at a missing file leaves a gap, not
  a broken-image icon. The gap is the error message.

## Note

These are mock ads with invented offers. Keep any real company's mark in this
local prototype and out of anything published.
