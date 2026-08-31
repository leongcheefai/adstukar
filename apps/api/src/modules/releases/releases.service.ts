import { db, schema } from "@repo/db";
import { desc } from "drizzle-orm";
import { listGithubReleases } from "../../lib/github";
import { log } from "../../lib/logger";

export async function listReleases() {
  return db.select().from(schema.release).orderBy(desc(schema.release.publishedAt));
}

export async function syncReleases() {
  let releases: Awaited<ReturnType<typeof listGithubReleases>>;
  try {
    releases = await listGithubReleases();
  } catch (err) {
    log("warn", "github_releases_fetch_failed", { err: String(err) });
    return { synced: 0 };
  }

  if (!releases) {
    log("warn", "github_releases_skipped", { reason: "GitHub config not set" });
    return { synced: 0 };
  }

  for (const r of releases) {
    await db
      .insert(schema.release)
      .values({
        id: String(r.id),
        tag: r.tag_name,
        name: r.name ?? r.tag_name,
        body: r.body ?? null,
        url: r.html_url,
        prerelease: r.prerelease,
        publishedAt: r.published_at ? new Date(r.published_at) : null,
      })
      .onConflictDoUpdate({
        target: schema.release.id,
        set: {
          tag: r.tag_name,
          name: r.name ?? r.tag_name,
          body: r.body ?? null,
          url: r.html_url,
          prerelease: r.prerelease,
          publishedAt: r.published_at ? new Date(r.published_at) : null,
          syncedAt: new Date(),
        },
      });
  }

  return { synced: releases.length };
}
