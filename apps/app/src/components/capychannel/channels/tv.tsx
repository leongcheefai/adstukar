import { useEffect, useState } from "react";
import { type GuideChannel, TV_GUIDE } from "./tv-guide";
import { type OnAir, type UpNext, embedUrl, thumbnailUrl, upNext, whatIsOn } from "./tv-schedule";

const LAST_CHANNEL_KEY = "capychannel:tv:channel";

/**
 * The next video goes in this long after the clock says it starts, so the
 * clock read at that moment is past the change.
 */
const NEXT_MARGIN_MS = 250;

const { channels } = TV_GUIDE;

/**
 * Clock times as a TV guide prints them. The locale fixes the 12-hour form.
 * No time zone is named, so the browser uses the one the computer is set to.
 */
const airTime = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" });

/** What plays now, what plays next, and which player this is. */
type Tuned = { on: OnAir; next: UpNext | null; take: number };

function lastChannel(): GuideChannel | undefined {
  let id: string | null = null;
  try {
    id = localStorage.getItem(LAST_CHANNEL_KEY);
  } catch {
    // Blocked storage: the set opens on the first channel.
  }
  return channels.find((channel) => channel.id === id) ?? channels[0];
}

function saveLastChannel(id: string): void {
  try {
    localStorage.setItem(LAST_CHANNEL_KEY, id);
  } catch {
    // Same as the read: the next visit opens on the first channel.
  }
}

/** One step up or down the dial, round from the last channel to the first. */
function step(from: GuideChannel, by: 1 | -1): GuideChannel | undefined {
  const i = channels.indexOf(from);
  return channels[(i + by + channels.length) % channels.length];
}

function channelNumber(channel: GuideChannel): string {
  return `CH ${String(channel.number).padStart(2, "0")}`;
}

/**
 * The Capy Channel: hand-picked YouTube videos played like live TV. Every
 * viewer on a channel sees the same video at the same second, from the
 * clock (`tv-schedule.ts`), so a channel opens mid-video. The video fills
 * the set, with scanlines over it and the ad bar on its bottom edge. It takes
 * no pointer and no focus: the page must see the mouse move, and the keys
 * belong to the channel buttons.
 *
 * The overlays are one group. When the mouse moves over the picture, the
 * top bar, the video's details and the channel buttons in the lower left,
 * and the next video in the lower right all show at once, and after the
 * idle time they all go at once. Keys 1 to 9 tune, and the up and down
 * arrows step the dial.
 *
 * A paused set holds no player: the dashboard over it, or a hidden tab, stops
 * the sound. Coming back tunes again from the clock.
 */
export function TvChannel({ paused }: { paused: boolean }) {
  const [channel, setChannel] = useState(lastChannel);
  const [tuned, setTuned] = useState<Tuned | null>(null);
  // Counts channel changes, so the static burst and the channel number play
  // again on each one.
  const [zaps, setZaps] = useState(0);

  useEffect(() => {
    if (!channel || paused) return;
    let timer = 0;
    function tune() {
      if (!channel) return;
      const on = whatIsOn(channel, Date.now());
      // A new take is a new player. Changing the `src` of the old one would
      // add an entry to the browser's history for every video.
      setTuned((last) => ({ on, next: upNext(channel, on), take: (last?.take ?? 0) + 1 }));
      if (on.kind === "loop") timer = window.setTimeout(tune, on.remainingMs + NEXT_MARGIN_MS);
    }
    tune();
    return () => window.clearTimeout(timer);
  }, [channel, paused]);

  // No dependency list: the listener goes in again after each render, so it
  // always reads this render's channel.
  useEffect(() => {
    if (paused) return;
    function onKey(event: KeyboardEvent) {
      if (!channel || event.defaultPrevented) return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target;
      if (
        target instanceof HTMLElement &&
        (/^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName) || target.isContentEditable)
      ) {
        return;
      }
      let next: GuideChannel | undefined;
      if (/^[1-9]$/.test(event.key)) {
        next = channels.find((c) => c.number === Number(event.key));
      } else if (event.key === "ArrowUp" || event.key === "ArrowDown") {
        next = step(channel, event.key === "ArrowUp" ? 1 : -1);
      }
      if (!next) return;
      event.preventDefault();
      tuneTo(next);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  });

  function tuneTo(next: GuideChannel) {
    if (next.id === channel?.id) return;
    setChannel(next);
    setZaps((n) => n + 1);
    saveLastChannel(next.id);
  }

  const on = tuned?.on;
  const next = tuned?.next;

  return (
    <div className="chan chan-tv">
      <div className="tvc-player">
        {/* Snow behind the player shows until the embed paints over it. */}
        <div className="tvc-snow" aria-hidden="true" />
        {tuned && !paused ? (
          <iframe
            key={tuned.take}
            className="tvc-frame"
            tabIndex={-1}
            src={embedUrl(tuned.on.video.id, tuned.on.kind === "loop" ? tuned.on.start : null)}
            title={`${tuned.on.video.title}, ${tuned.on.video.creator}`}
            allow="autoplay; encrypted-media; picture-in-picture"
            referrerPolicy="strict-origin-when-cross-origin"
          />
        ) : null}
        {channel ? (
          <>
            <div key={`burst-${zaps}`} className="tvc-burst" aria-hidden="true" />
            <div key={`osd-${zaps}`} className="tvc-osd" aria-hidden="true">
              {channelNumber(channel)}
            </div>
          </>
        ) : (
          <p className="tvc-no-signal">No signal</p>
        )}
      </div>

      <div className="tvc-scan" aria-hidden="true" />

      {/* One row, so Up next starts level with the title however many lines
          the title takes. On a window held upright it turns into a column
          under the picture. */}
      <div className="tvc-dock">
        {channel ? (
          <div className="tvc-controls">
            {on ? (
              <dl className="tvc-info">
                <dt className="sr-only">Video</dt>
                <dd className="tvc-title">{on.video.title}</dd>
                <dt className="sr-only">Channel</dt>
                <dd className="tvc-creator">{on.video.creator}</dd>
                <dt className="sr-only">On air</dt>
                <dd className="tvc-time">
                  <AirTime on={on} />
                </dd>
              </dl>
            ) : null}
            <fieldset className="tvc-buttons">
              <legend className="sr-only">Channels</legend>
              {channels.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  aria-pressed={c.id === channel.id}
                  aria-keyshortcuts={String(c.number)}
                  onClick={() => tuneTo(c)}
                >
                  {c.name}
                </button>
              ))}
            </fieldset>
          </div>
        ) : null}

        {next ? (
          <div className="tvc-next">
            <p className="tvc-next-label">Up next · {airTime.format(next.startsAt)}</p>
            <div className="tvc-next-card">
              <img className="tvc-next-thumb" src={thumbnailUrl(next.video.id)} alt="" />
              <div className="tvc-next-text">
                <p className="tvc-next-title">{next.video.title}</p>
                <p className="tvc-next-creator">{next.video.creator}</p>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

/** When this video started and when it ends. It changes only when the video does. */
function AirTime({ on }: { on: OnAir }) {
  if (on.kind === "live") return <span className="tvc-live">LIVE</span>;
  const ends = on.startedAt + on.length * 1000;
  return (
    <>
      {airTime.format(on.startedAt)} – {airTime.format(ends)}
    </>
  );
}
