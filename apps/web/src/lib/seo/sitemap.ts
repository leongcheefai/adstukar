import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { MARKETING_PAGES } from "../pages";

/**
 * The rules for `@astrojs/sitemap`, read from the files on disk. The sitemap
 * runs in `astro.config.ts`, before `astro:content` exists, so this module
 * reads the content folders itself. Node only: never import it from a page
 * that ships to the browser.
 */

/** The path of a sitemap URL: no origin, no trailing slash, "/" for the home. */
export function pathOf(url: string): string {
  const path = new URL(url).pathname.replace(/\/+$/, "");
  return path === "" ? "/" : path;
}

/** A content entry's frontmatter says `draft: true`. */
export function isDraft(source: string): boolean {
  const frontmatter = /^---\r?\n([\s\S]*?)\r?\n---/.exec(source)?.[1] ?? "";
  return /^draft:\s*true\s*$/m.test(frontmatter);
}

interface Entry {
  id: string;
  file: string;
}

function entries(dir: string): Entry[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((name) => /\.mdx?$/.test(name))
    .map((name) => ({ id: name.replace(/\.mdx?$/, ""), file: join(dir, name) }))
    .filter((entry) => !isDraft(readFileSync(entry.file, "utf8")));
}

/** Every commit date that touches any of `files`, newest first; empty when git cannot tell. */
function commitDates(cwd: string, files: string[]): string[] {
  const present = files.filter((file) => existsSync(file));
  if (present.length === 0) return [];
  try {
    return execFileSync("git", ["log", "--format=%cI", "--", ...present], {
      cwd,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    })
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line !== "");
  } catch {
    // A build without the .git folder (a container, a tarball) has no dates.
    return [];
  }
}

export function sitemapRules(webRoot: string) {
  const src = join(webRoot, "src");
  const blog = entries(join(src, "content/blog"));
  const help = entries(join(src, "content/help"));
  const economy = join(webRoot, "../../packages/config/src/economy.ts");

  /* Pages that exist but say nothing yet. They carry `noindex`, so the
     sitemap must not offer them either. */
  const hidden = new Set(MARKETING_PAGES.filter((p) => p.inSitemap === false).map((p) => p.path));
  if (blog.length === 0) hidden.add("/blog");

  /** The files whose last change is the page's last change. */
  function sources(path: string): string[] {
    if (path === "/") {
      return [
        join(src, "components/landing"),
        join(src, "lib/faq.ts"),
        join(src, "lib/landing.config.json"),
        economy,
      ];
    }
    if (path === "/blog") return blog.map((e) => e.file);
    if (path === "/help") return help.map((e) => e.file);
    const [, section, id] = path.split("/");
    if (section === "blog") return blog.filter((e) => e.id === id).map((e) => e.file);
    if (section === "help") return help.filter((e) => e.id === id).map((e) => e.file);
    return [join(src, `content/legal${path}.md`), join(src, `pages${path}.astro`)];
  }

  return {
    filter(page: string): boolean {
      const path = pathOf(page);
      if (path.startsWith("/og/") || path.startsWith("/lab/") || path === "/404") return false;
      return !hidden.has(path);
    },
    lastmod(page: string): string | undefined {
      return commitDates(webRoot, sources(pathOf(page)))[0];
    },
    /** The first and the last commit on the page's sources: `datePublished` and `dateModified`. */
    dates(page: string): { published?: string; modified?: string } {
      const dates = commitDates(webRoot, sources(pathOf(page)));
      return { published: dates.at(-1), modified: dates[0] };
    },
  };
}

let rules: ReturnType<typeof sitemapRules> | undefined;

/**
 * The dates of one built page, for its structured data and its article meta.
 * A build runs from `apps/web`, as `src/lib/seo/icon.ts` assumes too.
 */
export function pageDates(url: string): { published?: string; modified?: string } {
  rules ??= sitemapRules(process.cwd());
  return rules.dates(url);
}
