import { economy } from "@repo/config/economy";
import { project } from "@repo/config/project";
import { Logo } from "@repo/ui";
import { clipCopy } from "../../lib/slots";

/**
 * The band as the ticker prints it: the mark, the name, and the tagline under
 * it, white on the black bar. The ticker is set in fixed sizes (see
 * `.v-ticker` in capychannel.css), so the same sizes here are the true size
 * and not a scale model: a 32px mark, a 16px name, a 13px tagline.
 */
function Band({
  name,
  tagline,
  logoUrl,
}: {
  name: string;
  tagline: string;
  logoUrl: string | null;
}) {
  return (
    <span className="flex w-[280px] shrink-0 items-center gap-2.5">
      {logoUrl ? (
        <img src={logoUrl} alt="" className="size-8 shrink-0 rounded-sm object-cover" />
      ) : (
        <span
          aria-hidden="true"
          className="flex size-8 shrink-0 items-center justify-center rounded-sm bg-white/20 text-sm font-medium text-white"
        >
          {name.charAt(0).toUpperCase()}
        </span>
      )}
      <span className="min-w-0">
        <span className="block truncate text-base leading-tight text-white">
          {clipCopy(name, economy.slot.nameMaxLength)}
        </span>
        <span className="block truncate text-[13px] leading-tight text-white/70">
          {clipCopy(tagline, economy.slot.taglineMaxLength)}
        </span>
      </span>
    </span>
  );
}

/**
 * What the booking will look like on the ticker, at the size the ticker
 * prints it. The panel holds one band at its full width, so a long name is cut
 * here exactly where the ticker cuts it.
 */
export function SlotPreview({
  name,
  tagline,
  logoUrl,
}: {
  name: string;
  tagline: string;
  logoUrl: string | null;
}) {
  const shownName = name.trim() || "Your brand";
  const shownTagline = tagline.trim() || "One short line about it";

  return (
    <figure>
      {/* The screen. The picture area is a quiet tint: the member looks at
          the bar, and a photograph here would take the eye off it. */}
      <div className="overflow-hidden rounded-lg border bg-neutral-950 shadow-sm">
        <div className="h-24 bg-gradient-to-br from-primary/25 via-primary/10 to-neutral-900" />
        <div className="flex h-[72px] items-center bg-black">
          {/* The blue block of the ticker, with the lockup at the ticker's own
              45px and 20px of blue on both sides. */}
          <span className="flex h-full shrink-0 items-center bg-primary px-5">
            <Logo
              variant="off-air"
              className="h-[45px] w-auto text-white"
              aria-label={project.name}
            />
          </span>
          <div className="flex min-w-0 flex-1 items-center overflow-hidden px-4">
            <Band name={shownName} tagline={shownTagline} logoUrl={logoUrl} />
          </div>
        </div>
      </div>
    </figure>
  );
}
