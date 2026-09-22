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

/** The `<title>` of one page: the page, then the product. The home page is the one exception and leads with the product. */
export function pageTitle(name: string): string {
  return `${name} | ${project.name}`;
}

export const MARKETING_PAGES: MarketingPage[] = [
  {
    slug: "home",
    path: "/",
    title: `${project.name} | Play and earn`,
    description:
      "Play ads on a screen while you listen or watch, and earn money. Advertisers see every play.",
  },
  {
    slug: "blog",
    path: "/blog",
    title: pageTitle("Blog"),
    description: `Insights, updates, and tutorials from the ${project.name} team.`,
  },
  {
    slug: "help",
    path: "/help",
    title: pageTitle("Help Center"),
    description: `How to use ${project.name}: the dashboard, CapyChannel, advertising, and money.`,
  },
  {
    slug: "terms",
    path: "/terms",
    title: pageTitle("Terms of Service"),
    description: `Terms of Service for ${project.name}.`,
  },
  {
    slug: "privacy",
    path: "/privacy",
    title: pageTitle("Privacy Policy"),
    description: `Privacy Policy for ${project.name}.`,
  },
  {
    slug: "ads-policy",
    path: "/ads-policy",
    title: pageTitle("Ads Policy"),
    description: `Creative and campaign rules for listings on ${project.name}.`,
  },
  {
    slug: "cookies",
    path: "/cookies",
    title: pageTitle("Cookie Policy"),
    description: `Cookie Policy for ${project.name}.`,
  },
  {
    slug: "refund",
    path: "/refund",
    title: pageTitle("Refund Policy"),
    description: `Refund Policy for ${project.name}.`,
  },
  {
    slug: "dpa",
    path: "/dpa",
    title: pageTitle("Data Processing Agreement"),
    description: `Data Processing Agreement for ${project.name}.`,
  },
  {
    slug: "security",
    path: "/security",
    title: pageTitle("Security"),
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
