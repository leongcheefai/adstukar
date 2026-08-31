#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { realpathSync } from "node:fs";
import { dirname } from "node:path";

const LOCKFILE = "pnpm-lock.yaml";
const HELP = `Praxor Kit review

Usage: node scripts/review.mjs <branch> [options]
       node scripts/review.mjs --list
       node scripts/review.mjs --back

Checks a branch out in the main checkout so you can run it with the .env,
dependencies, and database that are already set up here. The checkout is
detached, so it works even while a worktree holds that branch.

Options:
      --verify  Run \`pnpm verify\` after the checkout
      --list    List the worktrees and the branches they hold
      --back    Return to the branch you were on before
  -h, --help    Show this help message
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

function gitOutput(args, cwd) {
  const result = spawnSync("git", args, { cwd, encoding: "utf8" });
  if (result.error) {
    fail(`git is unavailable: ${result.error.message}`);
  }
  return result.status === 0 ? result.stdout.trim() : null;
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
  const options = { branch: null, back: false, list: false, verify: false };

  for (const arg of argv) {
    if (arg === "--verify") options.verify = true;
    else if (arg === "--list") options.list = true;
    else if (arg === "--back") options.back = true;
    else if (arg.startsWith("-")) fail(`Unknown option: ${arg}. Run with --help for usage.`);
    else if (options.branch)
      fail(`Review one branch at a time. Got "${options.branch}" and "${arg}".`);
    else options.branch = arg;
  }

  if (options.back && options.branch) {
    fail("Pass a branch or --back, not both.");
  }

  return options;
}

function assertMainCheckout(cwd) {
  const checkout = realpathSync(git(["rev-parse", "--show-toplevel"], cwd));
  const mainCheckout = realpathSync(
    dirname(git(["rev-parse", "--path-format=absolute", "--git-common-dir"], cwd)),
  );

  if (checkout !== mainCheckout) {
    fail(
      `Run this from the main checkout at ${mainCheckout}, not from the worktree at ${checkout}.`,
    );
  }

  return mainCheckout;
}

function assertCleanTree(cwd) {
  const status = git(["status", "--porcelain"], cwd);
  if (status !== "") {
    fail("The working tree has uncommitted changes. Commit or stash them, then try again.");
  }
}

function worktrees(cwd) {
  const entries = [];
  let current = null;

  for (const line of git(["worktree", "list", "--porcelain"], cwd).split("\n")) {
    if (line.startsWith("worktree ")) {
      current = { path: line.slice("worktree ".length), branch: null };
      entries.push(current);
    } else if (line.startsWith("branch ") && current) {
      current.branch = line.slice("branch refs/heads/".length);
    }
  }

  return entries;
}

function listWorktrees(cwd) {
  const entries = worktrees(cwd);
  console.log("Worktrees\n");
  for (const entry of entries) {
    console.log(`  ${(entry.branch ?? "(detached)").padEnd(28)} ${entry.path}`);
  }
  console.log("\nRun `pnpm review <branch>` to try one here.");
}

function resolveRef(branch, cwd) {
  for (const candidate of [branch, `origin/${branch}`]) {
    if (gitOutput(["rev-parse", "--verify", "--quiet", `${candidate}^{commit}`], cwd)) {
      return candidate;
    }
  }

  const known = worktrees(cwd)
    .map((entry) => entry.branch)
    .filter(Boolean);
  const hint = known.length > 0 ? ` Branches held by worktrees: ${known.join(", ")}.` : "";
  fail(`No branch named "${branch}".${hint}`);
}

function lockfileHash(ref, cwd) {
  return gitOutput(["rev-parse", "--verify", "--quiet", `${ref}:${LOCKFILE}`], cwd);
}

function describe(ref, cwd) {
  return gitOutput(["log", "-1", "--pretty=%h %s", ref], cwd) ?? ref;
}

function review(argv, cwd) {
  const options = parseArgs(argv);
  const mainCheckout = assertMainCheckout(cwd);

  if (options.list) {
    listWorktrees(mainCheckout);
    return;
  }
  if (!options.branch && !options.back) {
    listWorktrees(mainCheckout);
    return;
  }

  const target = options.back ? "-" : resolveRef(options.branch, mainCheckout);
  assertCleanTree(mainCheckout);

  const before = lockfileHash("HEAD", mainCheckout);
  const checkout = options.back ? ["checkout", "-"] : ["checkout", "--detach", target];

  git(checkout, mainCheckout);
  const after = lockfileHash("HEAD", mainCheckout);

  console.log(`✓ Checked out ${describe("HEAD", mainCheckout)}`);

  if (before !== after) {
    console.log(`\n${LOCKFILE} changed on this branch.`);
    const pnpm = resolvePnpm();
    run(pnpm.command, [...pnpm.prefix, "install"], "Installing dependencies", mainCheckout);
  }

  if (options.verify) {
    const pnpm = resolvePnpm();
    run(pnpm.command, [...pnpm.prefix, "verify"], "Verifying", mainCheckout);
  }

  console.log(`
✓ Ready

  Run \`pnpm dev\` to try it, then \`pnpm review --back\` to return.
`);
}

try {
  const args = process.argv.slice(2);
  if (args.includes("--help") || args.includes("-h")) {
    console.log(HELP);
  } else {
    review(args, process.cwd());
  }
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`\nReview failed: ${message}`);
  process.exitCode = 1;
}
