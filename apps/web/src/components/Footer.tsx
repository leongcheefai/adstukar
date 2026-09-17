import { project } from "@repo/config/project";
import { Logo } from "@repo/ui";
import { env } from "../lib/env";

const APP_URL = env.PUBLIC_APP_URL;

/* The mark and the one-line promise on the left; titled columns on the right.
   No rules and no second band: the columns are the footer. */
const groups = [
  {
    title: "Product",
    links: [
      { label: "How it works", href: "/#how-it-works" },
      { label: "What a play pays", href: "/#rates" },
      { label: "Advertisers", href: "/#advertisers" },
      { label: "FAQ", href: "/faq" },
      { label: "Blog", href: "/blog" },
    ],
  },
  {
    title: "Members",
    links: [
      { label: "Sign in", href: `${APP_URL}/login` },
      { label: "Join free", href: `${APP_URL}/signup` },
      { label: "Start a campaign", href: `${APP_URL}/signup` },
      { label: "Support", href: `mailto:${project.email.support}` },
    ],
  },
  {
    title: "Policies",
    links: [
      { label: "Terms of service", href: "/terms" },
      { label: "Privacy policy", href: "/privacy" },
      { label: "Ads policy", href: "/ads-policy" },
      { label: "Cookie policy", href: "/cookies" },
      { label: "Refund policy", href: "/refund" },
      { label: "Security", href: "/security" },
    ],
  },
] as const;

const year = new Date().getFullYear();

export default function Footer() {
  return (
    <footer>
      <div className="mx-auto max-w-6xl px-6 pt-20 pb-12 sm:pt-24 sm:pb-14">
        <div className="grid gap-14 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-5">
            <a
              href="/"
              aria-label={project.name}
              className="inline-flex text-primary transition-opacity duration-150 ease-out hover:opacity-80"
            >
              <Logo size={80} aria-hidden="true" />
            </a>
          </div>

          <nav
            aria-label="Footer"
            className="grid grid-cols-2 gap-x-8 gap-y-12 sm:grid-cols-3 lg:col-span-7"
          >
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
