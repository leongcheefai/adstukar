import { project } from "@repo/config/project";
import { Logo, type LogoProps, cn } from "@repo/ui";
import type { ReactNode } from "react";
import { landingUrl } from "../../lib/landing";

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

/**
 * The lockup as a link to the landing page, in a new tab so the set keeps
 * playing. With no landing page to link to (`landingUrl`), the lockup is only
 * a mark.
 */
export function HomeLink({ className, children }: { className?: string; children: ReactNode }) {
  const href = landingUrl();
  if (!href) return <span className={cn("capy-home", className)}>{children}</span>;
  return (
    <a
      className={cn("capy-home", className)}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${project.name} home page, opens in a new tab`}
    >
      {children}
    </a>
  );
}
