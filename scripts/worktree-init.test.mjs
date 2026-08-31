import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import {
  chmodSync,
  lstatSync,
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

const scriptPath = join(dirname(fileURLToPath(import.meta.url)), "worktree-init.mjs");
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
  execFileSync("git", args, { cwd, stdio: "ignore", env: { ...process.env, ...gitEnv } });
}

function createFixture({ env = true } = {}) {
  const base = mkdtempSync(join(tmpdir(), "praxor-worktree-"));
  const main = join(base, "main");
  const worktree = join(base, "feature");
  const bin = join(base, "bin");
  const log = join(base, "commands.log");
  mkdirSync(main);
  mkdirSync(bin);

  writeFileSync(join(main, "package.json"), '{"name":"praxor-kit","private":true}\n');
  writeFileSync(join(main, ".gitignore"), ".env\n");
  git(["-c", "init.defaultBranch=master", "init"], main);
  git(["add", "."], main);
  git(["commit", "-m", "initial"], main);
  git(["worktree", "add", "-b", "feat/thing", worktree, "master"], main);

  if (env) {
    writeFileSync(
      join(main, ".env"),
      [
        "DATABASE_URL=postgresql://postgres:postgres@localhost:5432/praxor_kit",
        "BETTER_AUTH_SECRET=a-secret-that-is-at-least-32-characters",
        "",
      ].join("\n"),
    );
  }

  writeExecutable(
    join(bin, "corepack"),
    'printf "corepack %s\\n" "$*" >> "$WORKTREE_TEST_LOG"\n[ "$1" = "--version" ] && echo "0.30.0"\nexit 0',
  );
  writeExecutable(
    join(bin, "docker"),
    'printf "docker %s\\n" "$*" >> "$WORKTREE_TEST_LOG"\nexit 0',
  );

  return { base, main, worktree, bin, log };
}

function runInit(fixture, args = [], cwd = fixture.worktree) {
  return spawnSync(process.execPath, [scriptPath, ...args], {
    cwd,
    encoding: "utf8",
    env: {
      ...process.env,
      ...gitEnv,
      PATH: `${fixture.bin}:${process.env.PATH ?? ""}`,
      WORKTREE_TEST_LOG: fixture.log,
    },
  });
}

test("a worktree shares the main checkout's env through a symlink", (t) => {
  const fixture = createFixture();
  t.after(() => rmSync(fixture.base, { recursive: true, force: true }));

  const result = runInit(fixture);
  const link = lstatSync(join(fixture.worktree, ".env"));
  const commands = readFileSync(fixture.log, "utf8");

  assert.equal(result.status, 0, result.stderr);
  assert.ok(link.isSymbolicLink());
  assert.match(readFileSync(join(fixture.worktree, ".env"), "utf8"), /praxor_kit/);
  assert.match(commands, /corepack pnpm install/);
  assert.doesNotMatch(commands, /db:push/);
  assert.match(result.stdout, /Linked \.env to the main checkout/);
});

test("a worktree can take its own database derived from the branch", (t) => {
  const fixture = createFixture();
  t.after(() => rmSync(fixture.base, { recursive: true, force: true }));

  const result = runInit(fixture, ["--db"]);
  const env = readFileSync(join(fixture.worktree, ".env"), "utf8");
  const commands = readFileSync(fixture.log, "utf8");

  assert.equal(result.status, 0, result.stderr);
  assert.equal(lstatSync(join(fixture.worktree, ".env")).isSymbolicLink(), false);
  assert.match(
    env,
    /DATABASE_URL=postgresql:\/\/postgres:postgres@localhost:5432\/praxor_feat_thing$/m,
  );
  assert.match(env, /BETTER_AUTH_SECRET=a-secret-that-is-at-least-32-characters/);
  assert.match(
    commands,
    /docker compose exec -T postgres psql -U postgres -c CREATE DATABASE "praxor_feat_thing"/,
  );
  assert.match(commands, /corepack pnpm db:push/);
});

test("an explicit database name overrides the branch-derived one", (t) => {
  const fixture = createFixture();
  t.after(() => rmSync(fixture.base, { recursive: true, force: true }));

  const result = runInit(fixture, ["--db", "billing_spike", "--no-install"]);
  const commands = readFileSync(fixture.log, "utf8");

  assert.equal(result.status, 0, result.stderr);
  assert.match(readFileSync(join(fixture.worktree, ".env"), "utf8"), /\/billing_spike$/m);
  assert.match(commands, /CREATE DATABASE "billing_spike"/);
  assert.doesNotMatch(commands, /pnpm install/);
});

test("a database name that is not a plain identifier is rejected", (t) => {
  const fixture = createFixture();
  t.after(() => rmSync(fixture.base, { recursive: true, force: true }));

  const result = runInit(fixture, ["--db", 'x"; DROP DATABASE praxor_kit; --']);

  assert.equal(result.status, 1);
  assert.match(result.stderr, /Invalid database name/);
});

test("running in the main checkout is refused", (t) => {
  const fixture = createFixture();
  t.after(() => rmSync(fixture.base, { recursive: true, force: true }));

  const result = runInit(fixture, [], fixture.main);

  assert.equal(result.status, 1);
  assert.match(result.stderr, /is the main checkout, not a linked worktree/);
});

test("a main checkout without an env file explains how to fix it", (t) => {
  const fixture = createFixture({ env: false });
  t.after(() => rmSync(fixture.base, { recursive: true, force: true }));

  const result = runInit(fixture);

  assert.equal(result.status, 1);
  assert.match(result.stderr, /has no \.env\. Run `pnpm bootstrap` there first/);
});

test("help describes the command without touching the worktree", (t) => {
  const fixture = createFixture();
  t.after(() => rmSync(fixture.base, { recursive: true, force: true }));

  const result = runInit(fixture, ["--help"]);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Usage: node scripts\/worktree-init\.mjs/);
  assert.match(result.stdout, /--db \[name\]/);
});
