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
      "TODO: Your marketing site description. Make it compelling and include your key value proposition.",
  },
  {
    slug: "pricing",
    path: "/pricing",
    title: `Pricing — ${project.name}`,
    description: "TODO: Pricing page description. Mention your free tier and key plan benefits.",
    ogDescription: "Simple, transparent pricing for every stage.",
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
    description: `TODO: Frequently asked questions about ${project.name}.`,
  },
  {
    slug: "customers",
    path: "/customers",
    title: `Customers — ${project.name}`,
    description: `TODO: Stories and testimonials from teams using ${project.name}.`,
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
    description: `TODO: How ${project.name} keeps your data safe.`,
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
