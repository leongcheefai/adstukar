import type { ReactNode } from "react";

export type TickerAd = {
  id: string;
  name: string;
  hue: number;
  head: string;
  url: string;
  /** Optional filename under a logos folder. Drawn face is the fallback. */
  logo?: string;
  face: ReactNode;
};

/**
 * Invented advertisers for the overlay. Brand hue is theirs; CapyAds stays
 * neutral. Four fields reach the screen: the mark, the name, the tagline and
 * the URL the ad links to.
 */
export const TICKER_ADS: TickerAd[] = [
  {
    id: "kopi",
    name: "Kopi Lima",
    hue: 62,
    head: "1-for-1 iced latte",
    url: "kopilima.sg/1for1",
    face: (
      <>
        <path d="M5.2 9h10.3v4.3a4.7 4.7 0 0 1-4.7 4.7h-.9a4.7 4.7 0 0 1-4.7-4.7Z" />
        <path d="M15.5 10.2h1.6a2.6 2.6 0 0 1 0 5.2h-1.6" />
        <path d="M8.6 6.4c0-1 1-1.3 1-2.4M12.2 6.4c0-1 1-1.3 1-2.4" />
      </>
    ),
  },
  {
    id: "halcyon",
    name: "Halcyon Dental",
    hue: 225,
    head: "New patient scan, $49",
    url: "halcyon.dental/49",
    face: (
      <path d="M12 5.4c2-1.4 4.7-1.2 5.9.5 1.2 1.8.5 4.4-.4 7.1-.5 1.7-.8 3.6-1.1 4.9-.3 1.3-2 1.4-2.5.2l-1.3-3.3a.6.6 0 0 0-1.2 0l-1.3 3.3c-.5 1.2-2.2 1.1-2.5-.2-.3-1.3-.6-3.2-1.1-4.9-.9-2.7-1.6-5.3-.4-7.1 1.2-1.7 3.9-1.9 5.9-.5Z" />
    ),
  },
  {
    id: "rumah",
    name: "Rumah Gym",
    hue: 152,
    head: "First month free",
    url: "rumahgym.co/free",
    face: (
      <>
        <path d="M8.4 12h7.2" />
        <path d="M8.4 8.8v6.4M15.6 8.8v6.4" />
        <path d="M5.6 10.4v3.2M18.4 10.4v3.2" />
      </>
    ),
  },
  {
    id: "teluk",
    name: "Teluk Optics",
    hue: 300,
    head: "Two frames, one price",
    url: "telukoptics.com/two",
    face: (
      <>
        <circle cx="7.6" cy="13.2" r="3.5" />
        <circle cx="16.4" cy="13.2" r="3.5" />
        <path d="M11.1 12.7c.5-.5 1.3-.5 1.8 0" />
        <path d="M4.1 12.2 3.2 9.4M19.9 12.2l.9-2.8" />
      </>
    ),
  },
];

export function brandOklch(hue: number): string {
  return `oklch(0.80 0.16 ${hue})`;
}
