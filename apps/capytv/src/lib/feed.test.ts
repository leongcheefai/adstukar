import { describe, expect, it } from "vitest";
import { parseFeed } from "./feed";

const RSS = `<?xml version="1.0"?>
<rss version="2.0"><channel>
  <title>Town News</title>
  <item><title>Market opens Saturday</title><link>https://town.test/1</link></item>
  <item><title>Road closed on High Street</title><link>https://town.test/2</link></item>
</channel></rss>`;

const ATOM = `<?xml version="1.0"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>Town News</title>
  <entry><title>Market opens Saturday</title><link href="https://town.test/1"/></entry>
</feed>`;

describe("parseFeed", () => {
  it("reads the headlines out of an RSS channel", () => {
    expect(parseFeed(RSS)).toEqual([
      { title: "Market opens Saturday", link: "https://town.test/1" },
      { title: "Road closed on High Street", link: "https://town.test/2" },
    ]);
  });

  it("reads the headlines out of an Atom feed", () => {
    expect(parseFeed(ATOM)).toEqual([
      { title: "Market opens Saturday", link: "https://town.test/1" },
    ]);
  });

  it("answers with nothing when the body is not a feed", () => {
    expect(parseFeed("<html><body>not a feed</body></html>")).toEqual([]);
  });

  it("keeps at most the number of headlines a ticker can show", () => {
    const many = `<rss><channel>${Array.from(
      { length: 40 },
      (_, i) => `<item><title>Story ${i}</title></item>`,
    ).join("")}</channel></rss>`;
    expect(parseFeed(many).length).toBeLessThanOrEqual(20);
  });
});
