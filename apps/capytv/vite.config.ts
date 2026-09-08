import { resolve } from "node:path";
import { project } from "@repo/config/project";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  // Env lives in the repo-root .env. Only VITE_-prefixed vars reach the browser bundle.
  envDir: resolve(import.meta.dirname, "../.."),
  plugins: [
    tailwindcss(),
    react(),
    {
      name: "project-identity",
      transformIndexHtml: (html) => html.replaceAll("%PROJECT_NAME%", () => project.name),
    },
  ],
  server: {
    port: 3002,
    // Fail loudly instead of falling back onto the dashboard or the API port.
    strictPort: true,
  },
  build: {
    outDir: "dist",
  },
});
