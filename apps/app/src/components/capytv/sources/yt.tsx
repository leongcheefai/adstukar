/**
 * Big Buck Bunny, Blender Foundation, CC-BY. The clip is a stand-in for
 * whatever the member is showing, so it has to be one that always plays.
 * Muted, or the browser refuses to start it without a gesture.
 */
const YT_ID = "aqz-KE-bpKQ";
const YT = `https://www.youtube.com/embed/${YT_ID}?autoplay=1&mute=1&loop=1&playlist=${YT_ID}&controls=1&modestbranding=1&rel=0&iv_load_policy=3&playsinline=1`;

export function YtSource({ active }: { active: boolean }) {
  return (
    <div className="src src-yt" data-on={active || undefined}>
      {active ? (
        <iframe
          title="Live clip"
          src={YT}
          allow="autoplay; encrypted-media; picture-in-picture"
          referrerPolicy="strict-origin-when-cross-origin"
        />
      ) : null}
    </div>
  );
}
