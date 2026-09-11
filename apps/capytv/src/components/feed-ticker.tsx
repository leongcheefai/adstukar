import { useEffect, useState } from "react";
import { type Headline, parseFeed } from "../lib/feed";
import { usePolled } from "../lib/poll";

/** How often a screen asks the feed again. */
const REFRESH_MS = 10 * 60_000;
/** How long one headline holds the line. */
const ROTATE_MS = 12_000;

/**
 * The local feed. A distributor points it at a local paper or a community feed,
 * and it is the third piece of thin content beside the clock and the weather.
 *
 * The feed has to answer with CORS, because the screen is a browser and there is
 * no server in front of it. A feed that refuses simply shows nothing, so a bad
 * URL never breaks the screen.
 */
export function FeedTicker({ url }: { url: string }) {
  const headlines = usePolled<Headline[]>(
    url,
    async (res) => parseFeed(await res.text()),
    REFRESH_MS,
  );

  const [index, setIndex] = useState(0);
  const count = headlines?.length ?? 0;

  useEffect(() => {
    if (count === 0) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % count), ROTATE_MS);
    return () => clearInterval(id);
  }, [count]);

  const headline = headlines?.[index % Math.max(count, 1)];
  if (!headline) return null;

  return (
    <p className="max-w-[70vw] truncate text-[2vw] text-white/70">
      <span className="mr-[1vw] text-white/35">Local</span>
      {headline.title}
    </p>
  );
}
