import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
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

const scriptPath = join(dirname(fileURLToPath(import.meta.url)), "bootstrap.mjs");

function writeExecutable(path, contents) {
  writeFileSync(path, `#!/bin/sh\n${contents}\n`);
  chmodSync(path, 0o755);
}

function createFixture() {
  const root = mkdtempSync(join(tmpdir(), "adstukar-bootstrap-"));
  const bin = join(root, "bin");
  const log = join(root, "commands.log");
  mkdirSync(bin);

  writeFileSync(join(root, "package.json"), '{"name":"adstukar","private":true}\n');
  writeFileSync(
    join(root, "docker-compose.yml"),
    "services:\n  postgres:\n    image: postgres:16-alpine\n",
  );
  writeFileSync(
    join(root, ".env.example"),
    [
      "DATABASE_URL=postgresql://postgres:postgres@localhost:5432/adstukar",
      "BETTER_AUTH_SECRET=change-me-at-least-32-characters-long!!",
      "APP_URL=http://localhost:3000",
      "BETTER_AUTH_URL=http://localhost:3001",
      "WEB_URL=http://localhost:4321",
      "",
    ].join("\n"),
  );

  writeExecutable(
    join(bin, "corepack"),
    'printf "corepack %s\\n" "$*" >> "$BOOTSTRAP_TEST_LOG"\n[ "$1" = "--version" ] && echo "0.30.0"\nexit 0',
  );
  writeExecutable(
    join(bin, "docker"),
    'printf "docker %s\\n" "$*" >> "$BOOTSTRAP_TEST_LOG"\n[ "$1" = "--version" ] && echo "Docker version test"\nexit 0',
  );

  return { root, bin, log };
}

function runBootstrap(fixture, args = []) {
  return execFileSync(process.execPath, [scriptPath, ...args], {
    cwd: fixture.root,
    encoding: "utf8",
    env: {
      ...process.env,
      PATH: `${fixture.bin}:${process.env.PATH ?? ""}`,
      BOOTSTRAP_TEST_LOG: fixture.log,
    },
  });
}

test("a fresh project can be bootstrapped through the CLI", (t) => {
  const fixture = createFixture();
  t.after(() => rmSync(fixture.root, { recursive: true, force: true }));

  const output = runBootstrap(fixture);
  const env = readFileSync(join(fixture.root, ".env"), "utf8");
  const commands = readFileSync(fixture.log, "utf8");

  assert.match(env, /BETTER_AUTH_SECRET=[A-Za-z0-9_-]{43}/);
  assert.doesNotMatch(env, /change-me-at-least-32-characters-long/);
  assert.match(commands, /corepack pnpm install --frozen-lockfile/);
  assert.match(commands, /docker compose up -d/);
  assert.match(commands, /docker compose exec -T postgres pg_isready -U postgres/);
  assert.match(commands, /corepack pnpm db:push/);
  assert.match(output, /Dashboard\s+http:\/\/localhost:3000/);
  assert.match(output, /API\s+http:\/\/localhost:3001/);
  assert.match(output, /Marketing\s+http:\/\/localhost:4321/);
});

test("an existing root env file is preserved", (t) => {
  const fixture = createFixture();
  t.after(() => rmSync(fixture.root, { recursive: true, force: true }));
  const existing = "BETTER_AUTH_SECRET=my-existing-secret-that-must-stay\n";
  writeFileSync(join(fixture.root, ".env"), existing);

  const output = runBootstrap(fixture);

  assert.equal(readFileSync(join(fixture.root, ".env"), "utf8"), existing);
  assert.match(output, /Keeping existing \.env/);
});

test("help describes the bootstrap without changing the project", (t) => {
  const fixture = createFixture();
  t.after(() => rmSync(fixture.root, { recursive: true, force: true }));

  const output = runBootstrap(fixture, ["--help"]);

  assert.match(output, /Usage: node scripts\/bootstrap\.mjs/);
  assert.match(output, /generates a local auth secret/);
  assert.equal(existsSync(join(fixture.root, ".env")), false);
  assert.equal(existsSync(fixture.log), false);
});
