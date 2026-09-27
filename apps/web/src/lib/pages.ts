import { project } from "@repo/config/project";

export interface MarketingPage {
  slug: string;
  path: string;
  title: string;
  description: string;
  ogTitle?: string;
  ogDescription?: string;
  /** `false` for a page that exists but says nothing yet: it carries `noindex`, and the sitemap leaves it out. */
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
    title: `${project.name} | Earn money from ads on your screen`,
    description:
      "Turn any screen in your venue into income. Play ads over music or video in a web browser and earn a fixed rate per play. Advertisers book one flat-price slot that plays on every screen.",
  },
  {
    slug: "blog",
    path: "/blog",
    title: pageTitle("Blog"),
    description: `News, guides, and updates on screen advertising from the ${project.name} team.`,
  },
  {
    slug: "help",
    path: "/help",
    title: pageTitle("Help Center"),
    description: `How to use ${project.name}: set up a screen with CapyTV, book an ad slot, add funds, and cash out what your screen earns.`,
  },
  {
    slug: "terms",
    path: "/terms",
    title: pageTitle("Terms of Service"),
    description: `The terms that govern the ${project.name} screen ad network, for screen owners and advertisers.`,
  },
  {
    slug: "privacy",
    path: "/privacy",
    title: pageTitle("Privacy Policy"),
    description: `What personal data ${project.name} collects, why, and how you can control it. CapyTV has no camera, no microphone, and no audience measurement.`,
  },
  {
    slug: "ads-policy",
    path: "/ads-policy",
    title: pageTitle("Ads Policy"),
    description: `What an ad on ${project.name} may show: the creative and campaign rules every listing is reviewed against before it plays.`,
  },
  {
    slug: "cookies",
    path: "/cookies",
    title: pageTitle("Cookie Policy"),
    description: `The cookies and browser storage ${project.name} uses: only what sign-in and the screens need, and no analytics or tracking.`,
  },
  {
    slug: "refund",
    path: "/refund",
    title: pageTitle("Refund Policy"),
    description: `How a top-up on ${project.name} is refunded: what comes back, within how long, and how to ask.`,
  },
  {
    slug: "dpa",
    path: "/dpa",
    title: pageTitle("Data Processing Agreement"),
    description: `Data Processing Agreement for ${project.name}.`,
    // Still the template's TODO text. Index it when it has copy.
    inSitemap: false,
  },
  {
    slug: "security",
    path: "/security",
    title: pageTitle("Security"),
    description: `How ${project.name} protects member accounts, payments, and screens, and how to report a security problem.`,
    // Holds open [TBD] items (backups, encryption at rest, access). Index it when they are answered.
    inSitemap: false,
  },
];

/** A page to keep out of search: the robots meta and the sitemap both read this. */
export function isHidden(page: MarketingPage): boolean {
  return page.inSitemap === false;
}

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
