import { writeFile } from "node:fs/promises";
import { relative, resolve } from "node:path";
import mdx from "@astrojs/mdx";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import { project } from "@repo/config/project";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";
import { parseLandingConfig } from "./src/lib/landing/config";

const REPO_ROOT = resolve(import.meta.dirname, "../..");
/** The file the landing page reads, and the one the lab's Save button writes. */
const LANDING_CONFIG = resolve(import.meta.dirname, "src/lib/landing.config.json");

export default defineConfig({
  site: project.siteUrl,
  integrations: [
    react(),
    mdx(),
    sitemap({ filter: (page) => !page.includes("/og/") && !page.includes("/lab/") }),
  ],
  vite: {
    // Env lives in the repo-root .env. Only PUBLIC_-prefixed vars reach the browser bundle.
    envDir: REPO_ROOT,
    plugins: [
      tailwindcss(),
      {
        // The landing lab's Save button posts here. `apply: "serve"` keeps it
        // out of every build, so a deployed site has no write path at all.
        name: "capyads-lab-save",
        apply: "serve",
        configureServer(server) {
          server.middlewares.use("/__lab/save", (req, res) => {
            if (req.method !== "POST") {
              res.statusCode = 405;
              res.end("POST only");
              return;
            }
            let body = "";
            req.setEncoding("utf8");
            req.on("data", (chunk: string) => {
              body += chunk;
            });
            req.on("end", () => {
              void (async () => {
                try {
                  const config = parseLandingConfig(JSON.parse(body));
                  await writeFile(LANDING_CONFIG, `${JSON.stringify(config, null, 2)}\n`, "utf8");
                  res.setHeader("content-type", "application/json");
                  res.end(JSON.stringify({ path: relative(REPO_ROOT, LANDING_CONFIG) }));
                } catch (error) {
                  res.statusCode = 400;
                  res.end(error instanceof Error ? error.message : "Bad config");
                }
              })();
            });
          });
        },
      },
    ],
  },
});
