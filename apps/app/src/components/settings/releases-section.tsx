import { ArrowsClockwise } from "@phosphor-icons/react";
import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from "@repo/ui";
import { useReleases, useSyncReleases } from "../../lib/releases";

export function ReleasesSection() {
  const { data: releases, isLoading } = useReleases();
  const sync = useSyncReleases();

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button onClick={() => sync.mutate()} disabled={sync.isPending} size="sm">
          <ArrowsClockwise size={14} className={sync.isPending ? "animate-spin" : ""} />
          {sync.isPending ? "Pulling…" : "Pull from GitHub"}
        </Button>
      </div>

      {sync.isSuccess && (
        <p className="text-sm text-muted-foreground">
          Synced {sync.data.synced} release{sync.data.synced !== 1 ? "s" : ""}.
        </p>
      )}
      {sync.isError && (
        <p className="text-sm text-destructive">Sync failed. Check GitHub configuration.</p>
      )}

      {isLoading && <p className="text-sm text-muted-foreground">Loading releases…</p>}

      {releases && releases.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No releases yet. Click "Pull from GitHub" to sync.
        </p>
      )}

      <div className="space-y-3">
        {releases?.map((release) => (
          <Card key={release.id}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between gap-3">
                <CardTitle className="text-base font-medium">{release.name}</CardTitle>
                <div className="flex shrink-0 items-center gap-2">
                  {release.prerelease && <Badge variant="secondary">Pre-release</Badge>}
                  <Badge variant="outline">{release.tag}</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between gap-4">
                <p className="text-xs text-muted-foreground">
                  {release.publishedAt
                    ? new Date(release.publishedAt).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })
                    : "—"}
                </p>
                <a
                  href={release.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-muted-foreground underline-offset-4 hover:underline"
                >
                  View on GitHub ↗
                </a>
              </div>
              {release.body && (
                <p className="mt-2 line-clamp-3 whitespace-pre-wrap text-xs text-muted-foreground">
                  {release.body}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
