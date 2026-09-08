/** The most headlines a ticker can carry before it repeats itself too slowly. */
const MAX_HEADLINES = 20;

export interface Headline {
  title: string;
  link: string | null;
}

/**
 * Reads the headlines out of an RSS or an Atom body. The distributor points this
 * at a local paper or a community feed: it is the thin content that gives a venue
 * a reason to leave the screen on.
 *
 * A body that is not a feed answers with nothing, because a screen must never
 * show a parser error.
 */
export function parseFeed(body: string): Headline[] {
  const doc = new DOMParser().parseFromString(body, "application/xml");
  if (doc.querySelector("parsererror")) return [];

  const nodes = [...doc.querySelectorAll("item"), ...doc.querySelectorAll("entry")];
  const headlines: Headline[] = [];
  for (const node of nodes) {
    const title = node.querySelector("title")?.textContent?.trim();
    if (!title) continue;
    const linkEl = node.querySelector("link");
    const link = linkEl?.getAttribute("href") ?? linkEl?.textContent?.trim() ?? null;
    headlines.push({ title, link: link || null });
    if (headlines.length === MAX_HEADLINES) break;
  }
  return headlines;
}
