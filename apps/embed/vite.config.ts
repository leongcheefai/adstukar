import { resolve } from "node:path";
import { defineConfig, loadEnv } from "vite";

const repoRoot = resolve(import.meta.dirname, "../..");

/**
 * The API origin is baked in at build time from the repo-root `.env` (`VITE_API_URL`).
 * `data-adstukar-api` on the target element overrides it at runtime for self-hosting.
 */
export function apiDefine(mode: string): Record<string, string> {
  const env = loadEnv(mode, repoRoot, "VITE_");
  return { __ADSTUKAR_API__: JSON.stringify(env.VITE_API_URL ?? "http://localhost:3001") };
}

export const buildTarget = "es2018";

// The snippet: one self-contained IIFE, `dist/adstukar.js`, no dependencies.
export default defineConfig(({ mode }) => ({
  publicDir: "public",
  define: apiDefine(mode),
  build: {
    outDir: "dist",
    emptyOutDir: true,
    minify: "esbuild",
    target: buildTarget,
    lib: {
      entry: resolve(import.meta.dirname, "src/embed.ts"),
      formats: ["iife"],
      name: "AdsTukar",
      fileName: () => "adstukar.js",
    },
  },
}));
