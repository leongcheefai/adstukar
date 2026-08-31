import { Octokit } from "@octokit/rest";
import type { FeedbackType } from "@repo/contracts";
import { serverEnv } from "@repo/env";

let _octokit: Octokit | null = null;

type GithubConfig = { octokit: Octokit; owner: string; repo: string };

function getGithubConfig(): GithubConfig | null {
  const { GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO } = serverEnv;
  if (!GITHUB_TOKEN || !GITHUB_OWNER || !GITHUB_REPO) return null;
  if (!_octokit) _octokit = new Octokit({ auth: GITHUB_TOKEN });
  return { octokit: _octokit, owner: GITHUB_OWNER, repo: GITHUB_REPO };
}

type FeedbackIssueInput = {
  id: string;
  type: FeedbackType;
  message: string;
  userId: string;
  userEmail: string;
};

export async function listGithubReleases() {
  const config = getGithubConfig();
  if (!config) return null;
  const releases = await config.octokit.paginate(config.octokit.rest.repos.listReleases, {
    owner: config.owner,
    repo: config.repo,
    per_page: 100,
  });
  return releases.filter((r) => !r.draft);
}

export async function createFeedbackIssue(input: FeedbackIssueInput) {
  const config = getGithubConfig();
  if (!config) return null; // feature flag off — GITHUB_TOKEN/OWNER/REPO not set

  const shortId = input.id.slice(0, 8);
  const title = `Feedback: ${input.type} (${shortId})`;
  const body = [
    `**From:** ${input.userEmail} (\`${input.userId}\`)`,
    `**Type:** ${input.type}`,
    `**Feedback ID:** \`${input.id}\``,
    "",
    "---",
    "",
    input.message,
  ].join("\n");

  const { data } = await config.octokit.rest.issues.create({
    owner: config.owner,
    repo: config.repo,
    title,
    body,
  });
  return data;
}
