import { ArrowsOut, Pause, Play, X } from "@phosphor-icons/react";
import { Button } from "@repo/ui";
import { useEffect, useRef, useState } from "react";

/** The one mock spot CapyTV plays. No network call, so nothing is ever billed. */
const MOCK_SPOT = {
  advertiser: "LaunchKit",
  headline: "Ship your side project this weekend",
  duration: "0:15",
} as const;

/**
 * The video frame itself. Drawn, not played: there is no file behind it, so this
 * is a mock of the surface rather than a player. It renders identically closed
 * and full screen; only the scale changes.
 */
function Frame({ playing }: { playing: boolean }) {
  return (
    <div className="relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-lg bg-neutral-950">
      {/* A still frame stands in for the spot: a wash, the advertiser, the line. */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,var(--color-primary)_0%,transparent_55%)] opacity-40" />

      <div className="relative flex flex-col items-center gap-3 px-8 text-center">
        <span className="font-mono text-[11px] tracking-widest text-white/50 uppercase">
          {MOCK_SPOT.advertiser}
        </span>
        <p className="max-w-md text-2xl font-medium text-balance text-white">
          {MOCK_SPOT.headline}
        </p>
      </div>

      {/* Player furniture, so the frame reads as video and not as a poster. */}
      <div className="absolute inset-x-0 bottom-0 flex items-center gap-3 bg-gradient-to-t from-black/70 to-transparent px-4 pt-8 pb-3">
        {playing ? (
          <Pause size={14} weight="fill" className="shrink-0 text-white" />
        ) : (
          <Play size={14} weight="fill" className="shrink-0 text-white" />
        )}
        <div className="h-0.5 flex-1 rounded-full bg-white/25">
          <div className="h-full w-1/3 rounded-full bg-white" />
        </div>
        <span className="shrink-0 font-mono text-[11px] text-white/70">{MOCK_SPOT.duration}</span>
      </div>
    </div>
  );
}

/**
 * CapyTV: the placement as a screen, not a snippet.
 *
 * Opening goes to the real Fullscreen API rather than a fixed overlay, because
 * the whole point is a display with nothing else on it — a browser chrome bar
 * defeats the idea.
 */
export function CapyTvScreen() {
  const frameRef = useRef<HTMLDivElement>(null);
  const [isFull, setIsFull] = useState(false);

  // The browser owns this state: Escape and F11 both exit without telling us,
  // so the event is the only truth. A ref we set ourselves would drift.
  useEffect(() => {
    function onChange() {
      setIsFull(document.fullscreenElement === frameRef.current);
    }
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  async function open() {
    const el = frameRef.current;
    if (!el) return;
    try {
      await el.requestFullscreen();
    } catch {
      // Refused by policy or by an iframe without the permission. The frame
      // stays where it is rather than half-opening.
      setIsFull(false);
    }
  }

  return (
    <div
      ref={frameRef}
      data-full={isFull || undefined}
      className="group/tv relative data-[full]:flex data-[full]:h-full data-[full]:w-full data-[full]:items-center data-[full]:justify-center data-[full]:bg-black"
    >
      {isFull ? (
        <>
          {/* Full screen the frame stops being a button, so a tap is a tap on
              the spot rather than a way out. Escape is the way out. */}
          <div className="w-full max-w-[100vw]">
            <Frame playing />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => document.exitFullscreen()}
            className="absolute top-6 right-6"
          >
            <X size={14} className="mr-2" />
            Close
          </Button>
        </>
      ) : (
        <button
          type="button"
          onClick={open}
          className="block w-full cursor-pointer rounded-lg text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          aria-label="Play CapyTV full screen"
        >
          <Frame playing={false} />
          <span className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground transition-colors group-hover/tv:text-foreground">
            <ArrowsOut size={14} />
            Tap to play full screen
          </span>
        </button>
      )}
    </div>
  );
}
