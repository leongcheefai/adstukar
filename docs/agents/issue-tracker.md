# Issue tracker: Linear

Issues and PRDs for this repo live in Linear. Use the Linear MCP server (`mcp__linear-server__*` tools) for all operations. Do not use `gh issue`.

## Scope

- **Team**: `KEV` (name `Kevin&cf`, id `960f91c6-cfaf-495a-a490-b3f434ea0dd4`)
- **Project**: `CapyTV` (id `c3a9bb95-d448-4b45-bfdc-c0c89edb216f`)

Every issue a skill creates goes to this team and this project. When a skill reads or lists issues, filter by this team and this project.

## Conventions

- **Create an issue**: `save_issue` with `team`, `project`, `title`, and a Markdown `description`. Put a PRD or a spec in the description, not in a comment.
- **Read an issue**: `get_issue` by identifier (for example `KEV-42`), then `list_comments` for the thread.
- **List issues**: `list_issues` filtered by `team` and `project`, with `state` and `label` filters as the skill needs.
- **Comment on an issue**: `save_comment` with the issue id and a Markdown `body`.
- **Apply / remove labels**: `save_issue` with the issue `id` and the new `labels` list. Read the current labels first, then send the full list back.
- **Close**: `save_issue` with the issue `id` and the `state` set to `Done`, or `Canceled` for a `wontfix`. Add a closing comment first.

If the Linear MCP server is not connected, stop and ask the user to connect it. Do not fall back to another tracker.

## Pull requests as a triage surface

**PRs as a request surface: no.** _(Set to `yes` if this repo treats external PRs as feature requests; `/triage` reads this flag.)_

When set to `yes`, external PRs on GitHub still enter the triage queue, but the record of the decision lives in Linear:

- **Read a PR**: `gh pr view <number> --comments` and `gh pr diff <number>` for the diff.
- **List external PRs for triage**: `gh pr list --state open --json number,title,body,labels,author,authorAssociation,comments` then keep only `authorAssociation` of `CONTRIBUTOR`, `FIRST_TIME_CONTRIBUTOR`, or `NONE`.
- **Record the decision**: create a Linear issue that links the PR URL, then apply the triage label to the Linear issue.

## When a skill says "publish to the issue tracker"

Create a Linear issue in the team and project above.

## When a skill says "fetch the relevant ticket"

Call `get_issue` with the identifier, then `list_comments`.

## Wayfinding operations

Used by `/wayfinder`. The **map** is a single issue with **child** issues as tickets.

- **Map**: a single issue labelled `wayfinder:map`, holding the Notes / Decisions-so-far / Fog body.
- **Child ticket**: a sub-issue of the map (`save_issue` with `parent` set to the map). Labels: `wayfinder:<type>` (`research`/`prototype`/`grilling`/`task`). Once claimed, the ticket is assigned to the driving dev.
- **Blocking**: Linear's native `blocked by` relation. Add it with the issue relation tool on the child, pointing at the blocker. A ticket is unblocked when every blocker is `Done` or `Canceled`.
- **Frontier query**: list the map's open sub-issues, drop any with an open blocker or an assignee; first in map order wins.
- **Claim**: `save_issue` with `assignee` set to `me` — the session's first write.
- **Resolve**: `save_comment` with the answer, `save_issue` with the state `Done`, then append a context pointer to the map's Decisions-so-far.
