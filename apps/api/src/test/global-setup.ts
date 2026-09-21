import { prepareTestDatabase } from "@repo/db/testing";

const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5432/adstukar_test";

/** Runs once before the database tests: the database exists and is migrated. */
export default async function setup(): Promise<void> {
  await prepareTestDatabase(TEST_DATABASE_URL);
}
