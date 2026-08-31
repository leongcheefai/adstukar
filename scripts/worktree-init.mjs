#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, realpathSync, symlinkSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";

const MAX_DATABASE_NAME_LENGTH = 63;
const HELP = `AdsTukar worktree init

Usage: node scripts/worktree-init.mjs [options]

Prepares a linked git worktree so it can run the project: links the main
checkout's .env into the worktree and installs dependencies. Run it from
inside the worktree, or point at one with --path.

Options:
      --db [name]  Give the worktree its own database instead of sharing the
                   main checkout's. Copies .env with the database name
                   swapped, creates the database, and pushes the schema.
                   Defaults to a name derived from the worktree's branch
      --no-install  Skip the dependency install
      --path <dir>  Operate on this worktree instead of the current directory
  -h, --help        Show this help message
`;

function fail(message) {
  throw new Error(message);
}

function git(args, cwd) {
  const result = spawnSync("git", args, { cwd, encoding: "utf8" });
  if (result.error) {
    fail(`git is unavailable: ${result.error.message}`);
  }
  if (result.status !== 0) {
    fail(`\`git ${args.join(" ")}\` failed: ${(result.stderr ?? "").trim() || "unknown error"}`);
  }
  return result.stdout.trim();
}

function commandSucceeds(command, args) {
  const result = spawnSync(command, args, { stdio: "ignore" });
  return result.status === 0;
}

function run(command, args, label, cwd) {
  console.log(`\n→ ${label}`);
  const result = spawnSync(command, args, { cwd, stdio: "inherit" });

  if (result.error) {
    fail(`${label} failed: ${result.error.message}`);
  }
  if (result.status !== 0) {
    fail(`${label} failed with exit code ${result.status ?? "unknown"}.`);
  }
}

function resolvePnpm() {
  if (commandSucceeds("corepack", ["--version"])) {
    return { command: "corepack", prefix: ["pnpm"] };
  }
  if (commandSucceeds("pnpm", ["--version"])) {
    return { command: "pnpm", prefix: [] };
  }
  fail("pnpm is unavailable. Install pnpm 9+ or enable Corepack, then run this command again.");
}

function parseArgs(argv) {
  const options = { database: null, install: true, path: null };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--no-install") {
      options.install = false;
    } else if (arg === "--db") {
      const next = argv[index + 1];
      if (next && !next.startsWith("-")) {
        options.database = next;
        index += 1;
      } else {
        options.database = true;
      }
    } else if (arg.startsWith("--db=")) {
      options.database = arg.slice("--db=".length);
    } else if (arg === "--path") {
      options.path = argv[index + 1];
      if (!options.path) fail("--path needs a directory. Run with --help for usage.");
      index += 1;
    } else if (arg.startsWith("--path=")) {
      options.path = arg.slice("--path=".length);
    } else {
      fail(`Unknown option: ${arg}. Run with --help for usage.`);
    }
  }

  return options;
}

function resolveWorktree(cwd) {
  const worktree = realpathSync(git(["rev-parse", "--show-toplevel"], cwd));
  const commonDirectory = git(["rev-parse", "--path-format=absolute", "--git-common-dir"], cwd);
  const mainCheckout = realpathSync(dirname(commonDirectory));

  if (worktree === mainCheckout) {
    fail(
      `${worktree} is the main checkout, not a linked worktree. Run \`pnpm bootstrap\` here instead.`,
    );
  }
  if (!existsSync(join(mainCheckout, ".env"))) {
    fail(`The main checkout at ${mainCheckout} has no .env. Run \`pnpm bootstrap\` there first.`);
  }

  return { worktree, mainCheckout };
}

function databaseNameFor(option, worktree) {
  if (typeof option === "string") return option;

  const branch = git(["rev-parse", "--abbrev-ref", "HEAD"], worktree);
  const slug = branch
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  if (slug === "" || slug === "head") {
    fail("Could not derive a database name from the worktree's branch. Pass `--db <name>`.");
  }

  return `adstukar_${slug}`.slice(0, MAX_DATABASE_NAME_LENGTH);
}

