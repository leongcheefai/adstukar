import { resolve } from "node:path";
import mdx from "@astrojs/mdx";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import { project } from "@repo/config/project";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";

export default defineConfig({
  site: project.siteUrl,
  integrations: [react(), mdx(), sitemap({ filter: (page) => !page.includes("/og/") })],
  vite: {
    // Env lives in the repo-root .env. Only PUBLIC_-prefixed vars reach the browser bundle.
    envDir: resolve(import.meta.dirname, "../.."),
    plugins: [tailwindcss()],
  },
});
