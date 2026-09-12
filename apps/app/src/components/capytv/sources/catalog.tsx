import type { ReactNode } from "react";

export const SOURCE_IDS = ["yt", "firepit", "album", "web", "pod", "rss"] as const;

export type SourceId = (typeof SOURCE_IDS)[number];

export type SourceDef = {
  id: SourceId;
  label: string;
  /** Stroked on a 24 grid. */
  icon: ReactNode;
};

export const SOURCES: SourceDef[] = [
  {
    id: "yt",
    label: "Live clip",
    icon: (
      <>
        <rect x="3" y="5" width="18" height="14" rx="2.6" />
        <path d="M10.3 9.4 15 12l-4.7 2.6Z" />
      </>
    ),
  },
  {
    id: "firepit",
    label: "Firepit",
    icon: (
      <>
        <path d="M12 3.8c2.9 3 4.5 5.1 4.5 7.6A4.5 4.5 0 0 1 12 16.4a4.5 4.5 0 0 1-4.5-4.8c0-1.4.6-2.7 1.8-4 .1 1.3.8 2.2 1.8 2.5C11.1 7.8 11.4 5.8 12 3.8Z" />
        <path d="M7.4 19.2 12 16.9l4.6 2.3" />
      </>
    ),
  },
  {
    id: "album",
    label: "Photo Video",
    icon: (
      <>
        <rect x="3.6" y="4.9" width="16.8" height="14.2" rx="2.4" />
        <path d="M8.7 10.2h.01" />
        <path d="M4.2 16.4 9 12.2l4.2 3.6 2.9-2.3 3.3 2.9" />
      </>
    ),
  },
  {
    id: "web",
    label: "Website",
    icon: (
      <>
        <rect x="3.2" y="4.9" width="17.6" height="14.2" rx="2.4" />
        <path d="M3.2 9.3h17.6" />
        <path d="M6.3 7.1h.01M8.7 7.1h.01M11.1 7.1h.01" />
      </>
    ),
  },
  {
    id: "pod",
    label: "Podcast",
    icon: (
      <>
        <rect x="9.4" y="3.4" width="5.2" height="9.6" rx="2.6" />
        <path d="M6.4 11.3a5.6 5.6 0 0 0 11.2 0" />
        <path d="M12 16.9v3.1" />
      </>
    ),
  },
  {
    id: "rss",
    label: "RSS feed",
    icon: (
      <>
        <path d="M5.6 18.4h.01" />
        <path d="M5.6 12.1a6.3 6.3 0 0 1 6.3 6.3" />
        <path d="M5.6 6.1a12.3 12.3 0 0 1 12.3 12.3" />
      </>
    ),
  },
];
