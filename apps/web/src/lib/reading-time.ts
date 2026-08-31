const WORDS_PER_MINUTE = 225;

/** Strip HTML tags and markdown syntax, then estimate reading time. */
export function readingTime(text: string): { minutes: number; text: string } {
  // Remove HTML tags
  const stripped = text.replace(/<[^>]*>/g, " ");
  // Remove markdown syntax (headers, bold, italic, code, links)
  const plain = stripped
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]*`/g, " ")
    .replace(/!\[.*?\]\(.*?\)/g, " ")
    .replace(/\[.*?\]\(.*?\)/g, " ")
    .replace(/[#*_~>|]/g, " ");

  const words = plain.trim().split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.ceil(words / WORDS_PER_MINUTE));
  return { minutes, text: `${minutes} min read` };
}
