import { helpSectionSlug } from "./help";

/** One section of one topic, as the search on the help home sees it. */
export interface HelpSearchEntry {
  /** The topic's id. */
  topic: string;
  topicTitle: string;
  /** The `##` heading, or the topic's title for the text above the first one. */
  title: string;
  /** The heading's id on the page. None for the text above the first heading. */
  section?: string;
  /** The section as plain text. */
  text: string;
}

export interface HelpSearchResult {
  entry: HelpSearchEntry;
  /** A piece of the text around the first match. */
  snippet: string;
}

const SNIPPET_RADIUS = 70;

/**
 * Markdown or MDX source to plain text: no import or export lines, no
 * `{expressions}`, no heading marks, no emphasis, no list numbers. Good
 * enough to match on.
 */
export function helpPlainText(source: string): string {
  return source
    .replace(/^(?:import|export) .*$/gm, " ")
    .replace(/\{[^}]*\}/g, " ")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^\s*(?:[-*]|\d+\.)\s+/gm, "")
    .replace(/[*_`]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** One topic's source, cut at each `##` heading into search entries. */
export function helpSections(
  topic: { id: string; title: string },
  source: string,
): HelpSearchEntry[] {
  const [intro = "", ...rest] = source.split(/^## /m);
  const entries: HelpSearchEntry[] = [];
  const introText = helpPlainText(intro);
  if (introText) {
    entries.push({ topic: topic.id, topicTitle: topic.title, title: topic.title, text: introText });
  }
  for (const part of rest) {
    const lineEnd = part.indexOf("\n");
    const heading = (lineEnd < 0 ? part : part.slice(0, lineEnd)).trim();
    entries.push({
      topic: topic.id,
      topicTitle: topic.title,
      title: heading,
      section: helpSectionSlug(heading),
      text: helpPlainText(lineEnd < 0 ? "" : part.slice(lineEnd)),
    });
  }
  return entries;
}

function snippetOf(entry: HelpSearchEntry, word: string): string {
  const at = entry.text.toLowerCase().indexOf(word);
  const hit = Math.max(0, at);
  // Both cuts move to a space, so the snippet never starts or ends inside a word.
  const from = Math.max(0, hit - SNIPPET_RADIUS);
  const start = from > 0 ? entry.text.indexOf(" ", from) + 1 : 0;
  const to = hit + word.length + SNIPPET_RADIUS;
  const end = to < entry.text.length ? entry.text.lastIndexOf(" ", to) : entry.text.length;
  return `${start > 0 ? "…" : ""}${entry.text.slice(start, end).trim()}${end < entry.text.length ? "…" : ""}`;
}

/**
 * Every word of the query must be somewhere in the section. A match in the
 * heading counts most, then the topic's name, then the text.
 */
export function searchHelp(entries: HelpSearchEntry[], query: string): HelpSearchResult[] {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  const first = words[0];
  if (!first) return [];

  return entries
    .map((entry) => {
      const title = entry.title.toLowerCase();
      const topicTitle = entry.topicTitle.toLowerCase();
      const text = entry.text.toLowerCase();
      let score = 0;
      for (const word of words) {
        if (title.includes(word)) score += 3;
        else if (topicTitle.includes(word)) score += 2;
        else if (text.includes(word)) score += 1;
        else return null;
      }
      return { entry, score, snippet: snippetOf(entry, first) };
    })
    .filter((hit) => hit !== null)
    .sort((a, b) => b.score - a.score)
    .map(({ entry, snippet }) => ({ entry, snippet }));
}
