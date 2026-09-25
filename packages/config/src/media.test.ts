import { describe, expect, it } from "vitest";
import { acceptsImage, acceptsVideo, media, mediaKindOf, megabytes } from "./media";

describe("media", () => {
  it("caps an image at 5 MB and a video at 50 MB", () => {
    expect(media.image.maxBytes).toBe(5 * 1024 * 1024);
    expect(media.video.maxBytes).toBe(50 * 1024 * 1024);
  });

  it("holds a 30 s clip at 1080p and 6 Mbps, the longest dwell a slot pays for", () => {
    const thirtySecondsAtSixMbps = (30 * 6_000_000) / 8;
    expect(thirtySecondsAtSixMbps).toBeLessThan(media.video.maxBytes);
  });

  it("names the kind a MIME type falls under, and nothing else", () => {
    expect(mediaKindOf("image/webp")).toBe("image");
    expect(mediaKindOf("video/mp4")).toBe("video");
    expect(mediaKindOf("image/gif")).toBeNull();
    expect(mediaKindOf("video/quicktime")).toBeNull();
  });

  it("prints the cap as whole megabytes", () => {
    expect(megabytes(media.image.maxBytes)).toBe("5 MB");
    expect(megabytes(media.video.maxBytes)).toBe("50 MB");
  });
});

describe("acceptsImage", () => {
  it("takes a png, jpeg or webp inside the cap", () => {
    expect(acceptsImage({ type: "image/png", size: 1 })).toBe(true);
    expect(acceptsImage({ type: "image/webp", size: media.image.maxBytes })).toBe(true);
  });

  it("refuses a file over the cap or of another type", () => {
    expect(acceptsImage({ type: "image/png", size: media.image.maxBytes + 1 })).toBe(false);
    expect(acceptsImage({ type: "image/gif", size: 1 })).toBe(false);
    expect(acceptsImage({ type: "video/mp4", size: 1 })).toBe(false);
  });
});

describe("acceptsVideo", () => {
  it("takes an mp4 inside the cap", () => {
    expect(acceptsVideo({ type: "video/mp4", size: media.video.maxBytes })).toBe(true);
  });

  it("refuses a file over the cap or of another container", () => {
    expect(acceptsVideo({ type: "video/mp4", size: media.video.maxBytes + 1 })).toBe(false);
    expect(acceptsVideo({ type: "video/webm", size: 1 })).toBe(false);
    expect(acceptsVideo({ type: "image/png", size: 1 })).toBe(false);
  });
});
