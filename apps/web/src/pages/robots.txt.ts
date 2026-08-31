import { project } from "@repo/config/project";
import type { APIRoute } from "astro";

export const GET: APIRoute = () => {
  const sitemap = new URL("/sitemap-index.xml", project.siteUrl);
  return new Response(`User-agent: *\nAllow: /\n\nSitemap: ${sitemap}\n`, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};