function assertDatabaseName(name) {
  if (!/^[a-z_][a-z0-9_]*$/.test(name)) {
    fail(`Invalid database name "${name}". Use lowercase letters, digits, and underscores.`);
  }
  if (name.length > MAX_DATABASE_NAME_LENGTH) {
    fail(`Database name "${name}" exceeds ${MAX_DATABASE_NAME_LENGTH} characters.`);
  }
}

function rewriteDatabaseUrl(env, name) {
  const pattern = /^(DATABASE_URL=\S*\/)([^/?\s]+)(\?\S*)?$/m;
  if (!pattern.test(env)) {
    fail("The main checkout's .env has no DATABASE_URL ending in a database name.");
  }
  return env.replace(
    pattern,
    (_match, prefix, _database, query) => `${prefix}${name}${query ?? ""}`,
  );
}

function linkEnv(worktree, mainCheckout) {
  const target = join(worktree, ".env");
  if (existsSync(target)) {
    console.log("✓ Keeping existing .env");
    return;
  }

  symlinkSync(relative(worktree, join(mainCheckout, ".env")), target);
  console.log("✓ Linked .env to the main checkout");
}

function copyEnv(worktree, mainCheckout, name) {
  const target = join(worktree, ".env");
  if (existsSync(target)) {
    console.log("✓ Keeping existing .env");
    return;
  }

  const env = readFileSync(join(mainCheckout, ".env"), "utf8");
  writeFileSync(target, rewriteDatabaseUrl(env, name), { flag: "wx", mode: 0o600 });
  console.log(`✓ Created .env pointing at the ${name} database`);
}

function createDatabase(mainCheckout, name) {
  console.log(`\n→ Creating the ${name} database`);
  const result = spawnSync(
    "docker",
    [
      "compose",
      "exec",
      "-T",
      "postgres",
      "psql",
      "-U",
      "postgres",
      "-c",
      `CREATE DATABASE "${name}"`,
    ],
    { cwd: mainCheckout, encoding: "utf8" },
  );

  if (result.error) {
    fail(`Docker is unavailable: ${result.error.message}`);
  }
  if (result.status !== 0) {
    const output = `${result.stdout ?? ""}${result.stderr ?? ""}`;
    if (/already exists/.test(output)) {
      console.log(`✓ Reusing the existing ${name} database`);
      return;
    }
    fail(
      `Could not create the ${name} database. Run \`pnpm db:up\` in the main checkout.\n${output.trim()}`,
    );
  }

  console.log(`✓ Created the ${name} database`);
}

function initialise(argv, cwd) {
  const options = parseArgs(argv);
  const { worktree, mainCheckout } = resolveWorktree(options.path ?? cwd);
  console.log(
    `AdsTukar worktree init\n\n  Worktree      ${worktree}\n  Main checkout ${mainCheckout}\n`,
  );

  const pnpm = resolvePnpm();
  let database = null;

  if (options.database === null) {
    linkEnv(worktree, mainCheckout);
  } else {
    database = databaseNameFor(options.database, worktree);
    assertDatabaseName(database);
    copyEnv(worktree, mainCheckout, database);
    createDatabase(mainCheckout, database);
  }

  if (options.install) {
    run(pnpm.command, [...pnpm.prefix, "install"], "Installing dependencies", worktree);
  }
  if (database) {
    run(pnpm.command, [...pnpm.prefix, "db:push"], "Pushing the database schema", worktree);
  }

  console.log(`
✓ Worktree ready

  ${database ? `Database  ${database}` : "Database  shared with the main checkout"}
  Env       ${database ? "copied from" : "linked to"} the main checkout

Run \`pnpm verify\` here, and \`pnpm review <branch>\` in the main checkout to try the branch.
`);
}

try {
  const args = process.argv.slice(2);
  if (args.includes("--help") || args.includes("-h")) {
    console.log(HELP);
  } else {
    initialise(args, process.cwd());
  }
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`\nWorktree init failed: ${message}`);
  process.exitCode = 1;
}
