import { defineConfig } from "vitest/config";

export default defineConfig({
  define: { __ADSTUKAR_API__: '"http://api.test"' },
  test: {
    environment: "node",
  },
});
