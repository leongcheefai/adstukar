import { useEffect, useState } from "react";
import type { WallpaperCollection } from "./catalog";

/** How long each photo of a collection holds. */
const PHOTO_DWELL_MS = 10_000;

/**
 * One collection, one photo at a time. A photo fills the set, cropped: it is
 * a backdrop, not the member's own file. "Photo by" and the author sit in the
 * lower right corner, above the ad bar, and a click anywhere on it opens the
 * collection's page in a new tab.
 */
export function WallpaperChannel({
  collection,
  paused,
}: {
  collection: WallpaperCollection;
  paused: boolean;
}) {
  const { photos } = collection;
  const [index, setIndex] = useState(0);

  // A new collection starts from its cover.
  // biome-ignore lint/correctness/useExhaustiveDependencies: collection is the trigger
  useEffect(() => {
    setIndex(0);
  }, [collection]);

  const many = photos.length > 1;

  useEffect(() => {
    if (!many || paused) return;
    const id = window.setInterval(() => setIndex((i) => i + 1), PHOTO_DWELL_MS);
    return () => window.clearInterval(id);
  }, [many, paused]);

  // The next photo loads during this one's dwell, so its fade starts on a picture.
  useEffect(() => {
    if (!many) return;
    const next = photos[(index + 1) % photos.length];
    if (next) new Image().src = next.src;
  }, [many, photos, index]);

  const photo = photos.length > 0 ? photos[index % photos.length] : undefined;

  return (
    <div className="chan chan-wall">
      {photo ? (
        <a
          key={index}
          className="chan-wall-link"
          href={collection.url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Photo by ${collection.author}. Opens their page in a new tab`}
        >
          <img className="chan-media" src={photo.src} alt="" />
          <span className="chan-wall-credit" aria-hidden="true">
            Photo by {collection.author}
          </span>
        </a>
      ) : null}
    </div>
  );
}
