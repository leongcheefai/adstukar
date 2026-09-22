import { project } from "@repo/config/project";
import { Logo } from "@repo/ui";

/* The mark on the far left; two titled columns on the far right. No rules and
   no second band: the columns are the footer. The site has no session, so
   feedback goes by mail; the dashboard has its own feedback form. */
const groups = [
  {
    title: "Support",
    links: [
      {
        label: "Feedback",
        href: `mailto:${project.email.support}?subject=${encodeURIComponent(`${project.name} feedback`)}`,
      },
      { label: "Help center", href: "/help" },
    ],
  },
  {
    title: "Policies",
    links: [
      { label: "Terms of service", href: "/terms" },
      { label: "Privacy policy", href: "/privacy" },
      { label: "Ads policy", href: "/ads-policy" },
      { label: "Refund policy", href: "/refund" },
    ],
  },
] as const;

const year = new Date().getFullYear();

export default function Footer() {
  return (
    <footer>
      <div className="mx-auto max-w-6xl px-6 pt-20 pb-12 sm:pt-24 sm:pb-14">
        <div className="flex flex-col gap-14 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <a
              href="/"
              aria-label={project.name}
              className="inline-flex text-primary transition-opacity duration-150 ease-out hover:opacity-80"
            >
              <Logo size={80} aria-hidden="true" />
            </a>
          </div>

          <nav aria-label="Footer" className="grid grid-cols-2 gap-x-8 gap-y-12 lg:gap-x-24">
            {groups.map((group) => (
              <div key={group.title}>
                <p className="text-xs font-medium uppercase tracking-[0.12em]">{group.title}</p>
                <ul className="mt-4">
                  {group.links.map((link) => (
                    <li key={link.label}>
                      <a
                        href={link.href}
                        className="flex min-h-11 items-center text-[15px] text-muted-foreground transition-colors duration-150 ease-out hover:text-foreground"
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <p className="mt-16 text-sm text-muted-foreground tabular-nums lg:mt-24">
          © {year} {project.name}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
