import { acceptsImage, acceptsVideo } from "@repo/config/media";
import { useEffect, useRef, useState } from "react";

const IMAGE_DWELL_MS = 8000;

type Media = { url: string; kind: "image" | "video" };

/**
 * The same rule the presign routes apply, so a member learns the caps on their
 * own set before a file ever goes to the server.
 */
export function isPlayable(file: File): boolean {
  return acceptsImage(file) || acceptsVideo(file);
}

export function UploadChannel({ files, paused }: { files: File[]; paused: boolean }) {
  const [media, setMedia] = useState<Media[]>([]);
  const [index, setIndex] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const next = files.map<Media>((file) => ({
      url: URL.createObjectURL(file),
      kind: file.type.startsWith("video/") ? "video" : "image",
    }));
    setMedia(next);
    setIndex(0);
    return () => {
      for (const item of next) URL.revokeObjectURL(item.url);
    };
  }, [files]);

  const many = media.length > 1;
  const current = media.length > 0 ? media[index % media.length] : undefined;

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
