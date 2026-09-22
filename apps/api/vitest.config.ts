import { defineConfig } from "vitest/config";

/** The pure tests. They need no database, and `pnpm verify` runs them. */
export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
    exclude: ["src/**/*.db.test.ts", "node_modules/**"],
  },
});
