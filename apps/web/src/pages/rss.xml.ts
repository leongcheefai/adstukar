import { getCollection } from "astro:content";
import rss from "@astrojs/rss";
import { project } from "@repo/config/project";
import type { APIContext } from "astro";

export async function GET(context: APIContext) {
  const posts = (await getCollection("blog"))
    .filter((post) => !post.data.draft)
    .sort((a, b) => b.data.date.getTime() - a.data.date.getTime());

  return rss({
    title: `${project.name} Blog`,
    description: `Insights, updates, and tutorials from the ${project.name} team.`,
    site: context.site ?? project.siteUrl,
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.date,
      link: `/blog/${post.id}/`,
    })),
  });
}
