import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const scriptPath = join(dirname(fileURLToPath(import.meta.url)), "launch-check.mjs");

function createReadyFixture() {
  const root = mkdtempSync(join(tmpdir(), "praxor-launch-check-"));
  mkdirSync(join(root, "packages/config/src"), { recursive: true });
  mkdirSync(join(root, "apps/web/src/pages"), { recursive: true });

  writeFileSync(
    join(root, "packages/config/src/project.ts"),
    `export const project = {
  name: "Acme Cloud",
  slug: "acme-cloud",
  tagline: "Automate the work your team repeats.",
  description: "A reliable automation workspace for growing operations teams.",
  siteUrl: "https://acme.example",
  email: {
    from: "hello@acme.example",
    support: "support@acme.example",
  },
} as const;
`,
  );
  writeFileSync(
    join(root, "apps/web/src/pages/index.astro"),
    "<h1>Automate your operations</h1>\n",
  );
  writeFileSync(
    join(root, ".env.production"),
    [
      "NODE_ENV=production",
      "DATABASE_URL=postgresql://acme:secret@db.acme.example:5432/acme",
      "BETTER_AUTH_SECRET=abcdefghijklmnopqrstuvwxyz1234567890ABCDEFG",
      "BETTER_AUTH_URL=https://api.acme.example",
      "APP_URL=https://app.acme.example",
      "WEB_URL=https://acme.example",
      "VITE_API_URL=https://api.acme.example",
      "PUBLIC_APP_URL=https://app.acme.example",
      "PUBLIC_API_URL=https://api.acme.example",
      "",
    ].join("\n"),
  );

  return root;
}

test("a customized project with production configuration is launch ready", (t) => {
  const root = createReadyFixture();
  t.after(() => rmSync(root, { recursive: true, force: true }));

  const output = execFileSync(process.execPath, [scriptPath, "--env", ".env.production"], {
    cwd: root,
    encoding: "utf8",
  });

  assert.match(output, /Launch ready/);
  assert.match(output, /Project identity/);
  assert.match(output, /Production environment/);
  assert.match(output, /Launch content/);
});

test("placeholder launch copy reports its file and count", (t) => {
  const root = createReadyFixture();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  writeFileSync(
    join(root, "apps/web/src/pages/index.astro"),
    "<h1>TODO: Headline</h1>\n<p>TODO: Supporting copy</p>\n",
  );

  const result = spawnSync(process.execPath, [scriptPath, "--env", ".env.production"], {
    cwd: root,
    encoding: "utf8",
  });
  const output = result.stdout + result.stderr;

  assert.equal(result.status, 1);
  assert.match(output, /apps\/web\/src\/pages\/index\.astro contains 2 launch placeholder\(s\)/);
});

test("inconsistent deployment URLs block launch", (t) => {
  const root = createReadyFixture();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const envPath = join(root, ".env.production");
  const env = readFileSync(envPath, "utf8").replace(
    "WEB_URL=https://acme.example",
    "WEB_URL=https://marketing.acme.example",
  );
  writeFileSync(envPath, env);

  const result = spawnSync(process.execPath, [scriptPath, "--env", ".env.production"], {
    cwd: root,
    encoding: "utf8",
  });

  assert.equal(result.status, 1);
  assert.match(result.stdout + result.stderr, /WEB_URL must match project siteUrl/);
});

test("browser deployment URLs must match their server counterparts", (t) => {
  const root = createReadyFixture();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const envPath = join(root, ".env.production");
  const env = readFileSync(envPath, "utf8")
    .replace("VITE_API_URL=https://api.acme.example", "VITE_API_URL=https://api-v2.acme.example")
    .replace(
      "PUBLIC_APP_URL=https://app.acme.example",
      "PUBLIC_APP_URL=https://dashboard.acme.example",
    );
  writeFileSync(envPath, env);

  const result = spawnSync(process.execPath, [scriptPath, "--env", ".env.production"], {
    cwd: root,
    encoding: "utf8",
  });
  const output = result.stdout + result.stderr;

  assert.equal(result.status, 1);
  assert.match(output, /VITE_API_URL must match BETTER_AUTH_URL/);
  assert.match(output, /PUBLIC_APP_URL must match APP_URL/);
});

test("a partially configured integration blocks launch without exposing secrets", (t) => {
  const root = createReadyFixture();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const envPath = join(root, ".env.production");
  writeFileSync(
    envPath,
    `${readFileSync(envPath, "utf8")}STRIPE_SECRET_KEY=sk_live_super-secret-value\n`,
  );

  const result = spawnSync(process.execPath, [scriptPath, "--env", ".env.production"], {
    cwd: root,
    encoding: "utf8",
  });
  const output = result.stdout + result.stderr;

  assert.equal(result.status, 1);
  assert.match(output, /Stripe is partially configured/);
  assert.match(output, /STRIPE_WEBHOOK_SECRET/);
  assert.doesNotMatch(output, /sk_live_super-secret-value/);
});

test("a local database blocks launch", (t) => {
  const root = createReadyFixture();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const envPath = join(root, ".env.production");
  const env = readFileSync(envPath, "utf8").replace("db.acme.example", "localhost");
  writeFileSync(envPath, env);

  const result = spawnSync(process.execPath, [scriptPath, "--env", ".env.production"], {
    cwd: root,
    encoding: "utf8",
  });

  assert.equal(result.status, 1);
  assert.match(result.stdout + result.stderr, /DATABASE_URL must point to a non-local database/);
});

test("all multi-value integrations reject partial configuration", (t) => {
  const root = createReadyFixture();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const envPath = join(root, ".env.production");
  writeFileSync(
    envPath,
    `${readFileSync(envPath, "utf8")}GOOGLE_CLIENT_ID=client-id\nS3_BUCKET=avatars\nGITHUB_OWNER=acme\n`,
  );

  const result = spawnSync(process.execPath, [scriptPath, "--env", ".env.production"], {
    cwd: root,
    encoding: "utf8",
  });
  const output = result.stdout + result.stderr;

  assert.equal(result.status, 1);
  assert.match(output, /Google OAuth is partially configured/);
  assert.match(output, /S3\/R2 is partially configured/);
  assert.match(output, /GitHub feedback is partially configured/);
});

test("a malformed deployment URL is reported as a checklist blocker", (t) => {
  const root = createReadyFixture();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const envPath = join(root, ".env.production");
  const env = readFileSync(envPath, "utf8").replace(
    "WEB_URL=https://acme.example",
    "WEB_URL=not-a-url",
  );
  writeFileSync(envPath, env);

  const result = spawnSync(process.execPath, [scriptPath, "--env", ".env.production"], {
    cwd: root,
    encoding: "utf8",
  });
  const output = result.stdout + result.stderr;

  assert.equal(result.status, 1);
  assert.match(output, /WEB_URL must be a public HTTPS URL/);
  assert.match(output, /Not launch ready/);
  assert.doesNotMatch(output, /Launch check failed/);
});

test("leftover template contact identity blocks launch", (t) => {
  const root = createReadyFixture();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const configPath = join(root, "packages/config/src/project.ts");
  const config = readFileSync(configPath, "utf8").replace(
    "hello@acme.example",
    "noreply@kit.praxor.dev",
  );
  writeFileSync(configPath, config);

  const result = spawnSync(process.execPath, [scriptPath, "--env", ".env.production"], {
    cwd: root,
    encoding: "utf8",
  });

  assert.equal(result.status, 1);
  assert.match(result.stdout + result.stderr, /template email.from/);
});
