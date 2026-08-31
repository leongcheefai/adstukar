import { project } from "@repo/config/project";

export interface MarketingPage {
  slug: string;
  path: string;
  title: string;
  description: string;
  ogTitle?: string;
  ogDescription?: string;
  inSitemap?: boolean;
}

export const MARKETING_PAGES: MarketingPage[] = [
  {
    slug: "home",
    path: "/",
    title: `${project.name} — ${project.tagline}`,
    description:
      "A cross-promotion ad exchange for indie hackers. Show one small sponsored card on your site and earn points to show your product on other members' sites. No money moves.",
  },
  {
    slug: "blog",
    path: "/blog",
    title: `Blog — ${project.name}`,
    description: `Insights, updates, and tutorials from the ${project.name} team.`,
  },
  {
    slug: "releases",
    path: "/releases",
    title: `Releases — ${project.name}`,
    description: `What's new in ${project.name}. Release notes, improvements, and changelog.`,
  },
  {
    slug: "faq",
    path: "/faq",
    title: `FAQ — ${project.name}`,
    description: `How ${project.name} points, verified impressions, moderation, and the embed snippet work.`,
  },
  {
    slug: "terms",
    path: "/terms",
    title: `Terms of Service — ${project.name}`,
    description: `Terms of Service for ${project.name}.`,
  },
  {
    slug: "privacy",
    path: "/privacy",
    title: `Privacy Policy — ${project.name}`,
    description: `Privacy Policy for ${project.name}.`,
  },
  {
    slug: "cookies",
    path: "/cookies",
    title: `Cookie Policy — ${project.name}`,
    description: `Cookie Policy for ${project.name}.`,
  },
  {
    slug: "refund",
    path: "/refund",
    title: `Refund Policy — ${project.name}`,
    description: `Refund Policy for ${project.name}.`,
  },
  {
    slug: "dpa",
    path: "/dpa",
    title: `Data Processing Agreement — ${project.name}`,
    description: `Data Processing Agreement for ${project.name}.`,
  },
  {
    slug: "security",
    path: "/security",
    title: `Security — ${project.name}`,
    description: `How ${project.name} protects member accounts and keeps the embed snippet free of tracking.`,
  },
];

export function getPageBySlug(slug: string): MarketingPage | undefined {
  return MARKETING_PAGES.find((p) => p.slug === slug);
}

export function getPageByPath(path: string): MarketingPage | undefined {
  return MARKETING_PAGES.find((p) => p.path === path);
}

/** Like getPageBySlug but throws at runtime if the slug is not in MARKETING_PAGES. */
export function requirePage(slug: string): MarketingPage {
  const page = getPageBySlug(slug);
  if (!page) {
    throw new Error(`[pages] slug "${slug}" not found in MARKETING_PAGES`);
  }
  return page;
}
