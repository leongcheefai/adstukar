import { defineConfig } from "vitest/config";

/**
 * The database tests: `pnpm test:db`. They run against `TEST_DATABASE_URL`, a
 * database whose name ends in `_test`, and the global setup migrates it first.
 * One file at a time, because every file truncates every table.
 */
const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5432/adstukar_test";

export default defineConfig({
  test: {
    include: ["src/**/*.db.test.ts"],
    fileParallelism: false,
    globalSetup: ["./src/test/global-setup.ts"],
    env: {
      DATABASE_URL: TEST_DATABASE_URL,
      NODE_ENV: "test",
      BETTER_AUTH_SECRET: "test-secret-test-secret-test-secret-test",
    },
  },
});
