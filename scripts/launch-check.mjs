#!/usr/bin/env node

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { extname, join, relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const DEFAULT_ENV_FILE = ".env";
const PROJECT_CONFIG = "packages/config/src/project.ts";
const CONTENT_ROOT = "apps/web/src";
const CONTENT_EXTENSIONS = new Set([".astro", ".md", ".mdx", ".ts", ".tsx"]);
const PLACEHOLDER_PATTERN = /\bTODO:\s*|\blorem ipsum\b/gi;
const TEMPLATE_IDENTITY = {
  name: "Praxor Kit",
  slug: "praxor-kit",
  tagline: "Ship paid SaaS faster, without lock-in.",
  description:
    "A production-ready SaaS foundation with authentication, billing, email, and a dashboard.",
  siteUrl: "https://kit.praxor.dev",
  email: {
    from: "noreply@kit.praxor.dev",
    support: "support@praxor.dev",
  },
};
const HELP = `Launch-readiness checker

Usage: node scripts/launch-check.mjs [--env <path>]

Checks project identity, production environment values, launch content, and
integration configuration without starting services or printing secrets.

Options:
  --env <path>  Environment file to check (default: .env)
  -h, --help    Show this help message
`;

function parseArgs(args) {
  if (args.includes("--help") || args.includes("-h")) return { help: true };

  let envFile = DEFAULT_ENV_FILE;
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg !== "--env") throw new Error(`Unknown option: ${arg}. Run with --help for usage.`);
    const value = args[index + 1];
    if (!value || value.startsWith("-")) throw new Error("--env requires a file path.");
    envFile = value;
    index += 1;
  }
  return { envFile, help: false };
}

function parseEnv(contents) {
  const values = {};
  for (const line of contents.split(/\r?\n/)) {
    const match = line.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)?$/);
    if (!match) continue;
    let value = match[2]?.trim() ?? "";
    if (
      value.length >= 2 &&
      ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'")))
    ) {
      value = value.slice(1, -1);
    } else {
      value = value.replace(/\s+#.*$/, "").trim();
    }
    values[match[1]] = value;
  }
  return values;
}

function isProductionUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !["localhost", "127.0.0.1", "::1"].includes(url.hostname);
  } catch {
    return false;
  }
}

function urlsMatch(left, right) {
  try {
    return new URL(left).href === new URL(right).href;
  } catch {
    return false;
  }
}

/**
 * The site a URL belongs to, for the cookie rules: its last two host labels.
 * A browser treats a cookie from another site as third-party and may drop it.
 * Two labels is right for `.com`, `.site` and `.up.railway.app` style hosts;
 * a suffix like `.co.uk` needs three, and would read as one site here.
 */
function siteOf(value) {
  try {
    return new URL(value).hostname.split(".").slice(-2).join(".");
  } catch {
    return null;
  }
}

function isNonLocalDatabaseUrl(value) {
  try {
    const url = new URL(value);
    return (
      ["postgres:", "postgresql:"].includes(url.protocol) &&
      !["localhost", "127.0.0.1", "::1"].includes(url.hostname)
    );
  } catch {
    return false;
  }
}

function checkCompleteGroup(env, label, names) {
  const configured = names.filter((name) => Boolean(env[name]));
  if (configured.length === 0 || configured.length === names.length) return [];
  const missing = names.filter((name) => !env[name]);
  return [`${label} is partially configured; missing ${missing.join(", ")}.`];
}

function checkMatchingUrls(env, source, targets) {
  if (!isProductionUrl(env[source])) return [];
  return targets
    .filter((target) => isProductionUrl(env[target]) && !urlsMatch(env[target], env[source]))
    .map((target) => `${target} must match ${source}.`);
}

function walkFiles(directory) {
  if (!existsSync(directory)) return [];
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? walkFiles(path) : [path];
  });
}

async function loadProject(root) {
  const configPath = join(root, PROJECT_CONFIG);
  if (!existsSync(configPath)) return { error: `Missing ${PROJECT_CONFIG}.`, project: null };

  try {
    const { project } = await import(
      `${pathToFileURL(configPath).href}?launch-check=${Date.now()}`
    );
    return { error: null, project };
  } catch {
    return {
      error: `Could not load ${PROJECT_CONFIG}. Run pnpm typecheck for details.`,
      project: null,
    };
  }
}

function checkIdentity(project, loadError) {
  if (loadError) return [loadError];
  const errors = [];
  for (const field of ["name", "slug", "tagline", "description", "siteUrl"]) {
    if (typeof project?.[field] !== "string" || project[field].trim() === "") {
      errors.push(`Project identity field "${field}" is empty.`);
    }
  }
  for (const [field, templateValue] of Object.entries(TEMPLATE_IDENTITY)) {
    if (field === "email") continue;
    if (project?.[field] === templateValue)
      errors.push(`Project identity still uses the template ${field}.`);
  }
  if (!isProductionUrl(project?.siteUrl)) {
    errors.push("Project siteUrl must be a public HTTPS URL.");
  }
  for (const field of ["from", "support"]) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(project?.email?.[field] ?? "")) {
      errors.push(`Project email.${field} must be a valid email address.`);
    }
    if (project?.email?.[field] === TEMPLATE_IDENTITY.email[field]) {
      errors.push(`Project identity still uses the template email.${field}.`);
    }
  }
  return errors;
}

