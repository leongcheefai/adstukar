/**
 * The help centre. One file in `src/content/help/` is one topic, and a topic
 * is one page: its `##` headings are the sections the side menu and the
 * search link to.
 */
export function helpHref(id: string, section?: string): string {
  return section ? `/help/${id}#${section}` : `/help/${id}`;
}

/** The hash a topic page adds when its ⌘K sends the reader to the home, so the home focuses the search field. */
export const HELP_SEARCH_HASH = "#search";

/**
 * A heading to the id Astro gives it. It covers plain headings: letters,
 * digits, and spaces. Keep help headings plain, so the search links land.
 */
export function helpSectionSlug(heading: string): string {
  return heading
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, "")
    .trim()
    .replace(/ /g, "-");
}
