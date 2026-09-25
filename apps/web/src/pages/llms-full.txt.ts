import { loadRenderers } from "astro:container";
import { getCollection, render } from "astro:content";
import { getContainerRenderer as mdxRenderer } from "@astrojs/mdx";
import { project } from "@repo/config/project";
import type { APIRoute } from "astro";
import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { helpHref } from "../lib/help";
import { htmlToMarkdown } from "../lib/seo/llms";

/**
 * The whole help center in one plain-text file, for AI answer engines (the
 * `llms-full.txt` convention; `/llms.txt` is the short index). Each topic is
 * rendered from its MDX, so every figure is the one the page shows, read from
 * `@repo/config/economy`.
 */
export const GET: APIRoute = async () => {
  const site = project.siteUrl;
  const origin = new URL(site).origin;
  // An MDX topic renders through the MDX renderer, the same one its page uses.
  const container = await AstroContainer.create({
    renderers: await loadRenderers([mdxRenderer()]),
  });

  const topics = (await getCollection("help"))
    .filter((topic) => !topic.data.draft)
    .sort((a, b) => a.data.order - b.data.order);

  const sections = await Promise.all(
    topics.map(async (topic) => {
      const { Content } = await render(topic);
      const html = await container.renderToString(Content);
      return [
        `## ${topic.data.title}`,
        "",
        `Source: ${new URL(helpHref(topic.id), site).href}`,
        "",
        `> ${topic.data.description}`,
        "",
        // A topic's `##` sections sit one level under the topic's own heading.
        htmlToMarkdown(html, origin, 1),
        "",
      ].join("\n");
    }),
  );

  const lines = [
    `# ${project.name} Help Center`,
    "",
    `> ${project.description}`,
    "",
    `A short index of the site is at ${new URL("/llms.txt", site).href}.`,
    "",
    ...sections,
    "## Contact",
    "",
    `- Support: ${project.email.support}`,
    `- Site: ${site}`,
    "",
  ];

  return new Response(lines.join("\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};
