import { z } from "zod";
import raw from "./tv-guide.json";
import { toSeconds } from "./tv-schedule";

/**
 * The Capy Channel's guide: `tv-guide.json`, filled in by hand. A `loop`
 * channel plays its videos in order, on the clock, and needs each video's
 * length, because an embed cannot say how long a video is. A `live` channel
 * plays its first video, a 24/7 stream, and has no schedule; any video after
 * the first is a spare to swap in by hand when the stream ends.
 */

const VideoId = z.string().regex(/^[\w-]{11}$/, "an 11-character YouTube video id");

/** m:ss or h:mm:ss, and longer than nothing: a loop of no length never ends. */
const Duration = z
  .string()
  .regex(/^(?:\d+:)?\d{1,2}:[0-5]\d$/, "m:ss or h:mm:ss")
  .refine((text) => toSeconds(text) > 0, "longer than 0:00");

const Video = z.object({
  id: VideoId,
  title: z.string().min(1),
  creator: z.string().min(1),
});

const ChannelFields = {
  id: z.string().regex(/^[a-z0-9-]+$/, "lowercase letters, digits and dashes"),
  /** The key that tunes to it, so 1 to 9. */
  number: z.number().int().min(1).max(9),
  name: z.string().min(1),
};

const Channel = z.discriminatedUnion("type", [
  z.object({
    ...ChannelFields,
    type: z.literal("loop"),
    videos: z.array(Video.extend({ duration: Duration })).nonempty(),
  }),
  z.object({ ...ChannelFields, type: z.literal("live"), videos: z.array(Video).nonempty() }),
]);

const Guide = z.object({
  channels: z
    .array(Channel)
    .nonempty()
    .superRefine((channels, ctx) => {
      for (const key of ["id", "number"] as const) {
        const seen = new Set<string | number>();
        for (const channel of channels) {
          if (seen.has(channel[key])) {
            ctx.addIssue({
              code: "custom",
              message: `two channels share the ${key} ${channel[key]}`,
            });
          }
          seen.add(channel[key]);
        }
      }
    }),
});

export type GuideVideo = z.infer<typeof Video>;
export type GuideChannel = z.infer<typeof Channel>;

export type TvGuide = {
  /** In the order of their numbers. */
  channels: readonly GuideChannel[];
  /** What is wrong with the file. The set shows no signal while this has any. */
  issues: readonly string[];
};

/**
 * A mistake in the file must not take the whole set down with it, so it
 * leaves the channel with no signal and says why on the console.
 */
function readGuide(): TvGuide {
  const parsed = Guide.safeParse(raw);
  if (!parsed.success) {
    const issues = parsed.error.issues.map(
      (issue) => `${issue.path.join(".") || "tv-guide.json"}: ${issue.message}`,
    );
    console.error("tv-guide.json is not valid, so the Capy Channel has no signal.", issues);
    return { channels: [], issues };
  }
  const channels = [...parsed.data.channels].sort((a, b) => a.number - b.number);
  return { channels, issues: [] };
}

export const TV_GUIDE = readGuide();
