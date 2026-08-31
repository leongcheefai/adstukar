import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Octokit } from "@octokit/rest";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RELEASES_DIR = path.resolve(__dirname, "../src/content/releases");

const OWNER = process.env.GITHUB_OWNER;
const REPO = process.env.GITHUB_REPO;
const TOKEN = process.env.GITHUB_TOKEN;

if (!OWNER || !REPO) {
  console.error("Error: GITHUB_OWNER and GITHUB_REPO must be set.");
  process.exit(1);
}

const owner = OWNER;
const repo = REPO;

const octokit = new Octokit(TOKEN ? { auth: TOKEN } : {});

function slugify(tag: string): string {
  return tag
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function yamlStr(value: string): string {
  return JSON.stringify(value);
}

async function fetchAllReleases() {
  const releases = await octokit.paginate(octokit.rest.repos.listReleases, {
    owner,
    repo,
    per_page: 100,
  });
  return releases.filter((r) => !r.draft);
}

async function main() {
  console.log(`Syncing releases from ${owner}/${repo}...`);

  fs.rmSync(RELEASES_DIR, { recursive: true, force: true });
  fs.mkdirSync(RELEASES_DIR, { recursive: true });

  const releases = await fetchAllReleases();
  console.log(`Found ${releases.length} release(s).`);

  for (const release of releases) {
    const slug = slugify(release.tag_name);
    const frontmatter = [
      "---",
      `tag: ${yamlStr(release.tag_name)}`,
      `name: ${yamlStr(release.name ?? release.tag_name)}`,
      `publishedAt: ${new Date(release.published_at ?? release.created_at).toISOString()}`,
      `prerelease: ${release.prerelease}`,
      `url: ${yamlStr(release.html_url)}`,
      "---",
    ].join("\n");

    const body = release.body ?? "";
    const content = `${frontmatter}\n\n${body}\n`;

    fs.writeFileSync(path.join(RELEASES_DIR, `${slug}.md`), content, "utf-8");
    console.log(`  ✓ ${release.tag_name} → ${slug}.md`);
  }

  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
