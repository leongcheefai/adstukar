import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { getTableName, is } from "drizzle-orm";
import { PgTable } from "drizzle-orm/pg-core";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import * as schema from "./schema";

/**
 * The test database. It never imports `./client`, so it reads no env at load:
 * a test runner names the database it wants, and this module makes it ready.
 */

const MIGRATIONS = join(dirname(fileURLToPath(import.meta.url)), "..", "drizzle");

/** One connection, and no NOTICE lines: a migration's "does not exist, skipping" is not news. */
const quiet = { max: 1, onnotice: () => {} } as const;

/**
 * Creates the database the URL names when it is missing, then applies every
 * migration in `drizzle/`. Running the migrations, rather than a push, is what
 * proves the migration files still apply on a fresh database.
 */
export async function prepareTestDatabase(url: string): Promise<void> {
  const target = new URL(url);
  const name = target.pathname.slice(1);
  if (!name.endsWith("_test")) {
    throw new Error(`Refusing to prepare "${name}": a test database name must end in _test`);
  }

  // The maintenance database is where CREATE DATABASE runs from.
  const maintenance = new URL(url);
  maintenance.pathname = "/postgres";
  const admin = postgres(maintenance.toString(), quiet);
  try {
    const [row] = await admin`select 1 from pg_database where datname = ${name}`;
    if (!row) await admin.unsafe(`create database "${name}"`);
  } finally {
    await admin.end();
  }

  const client = postgres(url, quiet);
  try {
    await migrate(drizzle(client, { schema }), { migrationsFolder: MIGRATIONS });
  } finally {
    await client.end();
  }
}

/** Every table the schema declares, so a truncate never misses a new one. */
export function tableNames(): string[] {
  const values: unknown[] = Object.values(schema);
  return values
    .filter((value): value is PgTable => is(value, PgTable))
    .map((table) => getTableName(table));
}
