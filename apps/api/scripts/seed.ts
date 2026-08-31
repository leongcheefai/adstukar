import "../src/load-env";
import { auth } from "@repo/auth";
import { closeDb, db, schema } from "@repo/db";
import { serverEnv } from "@repo/env";
import { eq } from "drizzle-orm";

const ADMIN_ROLE = "admin";
const MIN_PASSWORD_LENGTH = 8;

const HELP = `Seed the database

Usage: pnpm db:seed [--email <email>] [--password <password>] [--name <name>]

Creates the first admin user, or promotes an existing user to admin. The user is
created through Better Auth, so the password hash and the credential account row
match what the sign-in flow expects. Running the command twice is safe.

Options:
  --email <email>        Admin email (default: SEED_ADMIN_EMAIL)
  --password <password>  Admin password (default: SEED_ADMIN_PASSWORD)
  --name <name>          Admin display name (default: SEED_ADMIN_NAME, or "Admin")
  -h, --help             Show this help message
`;

function fail(message: string): never {
  console.error(`Error: ${message}`);
  process.exit(1);
}

interface Args {
  help: boolean;
  email?: string;
  password?: string;
  name?: string;
}

function parseArgs(args: string[]): Args {
  if (args.includes("--help") || args.includes("-h")) return { help: true };

  const parsed: Args = { help: false };
  for (let index = 0; index < args.length; index += 1) {
    const flag = args[index];
    if (flag !== "--email" && flag !== "--password" && flag !== "--name") {
      fail(`Unknown argument "${flag}". Run with --help for usage.`);
    }
    const value = args[index + 1];
    if (value === undefined || value.startsWith("--")) fail(`${flag} needs a value.`);
    parsed[flag.slice(2) as "email" | "password" | "name"] = value;
    index += 1;
  }
  return parsed;
}

async function seedAdmin(email: string, password: string, name: string) {
  const [existing] = await db
    .select({ id: schema.user.id, role: schema.user.role })
    .from(schema.user)
    .where(eq(schema.user.email, email))
    .limit(1);

  if (existing) {
    if (existing.role === ADMIN_ROLE) {
      console.log(`${email} is already an admin. Nothing to do.`);
      return;
    }
    await db
      .update(schema.user)
      .set({ role: ADMIN_ROLE, updatedAt: new Date() })
      .where(eq(schema.user.id, existing.id));
    console.log(`Promoted the existing user ${email} to admin. The password is unchanged.`);
    return;
  }

  await auth.api.signUpEmail({ body: { email, password, name } });

  // Better Auth owns the sign-up shape, so the role and the verified flag are
  // set afterwards. Both are plain columns — no hashing is involved.
  await db
    .update(schema.user)
    .set({ role: ADMIN_ROLE, emailVerified: true, updatedAt: new Date() })
    .where(eq(schema.user.email, email));

  console.log(`Created the admin user ${email}.`);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log(HELP);
    return;
  }

  if (serverEnv.NODE_ENV === "production") {
    fail("Refusing to seed with NODE_ENV=production. Promote the account by hand instead.");
  }

  const email = args.email ?? serverEnv.SEED_ADMIN_EMAIL;
  const password = args.password ?? serverEnv.SEED_ADMIN_PASSWORD;
  const name = args.name ?? serverEnv.SEED_ADMIN_NAME ?? "Admin";

  if (!email) fail("No admin email. Pass --email or set SEED_ADMIN_EMAIL in the root .env.");
  if (!password) {
    fail("No admin password. Pass --password or set SEED_ADMIN_PASSWORD in the root .env.");
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    fail(`The admin password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
  }

  await seedAdmin(email, password, name);
}

try {
  await main();
} catch (error) {
  console.error(error instanceof Error ? `Error: ${error.message}` : error);
  await closeDb();
  process.exit(1);
}

await closeDb();
