import type { PresetList } from "@repo/contracts/types";
import type { ReactNode } from "react";
import convertibleThumb from "../../../assets/wallpapers/jack-berry/convertible-thumb.jpg";
import convertible from "../../../assets/wallpapers/jack-berry/convertible.jpg";
import counterThumb from "../../../assets/wallpapers/jack-berry/counter-thumb.jpg";
import counter from "../../../assets/wallpapers/jack-berry/counter.jpg";
import harbourThumb from "../../../assets/wallpapers/jack-berry/harbour-thumb.jpg";
import harbour from "../../../assets/wallpapers/jack-berry/harbour.jpg";
import storefrontThumb from "../../../assets/wallpapers/jack-berry/storefront-thumb.jpg";
import storefront from "../../../assets/wallpapers/jack-berry/storefront.jpg";
import type { LibraryItem } from "../../../lib/library";

export const CHANNEL_IDS = ["upload", "wallpaper", "tv"] as const;

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
  {
    id: "tv",
    label: "Capy Channel",
    icon: (
      <>
        <rect x="3.4" y="7.4" width="17.2" height="12.2" rx="2.4" />
        <path d="m8.4 3.6 3.6 3.8 3.6-3.8" />
      </>
    ),
  },
];

/** One photo in two files, the picture for the set and a small one for its tile. */
export type WallpaperPhoto = { src: string; thumb: string };

/**
 * A collection is one photographer's photos. The chooser shows it as one tile
 * with the name under it, and the set plays its photos one at a time, with
 * "Photo by" and the author on each, or the name when there is no author. A
 * click on any photo opens `url`. The first photo is the cover.
 */
export type WallpaperCollection = {
  id: string;
  name: string;
  author: string | null;
  url: string;
  photos: readonly WallpaperPhoto[];
};

/**
 * The collections an admin set on the preset desk, in its order. A collection
 * with no photo has nothing to play, so it stays off the chooser. The set
 * shows a photo cropped to fill, so the full file serves as its own thumbnail.
 */
export function presetCollections(list: PresetList): WallpaperCollection[] {
  return list.collections
    .map((collection) => ({
      id: collection.id,
      name: collection.name,
      author: collection.author,
      url: collection.url,
      photos: list.items
        .filter((item) => item.collectionId === collection.id && item.kind === "image")
        .map((item) => ({ src: item.url, thumb: item.url })),
    }))
    .filter((collection) => collection.photos.length > 0);
}

/**
 * Demo content, bundled with the app: the link is the photographer's page.
 * The chooser shows it only while the preset desk holds no collection with a
 * photo, so a new install still has a wallpaper to play.
 */
export const WALLPAPER_COLLECTIONS: readonly WallpaperCollection[] = [
  {
    id: "jack-berry",
    name: "Jack Berry Collection",
    author: "Jack Berry",
    url: "https://unsplash.com/@jackseeberry",
    photos: [
      { src: storefront, thumb: storefrontThumb },
      { src: counter, thumb: counterThumb },
      { src: convertible, thumb: convertibleThumb },
      { src: harbour, thumb: harbourThumb },
    ],
  },
];

/**
 * What the member chose to play. An upload plays from its public URLs. The
 * Capy Channel carries its own guide (`channels/tv-guide.json`), so it plays
 * straight from its tile.
 */
export type ChannelPick =
  | { id: "upload"; items: LibraryItem[] }
  | { id: "wallpaper"; collection: WallpaperCollection }
  | { id: "tv" };
