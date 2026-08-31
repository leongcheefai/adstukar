import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import {
  chmodSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const scriptPath = join(dirname(fileURLToPath(import.meta.url)), "review.mjs");
const gitEnv = {
  GIT_AUTHOR_NAME: "Test",
  GIT_AUTHOR_EMAIL: "test@example.com",
  GIT_COMMITTER_NAME: "Test",
  GIT_COMMITTER_EMAIL: "test@example.com",
};

function writeExecutable(path, contents) {
  writeFileSync(path, `#!/bin/sh\n${contents}\n`);
  chmodSync(path, 0o755);
}

function git(args, cwd) {
  return execFileSync("git", args, {
    cwd,
    encoding: "utf8",
    env: { ...process.env, ...gitEnv },
  }).trim();
}

function createFixture({ lockfileChanges = false } = {}) {
  const base = mkdtempSync(join(tmpdir(), "adstukar-review-"));
  const main = join(base, "main");
  const worktree = join(base, "feature");
  const bin = join(base, "bin");
  const log = join(base, "commands.log");
  mkdirSync(main);
  mkdirSync(bin);

  writeFileSync(join(main, "package.json"), '{"name":"adstukar","private":true}\n');
  writeFileSync(join(main, "pnpm-lock.yaml"), "lockfileVersion: '9.0'\n");
  writeFileSync(join(main, ".gitignore"), ".env\n");
  git(["-c", "init.defaultBranch=master", "init"], main);
  git(["add", "."], main);
  git(["commit", "-m", "initial"], main);

  git(["worktree", "add", "-b", "feat/thing", worktree, "master"], main);
  writeFileSync(join(worktree, "feature.txt"), "shipped\n");
  if (lockfileChanges) {
    writeFileSync(join(worktree, "pnpm-lock.yaml"), "lockfileVersion: '9.0'\n# stripe\n");
  }
  git(["add", "."], worktree);
  git(["commit", "-m", "feat: add the thing"], worktree);

  writeExecutable(
    join(bin, "corepack"),
    'printf "corepack %s\\n" "$*" >> "$REVIEW_TEST_LOG"\n[ "$1" = "--version" ] && echo "0.30.0"\nexit 0',
  );

  return { base, main, worktree, bin, log };
}

function runReview(fixture, args = [], cwd = fixture.main) {
  return spawnSync(process.execPath, [scriptPath, ...args], {
    cwd,
    encoding: "utf8",
    env: {
      ...process.env,
      ...gitEnv,
      PATH: `${fixture.bin}:${process.env.PATH ?? ""}`,
      REVIEW_TEST_LOG: fixture.log,
    },
  });
}

test("a branch held by a worktree is checked out detached in the main checkout", (t) => {
  const fixture = createFixture();
  t.after(() => rmSync(fixture.base, { recursive: true, force: true }));

  const result = runReview(fixture, ["feat/thing"]);

  assert.equal(result.status, 0, result.stderr);
  assert.equal(
    git(["rev-parse", "HEAD"], fixture.main),
    git(["rev-parse", "feat/thing"], fixture.main),
  );
  assert.equal(
    spawnSync("git", ["symbolic-ref", "-q", "HEAD"], { cwd: fixture.main }).status,
    1,
    "expected a detached HEAD",
  );
  assert.match(result.stdout, /Checked out [0-9a-f]+ feat: add the thing/);
});

test("an unchanged lockfile skips the install", (t) => {
  const fixture = createFixture();
  t.after(() => rmSync(fixture.base, { recursive: true, force: true }));

  const result = runReview(fixture, ["feat/thing"]);

  assert.equal(result.status, 0, result.stderr);
  assert.equal(existsSync(fixture.log), false, "expected no package manager to run");
});

test("a lockfile change on the branch triggers an install", (t) => {
  const fixture = createFixture({ lockfileChanges: true });
  t.after(() => rmSync(fixture.base, { recursive: true, force: true }));

  const result = runReview(fixture, ["feat/thing"]);

  assert.equal(result.status, 0, result.stderr);
  assert.match(readFileSync(fixture.log, "utf8"), /corepack pnpm install/);
  assert.match(result.stdout, /pnpm-lock\.yaml changed on this branch/);
});

test("verify runs against the checked out branch on request", (t) => {
  const fixture = createFixture();
  t.after(() => rmSync(fixture.base, { recursive: true, force: true }));

  const result = runReview(fixture, ["feat/thing", "--verify"]);

  assert.equal(result.status, 0, result.stderr);
  assert.match(readFileSync(fixture.log, "utf8"), /corepack pnpm verify/);
});

test("back returns to the branch that was checked out before", (t) => {
  const fixture = createFixture();
  t.after(() => rmSync(fixture.base, { recursive: true, force: true }));

  runReview(fixture, ["feat/thing"]);
  const result = runReview(fixture, ["--back"]);

  assert.equal(result.status, 0, result.stderr);
  assert.equal(git(["rev-parse", "--abbrev-ref", "HEAD"], fixture.main), "master");
});

test("uncommitted changes block the checkout", (t) => {
  const fixture = createFixture();
  t.after(() => rmSync(fixture.base, { recursive: true, force: true }));
  writeFileSync(join(fixture.main, "package.json"), '{"name":"adstukar","private":true,"x":1}\n');

  const result = runReview(fixture, ["feat/thing"]);

  assert.equal(result.status, 1);
  assert.match(result.stderr, /uncommitted changes/);
  assert.equal(git(["rev-parse", "--abbrev-ref", "HEAD"], fixture.main), "master");
});

test("an unknown branch names the branches the worktrees hold", (t) => {
  const fixture = createFixture();
  t.after(() => rmSync(fixture.base, { recursive: true, force: true }));

  const result = runReview(fixture, ["feat/nope"]);

  assert.equal(result.status, 1);
  assert.match(result.stderr, /No branch named "feat\/nope"/);
  assert.match(result.stderr, /Branches held by worktrees: master, feat\/thing/);
});

test("listing shows every worktree and its branch", (t) => {
  const fixture = createFixture();
  t.after(() => rmSync(fixture.base, { recursive: true, force: true }));

  const result = runReview(fixture, ["--list"]);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /feat\/thing/);
  assert.match(result.stdout, /pnpm review <branch>/);
});

test("running from a worktree points back at the main checkout", (t) => {
  const fixture = createFixture();
  t.after(() => rmSync(fixture.base, { recursive: true, force: true }));

  const result = runReview(fixture, ["feat/thing"], fixture.worktree);

  assert.equal(result.status, 1);
  assert.match(result.stderr, /Run this from the main checkout/);
});

test("help describes the command without changing the checkout", (t) => {
  const fixture = createFixture();
  t.after(() => rmSync(fixture.base, { recursive: true, force: true }));

  const result = runReview(fixture, ["--help"]);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Usage: node scripts\/review\.mjs/);
  assert.equal(git(["rev-parse", "--abbrev-ref", "HEAD"], fixture.main), "master");
});
