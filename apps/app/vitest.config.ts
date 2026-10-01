import { defineConfig } from "vitest/config";

// The screen rules are pure, so they run in node. A component test would need
// jsdom; there is none yet.
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
