/**
 * What a member may upload, and how big it may be. The presign contracts, the
 * API, and every file picker read these values; none of them hardcodes a
 * byte count or a MIME type.
 *
 * The caps are set for a screen, not for a gallery. CapyTV is a PWA on a cheap
 * kiosk box behind a venue's network (docs/adr/0003), and a paid play holds for
 * `economy.slot.dwellSeconds` at most. A 30 s clip at 1080p and 6 Mbps is about
 * 22 MB, so 50 MB takes any creative a slot can show and refuses a film.
 */
export const media = {
  /** An avatar, a listing logo, or a photo of a screen in place. */
  image: {
    types: ["image/png", "image/jpeg", "image/webp"],
    maxBytes: 5 * 1024 * 1024,
  },
  /** A clip a screen plays. H.264 in MP4 decodes in hardware on every kiosk box. */
  video: {
    types: ["video/mp4"],
    maxBytes: 50 * 1024 * 1024,
  },
} as const;

export type ImageType = (typeof media.image.types)[number];
export type VideoType = (typeof media.video.types)[number];

/** The cap as a member reads it: "5 MB", "50 MB". */
export function megabytes(bytes: number): string {
  return `${Math.round(bytes / (1024 * 1024))} MB`;
}

/** True when the picker may hand the file on. The API applies the same rule. */
export function acceptsImage(file: { type: string; size: number }): boolean {
  return (
    (media.image.types as readonly string[]).includes(file.type) &&
    file.size <= media.image.maxBytes
  );
}

export function acceptsVideo(file: { type: string; size: number }): boolean {
  return (
    (media.video.types as readonly string[]).includes(file.type) &&
    file.size <= media.video.maxBytes
  );
}

/** Which cap a MIME type falls under, or null when neither list takes it. */
export function mediaKindOf(type: string): "image" | "video" | null {
  if ((media.image.types as readonly string[]).includes(type)) return "image";
  if ((media.video.types as readonly string[]).includes(type)) return "video";
  return null;
}
