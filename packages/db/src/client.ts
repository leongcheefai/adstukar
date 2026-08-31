import { serverEnv } from "@repo/env";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const client = postgres(serverEnv.DATABASE_URL);
export const db = drizzle(client, { schema });

/**
 * Close the connection pool. Long-lived servers never need this — a one-shot
 * script does, because an open pool keeps the Node process alive forever.
 */
export async function closeDb() {
  await client.end();
}
