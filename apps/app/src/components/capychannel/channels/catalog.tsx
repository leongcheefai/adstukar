import type { ReactNode } from "react";

export const CHANNEL_IDS = ["upload", "wallpaper"] as const;

export type ChannelId = (typeof CHANNEL_IDS)[number];

export type ChannelDef = {
  id: ChannelId;
  label: string;
  /** Stroked on a 24 grid. */
  icon: ReactNode;
};

export const CHANNELS: ChannelDef[] = [
  {
    id: "upload",
    label: "Images/Video",
    icon: <path d="M12 5.2v13.6M5.2 12h13.6" />,
  },
  {
    id: "wallpaper",
    label: "Wallpaper",
    icon: (
      <>
        <rect x="3.6" y="4.9" width="16.8" height="14.2" rx="2.4" />
        <path d="M8.7 10.2h.01" />
        <path d="M4.2 16.4 9 12.2l4.2 3.6 2.9-2.3 3.3 2.9" />
      </>
    ),
  },
];

/** Drawn in `capychannel.css` as `.wall-<id>`, so a preset ships no image file. */
export const WALLPAPERS = [
  { id: "beach", label: "Beach" },
  { id: "night", label: "Night" },
  { id: "market", label: "Market" },
  { id: "portrait", label: "Portrait" },
  { id: "firepit", label: "Firepit" },
] as const;

export type WallpaperId = (typeof WALLPAPERS)[number]["id"];

/** What the member chose to play. The files live in memory only. */
export type ChannelPick =
  | { id: "upload"; files: File[] }
  | { id: "wallpaper"; wallpaper: WallpaperId };