function checkEnvironment(root, envFile, project) {
  const path = resolve(root, envFile);
  if (!existsSync(path)) return [`Environment file not found: ${envFile}.`];

  const env = parseEnv(readFileSync(path, "utf8"));
  const errors = [];
  if (env.NODE_ENV !== "production") errors.push("NODE_ENV must be production.");
  if (!isNonLocalDatabaseUrl(env.DATABASE_URL)) {
    errors.push("DATABASE_URL must point to a non-local database.");
  }
  if (!env.BETTER_AUTH_SECRET || env.BETTER_AUTH_SECRET.length < 32) {
    errors.push("BETTER_AUTH_SECRET must contain at least 32 characters.");
  } else if (/change-me|example|replace|secret/i.test(env.BETTER_AUTH_SECRET)) {
    errors.push("BETTER_AUTH_SECRET still looks like a placeholder.");
  }

  for (const name of [
    "BETTER_AUTH_URL",
    "APP_URL",
    "WEB_URL",
    "VITE_API_URL",
    "VITE_WEB_URL",
    "PUBLIC_APP_URL",
    "PUBLIC_API_URL",
  ]) {
    if (!isProductionUrl(env[name])) errors.push(`${name} must be a public HTTPS URL.`);
  }
  if (
    isProductionUrl(project?.siteUrl) &&
    isProductionUrl(env.WEB_URL) &&
    !urlsMatch(env.WEB_URL, project.siteUrl)
  ) {
    errors.push("WEB_URL must match project siteUrl.");
  }
  // The app sends a signed-out visitor to WEB_URL. On one origin that is a loop.
  if (
    isProductionUrl(env.APP_URL) &&
    isProductionUrl(env.WEB_URL) &&
    new URL(env.APP_URL).origin === new URL(env.WEB_URL).origin
  ) {
    errors.push("APP_URL and WEB_URL must be different hosts, such as app.<site> and <site>.");
  }
  // The session cookie is set by the API. On another site it is third-party,
  // and a browser that blocks those signs the member in and drops the session.
  if (
    isProductionUrl(env.BETTER_AUTH_URL) &&
    isProductionUrl(env.APP_URL) &&
    siteOf(env.BETTER_AUTH_URL) !== siteOf(env.APP_URL)
  ) {
    errors.push(
      `BETTER_AUTH_URL must be on the same site as APP_URL (${siteOf(env.APP_URL)}), such as api.${siteOf(env.APP_URL)}.`,
    );
  }
  errors.push(
    ...checkMatchingUrls(env, "BETTER_AUTH_URL", ["VITE_API_URL", "PUBLIC_API_URL"]),
    ...checkMatchingUrls(env, "APP_URL", ["PUBLIC_APP_URL"]),
    ...checkMatchingUrls(env, "WEB_URL", ["VITE_WEB_URL"]),
    ...checkCompleteGroup(env, "Google OAuth", ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"]),
    ...checkCompleteGroup(env, "Stripe", ["STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET"]),
    ...checkCompleteGroup(env, "S3/R2", [
      "S3_BUCKET",
      "S3_ACCESS_KEY_ID",
      "S3_SECRET_ACCESS_KEY",
      "S3_PUBLIC_URL",
    ]),
    ...checkCompleteGroup(env, "GitHub feedback", ["GITHUB_TOKEN", "GITHUB_OWNER", "GITHUB_REPO"]),
  );
  return errors;
}

function checkContent(root) {
  const contentRoot = join(root, CONTENT_ROOT);
  if (!existsSync(contentRoot)) return [`Missing ${CONTENT_ROOT}.`];

  const errors = [];
  for (const path of walkFiles(contentRoot)) {
    if (!CONTENT_EXTENSIONS.has(extname(path))) continue;
    const contents = readFileSync(path, "utf8");
    const matches = contents.match(PLACEHOLDER_PATTERN);
    if (matches?.length) {
      errors.push(`${relative(root, path)} contains ${matches.length} launch placeholder(s).`);
    }
  }
  return errors;
}

function printSection(name, errors) {
  if (errors.length === 0) {
    console.log(`✓ ${name}`);
    return;
  }
  console.log(`✗ ${name}`);
  for (const error of errors) console.log(`  - ${error}`);
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    console.log(HELP);
    return;
  }

  const root = process.cwd();
  const { project, error: projectLoadError } = await loadProject(root);
  const sections = [
    ["Project identity", checkIdentity(project, projectLoadError)],
    ["Production environment", checkEnvironment(root, options.envFile, project)],
    ["Launch content", checkContent(root)],
  ];
  const errorCount = sections.reduce((count, [, errors]) => count + errors.length, 0);

  console.log("Launch readiness\n");
  for (const [name, errors] of sections) printSection(name, errors);

  if (errorCount > 0) {
    console.error(`\nNot launch ready: ${errorCount} blocker${errorCount === 1 ? "" : "s"}.`);
    process.exitCode = 1;
    return;
  }
  console.log("\n✓ Launch ready");
}

try {
  await main();
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`\nLaunch check failed: ${message}`);
  process.exitCode = 1;
}
