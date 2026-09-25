/**
 * Rendered help HTML as markdown, for `/llms-full.txt`. It covers the markup
 * the help topics produce: headings, paragraphs, lists, bold, italics, code,
 * and links. Pure: no DOM, so it runs at build time in Node.
 */

const ENTITIES: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
  "&#x27;": "'",
  "&nbsp;": " ",
};

function decode(text: string): string {
  return text
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code: string) =>
      String.fromCodePoint(Number.parseInt(code, 16)),
    )
    .replace(/&[a-z]+;|&#x27;/gi, (entity) => ENTITIES[entity] ?? entity);
}

/** Inline markup to markdown. A relative link becomes absolute against `origin`. */
function inline(html: string, origin: string): string {
  return decode(
    html
      .replace(/<a [^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/g, (_, href: string, text: string) => {
        const url = new URL(decode(href), origin).href;
        return `[${text}](${url})`;
      })
      .replace(/<(strong|b)>([\s\S]*?)<\/\1>/g, "**$2**")
      .replace(/<(em|i)>([\s\S]*?)<\/\1>/g, "*$2*")
      .replace(/<code>([\s\S]*?)<\/code>/g, "`$1`")
      .replace(/<br\s*\/?>/g, "\n")
      .replace(/<[^>]+>/g, "")
      .replace(/[ \t]+/g, " ")
      .trim(),
  );
}

function list(body: string, ordered: boolean, origin: string): string {
  const items = [...body.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/g)].map((m) =>
    inline(m[1] ?? "", origin),
  );
  return items.map((item, i) => `${ordered ? `${i + 1}.` : "-"} ${item}`).join("\n");
}

export function htmlToMarkdown(html: string, origin: string, headingOffset = 0): string {
  const blocks: string[] = [];
  const block =
    /<h([1-6])[^>]*>([\s\S]*?)<\/h\1>|<p[^>]*>([\s\S]*?)<\/p>|<(ol|ul)[^>]*>([\s\S]*?)<\/\4>/g;
  for (const m of html.matchAll(block)) {
    if (m[1]) {
      const depth = Math.min(6, Number(m[1]) + headingOffset);
      blocks.push(`${"#".repeat(depth)} ${inline(m[2] ?? "", origin)}`);
    } else if (m[3] !== undefined) {
      const text = inline(m[3], origin);
      if (text) blocks.push(text);
    } else if (m[4]) {
      blocks.push(list(m[5] ?? "", m[4] === "ol", origin));
    }
  }
  return blocks.join("\n\n");
}
