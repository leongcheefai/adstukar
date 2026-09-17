import { project } from "@repo/config/project";
import { Logo, type LogoProps, cn } from "@repo/ui";

/**
 * The brand lockup, sized from CSS. The wordmark and the capybara take
 * `currentColor`: white on the dark grounds of the set, the brand blue on the
 * light ground of the dashboard. The ON AIR pill is orange on both, and
 * `variant="off-air"` leaves it out.
 */
export function CapyLockup({
  className,
  inverted = true,
  variant = "full",
}: {
  className?: string;
  inverted?: boolean;
  variant?: LogoProps["variant"];
}) {
  return (
    <Logo
      variant={variant}
      className={cn(
        "capy-logo",
        inverted ? "text-white" : "text-[color:var(--brand-500)]",
        className,
      )}
      aria-label={project.name}
    />
  );
}
