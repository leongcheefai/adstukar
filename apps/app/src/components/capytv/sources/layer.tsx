import { AlbumSource } from "./album";
import type { SourceId } from "./catalog";
import { FirepitSource } from "./firepit";
import { PodSource } from "./pod";
import { RssSource } from "./rss";
import { WebSource } from "./web";
import { YtSource } from "./yt";

export function SourceLayer({ source }: { source: SourceId | null }) {
  return (
    <div className="capytv-source-layer">
      <YtSource active={source === "yt"} />
      <FirepitSource active={source === "firepit"} />
      <AlbumSource active={source === "album"} />
      <WebSource active={source === "web"} />
      <PodSource active={source === "pod"} />
      <RssSource active={source === "rss"} />
    </div>
  );
}
