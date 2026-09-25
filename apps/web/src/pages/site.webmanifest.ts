import { project } from "@repo/config/project";
import type { APIRoute } from "astro";
import { THEME_COLOR } from "../lib/seo/brand";

/** The web app manifest: the name and icons a browser shows when the site is saved to a home screen. */
export const GET: APIRoute = () =>
  new Response(
    JSON.stringify({
      name: project.name,
      short_name: project.name,
      description: project.tagline,
      start_url: "/",
      display: "standalone",
      background_color: "#ffffff",
      theme_color: THEME_COLOR,
      icons: [
        { src: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
        { src: "/logo.png", sizes: "512x512", type: "image/png" },
        { src: "/favicon.svg", sizes: "any", type: "image/svg+xml" },
      ],
    }),
    { headers: { "Content-Type": "application/manifest+json" } },
  );
