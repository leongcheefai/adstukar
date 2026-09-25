import { project } from "@repo/config/project";
import type { APIRoute } from "astro";

/**
 * Search engines and AI answer engines both read the whole site. The AI
 * crawlers get their own group so the choice is written down: to keep one out,
 * move its line to a group with `Disallow: /`. `/llms.txt` is the plain-text
 * summary those engines quote from.
 */
const AI_CRAWLERS = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-SearchBot",
  "Claude-User",
  "PerplexityBot",
  "Perplexity-User",
  "Google-Extended",
  "Applebot-Extended",
  "Amazonbot",
  "DuckAssistBot",
  "MistralAI-User",
  "meta-externalagent",
  "CCBot",
];

export const GET: APIRoute = () => {
  const sitemap = new URL("/sitemap-index.xml", project.siteUrl);
  const llms = new URL("/llms.txt", project.siteUrl);
  const llmsFull = new URL("/llms-full.txt", project.siteUrl);
  const body = [
    "User-agent: *",
    "Allow: /",
    "",
    `# AI answer engines. A summary for them: ${llms}`,
    `# The help center in full: ${llmsFull}`,
    ...AI_CRAWLERS.map((agent) => `User-agent: ${agent}`),
    "Allow: /",
    "",
    `Sitemap: ${sitemap}`,
    "",
  ].join("\n");
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
};
