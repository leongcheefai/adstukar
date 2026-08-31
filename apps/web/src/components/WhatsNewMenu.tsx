import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@repo/ui";

interface ReleaseItem {
  id: string;
  name: string;
  publishedAt: string;
}

interface WhatsNewMenuProps {
  releases: ReleaseItem[];
}

export function WhatsNewMenu({ releases }: WhatsNewMenuProps) {
  if (releases.length === 0) {
    return (
      <a
        href="/releases"
        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        Releases
      </a>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="text-sm text-muted-foreground transition-colors hover:text-foreground outline-none">
        What&apos;s new
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64" align="start">
        <DropdownMenuLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-2 py-1.5">
          What&apos;s new?
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {releases.map((release) => (
          <DropdownMenuItem key={release.id} asChild>
            <a href={`/releases/${release.id}`} className="flex flex-col items-start gap-0.5">
              <span className="font-medium">{release.name}</span>
              <span className="text-xs text-muted-foreground">
                {new Date(release.publishedAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </span>
            </a>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <a href="/releases" className="text-sm font-medium">
            View all releases →
          </a>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
