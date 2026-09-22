import { useEffect, useRef, useState } from "react";
import type { LibraryItem } from "../../../lib/library";

const IMAGE_DWELL_MS = 8000;

/** The member's own pictures and clips, from their public URLs, one at a time. */
export function UploadChannel({ items, paused }: { items: LibraryItem[]; paused: boolean }) {
  const [index, setIndex] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  // A new set starts from its first item.
  // biome-ignore lint/correctness/useExhaustiveDependencies: items is the trigger
  useEffect(() => {
    setIndex(0);
  }, [items]);

  const many = items.length > 1;
  const current = items.length > 0 ? items[index % items.length] : undefined;

  // An image holds for its dwell. A video holds until it ends.
  useEffect(() => {
    if (!many || paused || current?.kind !== "image") return;
    const id = window.setTimeout(() => setIndex((i) => i + 1), IMAGE_DWELL_MS);
    return () => window.clearTimeout(id);
  }, [many, paused, current]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || current?.kind !== "video") return;
    if (paused) video.pause();
    // Autoplay can be refused; the muted attribute makes that rare.
    else video.play().catch(() => {});
  }, [paused, current]);

  function next() {
    if (many) setIndex((i) => i + 1);
  }

  if (!current) return <div className="chan chan-upload" />;

  return (
    <div className="chan chan-upload">
      {current.kind === "video" ? (
        <video
          key={index}
          ref={videoRef}
          className="chan-media"
          src={current.url}
          autoPlay
          muted
          playsInline
          loop={!many}
          onEnded={next}
          onError={next}
        />
      ) : (
        <img key={index} className="chan-media" src={current.url} alt="" onError={next} />
      )}
    </div>
  );
}
