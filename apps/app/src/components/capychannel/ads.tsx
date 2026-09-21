import type { ReactNode } from "react";

export type TickerAd = {
  id: string;
  name: string;
  hue: number;
  head: string;
  url: string;
  /** Optional path of a file under `public/logos`. Drawn face is the fallback. */
  logo?: string;
  face: ReactNode;
};

/**
 * The brands the overlay prints before the API has a slot model. Brand hue is
 * theirs; CapyAds stays neutral. Four fields reach the screen: the mark, the
 * name, the tagline and the URL the ad links to.
 */
export const TICKER_ADS: TickerAd[] = [
  {
    id: "tinyorder",
    name: "TinyOrder",
    hue: 15,
    head: "Made for small businesses",
    url: "tinyorder.shop",
    // Their own icon, copied from the site into `public/logos`.
    logo: "/logos/tinyorder.png",
    face: (
      <>
        <path d="M7.5 4.5h9v15l-2.25-1.5L12 19.5 9.75 18 7.5 19.5Z" />
        <path d="M10 8.5h4M10 11.5h4" />
      </>
    ),
  },
  {
    id: "overthere",
    name: "Overthere",
    hue: 250,
    head: "Find your car superfast",
    url: "overthereapp.xyz",
    // Their own icon, copied from the site into `public/logos`.
    logo: "/logos/overthere.png",
    face: (
      <>
        <path d="M8 18.5V6h8v12.5" />
        <path d="M8 18.5h2M14 18.5h2" />
      </>
    ),
  },
];

export function brandOklch(hue: number): string {
  return `oklch(0.80 0.16 ${hue})`;
}
