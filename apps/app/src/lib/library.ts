import { acceptsImage, acceptsVideo, media, megabytes } from "@repo/config/media";

/**
 * The member's own pictures and clips: what the Images/Video channel plays.
 *
 * The API has no table for this yet. Each file goes to storage through a
 * presigned PUT, and the public URL that comes back is the only record of it,
 * so the list lives on this browser, one list per member. A delete here takes
 * the row off the set; the object stays in the bucket. Both are the backend
 * work this file waits on.
 */
export type MediaKind = "image" | "video";

export type LibraryItem = {
  id: string;
  url: string;
  kind: MediaKind;
  name: string;
  size: number;
  addedAt: string;
};

const LIBRARY_KEY = "adstukar:library";
const CONSENT_KEY = "adstukar:upload-consent";

export const IMAGE_LIMIT = `PNG, JPEG or WebP up to ${megabytes(media.image.maxBytes)}`;
export const VIDEO_LIMIT = `MP4 up to ${megabytes(media.video.maxBytes)}`;
export const LIMITS = `${IMAGE_LIMIT}. ${VIDEO_LIMIT}.`;
/** The caps in one breath, for the info disc on the library. */
export const CAPS = `Up to ${megabytes(media.image.maxBytes)} for photos, ${megabytes(media.video.maxBytes)} for videos`;

/** What the picker accepts: the same list the presign contracts accept. */
export const ACCEPT = [...media.image.types, ...media.video.types].join(",");

export function kindOf(file: { type: string }): MediaKind {
  return file.type.startsWith("video/") ? "video" : "image";
}

/**
 * Why a file cannot go up, in the member's words, or null when it can. The
 * rule is the one the presign routes apply, so the refusal happens on the set
 * before a byte leaves it.
 */
export function refusal(file: { name: string; type: string; size: number }): string | null {
  if (acceptsImage(file) || acceptsVideo(file)) return null;
  const isImage = (media.image.types as readonly string[]).includes(file.type);
  const isVideo = (media.video.types as readonly string[]).includes(file.type);
  if (!isImage && !isVideo) return `${file.name} is not a PNG, JPEG, WebP or MP4.`;
  const cap = isVideo ? media.video.maxBytes : media.image.maxBytes;
  const noun = isVideo ? "A clip" : "An image";
  return `${file.name} is ${megabytes(file.size)}. ${noun} goes up to ${megabytes(cap)}.`;
}

/** Selection is a set of ids. Clicking a tile flips it. */
export function toggle(selected: ReadonlySet<string>, id: string): Set<string> {
  const next = new Set(selected);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  return next;
}

/** The items to play: the selection in library order, or the whole library. */
export function toPlay(
  items: readonly LibraryItem[],
  selected: ReadonlySet<string>,
): LibraryItem[] {
  const chosen = items.filter((item) => selected.has(item.id));
  return chosen.length > 0 ? chosen : [...items];
}

function isItem(value: unknown): value is LibraryItem {
  if (!value || typeof value !== "object") return false;
  const rec = value as Record<string, unknown>;
  return (
    typeof rec.id === "string" &&
    typeof rec.url === "string" &&
    (rec.kind === "image" || rec.kind === "video") &&
    typeof rec.name === "string" &&
    typeof rec.size === "number" &&
    typeof rec.addedAt === "string"
  );
}

export function readLibrary(userId: string): LibraryItem[] {
  try {
    const raw = localStorage.getItem(`${LIBRARY_KEY}:${userId}`);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isItem) : [];
  } catch {
    return [];
  }
}

export function writeLibrary(userId: string, items: readonly LibraryItem[]): void {
  try {
    localStorage.setItem(`${LIBRARY_KEY}:${userId}`, JSON.stringify(items));
  } catch {
    // Private mode or a full store: the set still plays what is in memory.
  }
}

/**
 * The member agreed that their files go to our server, under the terms. The
 * date is kept, not a flag, so a change of terms can ask again.
 */
export function readConsent(userId: string): string | null {
  try {
    return localStorage.getItem(`${CONSENT_KEY}:${userId}`);
  } catch {
    return null;
  }
}

export function writeConsent(userId: string): void {
  try {
    localStorage.setItem(`${CONSENT_KEY}:${userId}`, new Date().toISOString());
  } catch {
    // The dialog asks again next time. Better than an upload with no consent.
  }
}
