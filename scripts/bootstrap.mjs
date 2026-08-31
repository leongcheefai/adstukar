#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const MIN_NODE_MAJOR = 22;
const DATABASE_ATTEMPTS = 60;
const DATABASE_RETRY_MS = 1_000;
const HELP = `Praxor Kit bootstrap

Usage: node scripts/bootstrap.mjs

Checks local prerequisites, installs dependencies, generates a local auth secret
in .env, starts Postgres, and pushes the database schema.

Options:
  -h, --help  Show this help message
`;

function fail(message) {
  throw new Error(message);
}

function commandSucceeds(command, args) {
  const result = spawnSync(command, args, { stdio: "ignore" });
  return result.status === 0;
}

function run(command, args, label, options = {}) {
  console.log(`\n→ ${label}`);
  const result = spawnSync(command, args, {
    cwd: process.cwd(),
    stdio: options.quiet ? "ignore" : "inherit",
  });

  if (result.error) {
    fail(`${label} failed: ${result.error.message}`);
  }
  if (result.status !== 0) {
    fail(`${label} failed with exit code ${result.status ?? "unknown"}.`);
  }
}

function assertProjectRoot(root) {
  const requiredFiles = ["package.json", "docker-compose.yml", ".env.example"];
  const missing = requiredFiles.filter((file) => !existsSync(join(root, file)));
  if (missing.length > 0) {
    fail(`Run this command from the Praxor Kit repository root. Missing: ${missing.join(", ")}`);
  }
}

function assertNodeVersion() {
  const major = Number.parseInt(process.versions.node.split(".")[0] ?? "0", 10);
  if (major < MIN_NODE_MAJOR) {
    fail(`Node ${MIN_NODE_MAJOR}+ is required. Current version: ${process.versions.node}`);
  }
}

function resolvePnpm() {
  if (commandSucceeds("corepack", ["--version"])) {
    return { command: "corepack", prefix: ["pnpm"] };
  }
  if (commandSucceeds("pnpm", ["--version"])) {
    return { command: "pnpm", prefix: [] };
  }
  fail("pnpm is unavailable. Install pnpm 9+ or enable Corepack, then run bootstrap again.");
}

function assertDocker() {
  if (!commandSucceeds("docker", ["--version"])) {
    fail("Docker is unavailable. Install and start Docker, then run bootstrap again.");
  }
  if (!commandSucceeds("docker", ["compose", "version"])) {
    fail(
      "Docker Compose is unavailable. Install the Docker Compose plugin, then run bootstrap again.",
    );
  }
}

function ensureEnv(root) {
  const envPath = join(root, ".env");
  if (existsSync(envPath)) {
    console.log("✓ Keeping existing .env");
    return;
  }

  const example = readFileSync(join(root, ".env.example"), "utf8");
  if (!/^BETTER_AUTH_SECRET=.*$/m.test(example)) {
    fail(".env.example does not define BETTER_AUTH_SECRET.");
  }

  const secret = randomBytes(32).toString("base64url");
  const env = example.replace(/^BETTER_AUTH_SECRET=.*$/m, `BETTER_AUTH_SECRET=${secret}`);
  writeFileSync(envPath, env, { flag: "wx", mode: 0o600 });
  console.log("✓ Created .env with a generated auth secret");
}

function delay(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function waitForDatabase() {
  console.log("\n→ Waiting for Postgres");
  for (let attempt = 1; attempt <= DATABASE_ATTEMPTS; attempt += 1) {
    if (
      commandSucceeds("docker", [
        "compose",
        "exec",
        "-T",
        "postgres",
        "pg_isready",
        "-U",
        "postgres",
      ])
    ) {
      console.log("✓ Postgres is ready");
      return;
    }
    if (attempt < DATABASE_ATTEMPTS) await delay(DATABASE_RETRY_MS);
  }
  fail("Postgres did not become ready within 60 seconds. Check `docker compose logs postgres`.");
}

async function bootstrap() {
  const root = process.cwd();
  console.log("Praxor Kit bootstrap\n");

  assertProjectRoot(root);
  assertNodeVersion();
  const pnpm = resolvePnpm();
  assertDocker();
  ensureEnv(root);

  run(pnpm.command, [...pnpm.prefix, "install", "--frozen-lockfile"], "Installing dependencies");
  run("docker", ["compose", "up", "-d"], "Starting Postgres");
  await waitForDatabase();
  run(pnpm.command, [...pnpm.prefix, "db:push"], "Pushing the database schema");

  console.log(`
✓ Bootstrap complete

  Dashboard   http://localhost:3000
  API         http://localhost:3001
  Marketing   http://localhost:4321

Run \`pnpm dev\` to start the project.
`);
}

try {
  const args = process.argv.slice(2);
  if (args.includes("--help") || args.includes("-h")) {
    console.log(HELP);
  } else if (args.length > 0) {
    fail(`Unknown option: ${args[0]}. Run with --help for usage.`);
  } else {
    await bootstrap();
  }
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`\nBootstrap failed: ${message}`);
  process.exitCode = 1;
}
