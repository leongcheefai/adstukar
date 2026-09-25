import { TV_GUIDE } from "../../components/capychannel/channels/tv-guide";

/**
 * Every video in the Capy Channel's guide as a small player, so a dead one
 * is plain to see. A video that says "Video unavailable" or "Playback on
 * other websites has been disabled" leaves `tv-guide.json`. Dev only.
 */
export default function DevTvEmbedsPage() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-6xl space-y-10">
        <div>
          <h1 className="text-3xl font-bold">Capy Channel embeds</h1>
          <p className="mt-1 text-muted-foreground">
            Dev-only. Every video in tv-guide.json. Take out any that does not play.
          </p>
        </div>

        {TV_GUIDE.issues.length > 0 ? (
          <ul className="list-disc space-y-1 pl-5 text-sm text-destructive">
            {TV_GUIDE.issues.map((issue) => (
              <li key={issue}>{issue}</li>
            ))}
          </ul>
        ) : null}

        {TV_GUIDE.channels.map((channel) => (
          <section key={channel.id} className="space-y-4">
            <h2 className="text-xl font-semibold">
              {channel.number}. {channel.name}{" "}
              <span className="font-normal text-muted-foreground">({channel.type})</span>
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {channel.videos.map((video, i) => (
                <figure key={video.id} className="space-y-2">
                  <iframe
                    className="aspect-video w-full rounded-md border-0 bg-black"
                    src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(video.id)}`}
                    title={video.title}
                    loading="lazy"
                    allow="encrypted-media; picture-in-picture"
                    referrerPolicy="strict-origin-when-cross-origin"
                  />
                  <figcaption className="text-sm">
                    <span className="font-medium">{video.title}</span>
                    <span className="block text-muted-foreground">
                      {video.creator} ·{" "}
                      {"duration" in video ? video.duration : i === 0 ? "live" : "spare"} ·{" "}
                      {video.id}
                    </span>
                  </figcaption>
                </figure>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
