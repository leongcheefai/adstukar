import { resolve } from "node:path";
import { defineConfig } from "vite";
import { apiDefine, buildTarget } from "./vite.config";

// The React wrapper: an ES module, `dist/react.js`, with React left external.
export default defineConfig(({ mode }) => ({
  publicDir: false,
  define: apiDefine(mode),
  // `loadEnv` (in apiDefine) picks up `NODE_ENV=development` from the repo-root .env, which
  // flips Vite into a development build. Pin the JSX runtime to production so the output
  // imports `react/jsx-runtime` and never inlines the dev runtime.
  esbuild: { jsxDev: false },
  build: {
    outDir: "dist",
    emptyOutDir: false,
    minify: "esbuild",
    target: buildTarget,
    lib: {
      entry: resolve(import.meta.dirname, "src/react.tsx"),
      formats: ["es"],
      fileName: () => "react.js",
    },
    rollupOptions: {
      external: ["react", "react/jsx-runtime"],
    },
  },
}));
