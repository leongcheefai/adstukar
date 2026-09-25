import { useEffect, useState } from "react";
import { lastInputWasKeyboard } from "../../lib/input-mode";
import {
  WALLPAPER_COLLECTIONS,
  type WallpaperCollection,
  type WallpaperPhoto,
} from "./channels/catalog";

/** How long each photo holds while a tile previews its collection. */
const PREVIEW_MS = 1000;

/**
 * The wallpaper collections, on the set, in the library's frame: a round back
 * button, one row of tiles, and the Play pill under it, in the middle of the
 * screen. One collection plays at a time, so a click selects that tile alone,
 * and a second click clears it. Play waits for a selection. A tile under the
 * pointer, or under a keyboard focus, loops through its photos; the name of
 * the collection sits under it. The set is ours, so there is no Upload and no
 * delete.
 */
export function Wallpapers({
  onBack,
  onPlay,
}: {
  onBack: () => void;
  onPlay: (collection: WallpaperCollection) => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const [previewing, setPreviewing] = useState<string | null>(null);
  const chosen = WALLPAPER_COLLECTIONS.find((collection) => collection.id === selected);

  function stopPreview(id: string) {
    setPreviewing((current) => (current === id ? null : current));
  }

  return (
    <div className="boot-lib boot-lib-walls">
      <div className="boot-lib-head">
        <button type="button" className="boot-lib-back" aria-label="Back" onClick={onBack}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M14.6 6.2 8.8 12l5.8 5.8" />
          </svg>
        </button>
      </div>

      <div className="boot-lib-strip">
        <div className="boot-lib-row">
          {WALLPAPER_COLLECTIONS.map((collection, i) => {
            const on = collection.id === selected;
            return (
              <div key={collection.id} className="boot-lib-item">
                <div className="boot-lib-tile" data-selected={on || undefined}>
                  <button
                    type="button"
                    className="boot-lib-pick"
                    data-first={i === 0 || undefined}
                    aria-pressed={on}
                    aria-label={`${collection.name}, ${collection.photos.length} photos`}
                    onClick={() =>
                      setSelected((id) => (id === collection.id ? null : collection.id))
                    }
                    onPointerEnter={() => setPreviewing(collection.id)}
                    onPointerLeave={() => stopPreview(collection.id)}
                    // A mouse click focuses the button too, and the loop must
                    // stop when the pointer leaves, so only a key starts it here.
                    onFocus={() => {
                      if (lastInputWasKeyboard()) setPreviewing(collection.id);
                    }}
                    onBlur={() => stopPreview(collection.id)}
                  >
                    <Reel photos={collection.photos} live={previewing === collection.id} />
                    <span className="boot-lib-check" aria-hidden="true">
                      <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path d="m6 12.5 3.8 3.8L18 8" />
                      </svg>
                    </span>
                  </button>
                </div>
                <span className="boot-lib-caption" aria-hidden="true">
                  {collection.name}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="boot-lib-actions">
        <button
          type="button"
          className="boot-lib-play"
          disabled={!chosen}
          onClick={() => {
            if (chosen) onPlay(chosen);
          }}
        >
          Play
        </button>
      </div>
    </div>
  );
}

/**
 * A collection's thumbnails, stacked, the cover on top. While `live` they take
 * turns, starting at once so the hover answers; after, the cover comes back.
 */
function Reel({ photos, live }: { photos: readonly WallpaperPhoto[]; live: boolean }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!live || photos.length < 2) {
      setIndex(0);
      return;
    }
    setIndex(1);
    const id = window.setInterval(() => setIndex((i) => (i + 1) % photos.length), PREVIEW_MS);
    return () => window.clearInterval(id);
  }, [live, photos.length]);

  return (
    <span className="boot-lib-thumb boot-lib-reel">
      {photos.map((photo, i) => (
        <img key={photo.thumb} src={photo.thumb} alt="" data-on={i === index || undefined} />
      ))}
    </span>
  );
}
