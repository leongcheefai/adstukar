import type { GuideChannel, GuideVideo } from "./tv-guide";

/**
 * The pure rules of the Capy Channel: what plays now, and the embed that
 * plays it. Every viewer reads the same clock, so every viewer on a channel
 * sees the same video at the same second. Nothing here counts on its own:
 * each answer comes from the clock again, because a counter drifts and the
 * clock does not.
 */

/** "12:34" is 754, "1:02:10" is 3730. */
export function toSeconds(text: string): number {
  return text.split(":").reduce((total, part) => total * 60 + Number(part), 0);
}

/**
 * A loop names the video, the second to start it at, and the moment its
 * 0:00 was on the clock, so the time on screen and the next change both come
 * from one answer. A live stream has no schedule: the embed shows its live
 * moment.
 */
export type OnAir =
  | {
      kind: "loop";
      video: GuideVideo;
      /** Where the video sits in the channel's list. */
      index: number;
      /** Whole seconds into the video, for the embed's `start`. */
      start: number;
      /** The video's length in seconds. */
      length: number;
      /** When this video's 0:00 was, in epoch ms. */
      startedAt: number;
      /** How long until the next video, in ms. */
      remainingMs: number;
    }
  | { kind: "live"; video: GuideVideo };

export function whatIsOn(channel: GuideChannel, nowMs: number): OnAir {
  if (channel.type === "live") return { kind: "live", video: channel.videos[0] };

  const total = channel.videos.reduce((sum, video) => sum + toSeconds(video.duration), 0);
  // Seconds into the loop. The loop starts at the epoch, so every viewer
  // lands on the same second.
  let t = (nowMs / 1000) % total;
  for (const [index, video] of channel.videos.entries()) {
    const length = toSeconds(video.duration);
    if (t < length) {
      return {
        kind: "loop",
        video,
        index,
        start: Math.floor(t),
        length,
        startedAt: nowMs - t * 1000,
        remainingMs: Math.ceil((length - t) * 1000),
      };
    }
    t -= length;
  }
  // Rounding can leave `t` a hair past the last video. That is the top of
  // the loop.
  const [first] = channel.videos;
  const length = toSeconds(first.duration);
  return {
    kind: "loop",
    video: first,
    index: 0,
    start: 0,
    length,
    startedAt: nowMs,
    remainingMs: length * 1000,
  };
}

export type UpNext = { video: GuideVideo; startsAt: number };

/**
 * The video after this one, and when it starts, in epoch ms. The loop goes
 * round, so after the last video comes the first. A live stream has none.
 */
export function upNext(channel: GuideChannel, on: OnAir): UpNext | null {
  if (channel.type === "live" || on.kind === "live") return null;
  return {
    video: channel.videos[(on.index + 1) % channel.videos.length],
    startsAt: on.startedAt + on.length * 1000,
  };
}

/** YouTube's own 16:9 still for a video, 320 by 180. It needs no key. */
export function thumbnailUrl(videoId: string): string {
  return `https://i.ytimg.com/vi/${encodeURIComponent(videoId)}/mqdefault.jpg`;
}

/**
 * A plain YouTube embed. No controls and no keyboard: this is a set, and a
 * digit pressed inside the player would seek instead of changing the channel.
 * `playsinline` keeps an iPhone from going full screen.
 */
export function embedUrl(videoId: string, start: number | null): string {
  const params = new URLSearchParams({
    autoplay: "1",
    mute: "0",
    controls: "0",
    disablekb: "1",
    rel: "0",
    iv_load_policy: "3",
    playsinline: "1",
  });
  if (start !== null) params.set("start", String(start));
  return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}?${params}`;
}
