import { earnPerPlay, economy } from "@repo/config/economy";
import { perThousandPlays } from "@repo/config/money";
import { project } from "@repo/config/project";

function originOf(siteUrl: URL | string): string {
  return typeof siteUrl === "string" ? new URL(siteUrl).origin : siteUrl.origin;
}

/** The one node every other schema points at, so a crawler reads one publisher, not several. */
function orgId(origin: string): string {
  return `${origin}/#organization`;
}

function websiteId(origin: string): string {
  return `${origin}/#website`;
}

export function orgSchema(siteUrl: URL | string) {
  const origin = originOf(siteUrl);
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": orgId(origin),
    name: project.name,
    url: origin,
    description: project.description,
    slogan: project.tagline,
    email: project.email.support,
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      email: project.email.support,
      availableLanguage: ["en"],
    },
    knowsAbout: ["Digital signage advertising", "Screen advertising", "Venue advertising"],
    // A raster logo: Google does not read an SVG here. `src/pages/logo.png.ts` draws it.
    logo: { "@type": "ImageObject", url: `${origin}/logo.png`, width: 512, height: 512 },
    // sameAs: ["TODO: https://twitter.com/...", "TODO: https://github.com/..."],
  };
}

export function websiteSchema(siteUrl: URL | string) {
  const origin = originOf(siteUrl);
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": websiteId(origin),
    name: project.name,
    url: origin,
    description: project.tagline,
    inLanguage: "en",
    publisher: { "@id": orgId(origin) },
  };
}

/**
 * The page itself, tied to the site and the publisher, so an engine reads each
 * page as part of one graph. `dateModified` is the last commit on its sources.
 */
export function webPageSchema(page: {
  url: string;
  title: string;
  description: string;
  image: string;
  modified?: string;
  site: URL | string;
}) {
  const origin = originOf(page.site);
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${page.url}#webpage`,
    url: page.url,
    name: page.title,
    description: page.description,
    inLanguage: "en",
    isPartOf: { "@id": websiteId(origin) },
    publisher: { "@id": orgId(origin) },
    primaryImageOfPage: { "@type": "ImageObject", url: page.image, width: 1200, height: 630 },
    ...(page.modified ? { dateModified: page.modified } : {}),
  };
}

/**
 * CapyTV, the screen app a venue opens to earn. It is free to run: the screen
 * is paid, it never pays. Every figure comes from `@repo/config/economy`.
 */
export function screenAppSchema(siteUrl: URL | string) {
  const origin = originOf(siteUrl);
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "@id": `${origin}/#capytv`,
    name: "CapyTV",
    applicationCategory: "MultimediaApplication",
    operatingSystem: "Any (runs in a web browser)",
    browserRequirements: "A current web browser. No install, no camera, no microphone.",
    description: `The ${project.name} screen app. Open it in a browser on a TV, monitor, tablet, or laptop, play music or video, and earn ${perThousandPlays(earnPerPlay())} while listings run along the foot of the picture.`,
    url: origin,
    isAccessibleForFree: true,
    offers: { "@type": "Offer", price: 0, priceCurrency: "USD" },
    publisher: { "@id": orgId(origin) },
  };
}

/** What an advertiser buys: one slot on the ring, at one flat price for one term. */
export function slotServiceSchema(siteUrl: URL | string) {
  const origin = originOf(siteUrl);
  const { count, priceUsdCents, termDays } = economy.slot;
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": `${origin}/#ad-slot`,
    name: `${project.name} ad slot`,
    serviceType: "Digital signage advertising",
    description: `One of ${count} slots on the ${project.name} ticker. The slot plays your brand on every approved screen in the network for ${termDays} days, at one flat price with no per-play bill. A person reviews every listing before it plays.`,
    provider: { "@id": orgId(origin) },
    offers: {
      "@type": "Offer",
      price: (priceUsdCents / 100).toFixed(2),
      priceCurrency: "USD",
      description: `${termDays}-day slot term`,
      url: `${origin}/#advertisers`,
    },
  };
}

export function faqSchema(items: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((i) => ({
      "@type": "Question",
      name: i.question,
      acceptedAnswer: { "@type": "Answer", text: i.answer },
    })),
  };
}

export function articleSchema(post: {
  /** `TechArticle` for a help topic, `Article` for a blog post. */
  type?: "Article" | "TechArticle";
  title: string;
  description: string;
  date?: Date;
  modified?: string;
  author?: string;
  image: string;
  url: string;
  site: URL | string;
}) {
  const origin = originOf(post.site);
  return {
    "@context": "https://schema.org",
    "@type": post.type ?? "Article",
    headline: post.title,
    description: post.description,
    ...(post.date ? { datePublished: post.date.toISOString() } : {}),
    ...(post.modified ? { dateModified: post.modified } : {}),
    author: post.author ? { "@type": "Person", name: post.author } : { "@id": orgId(origin) },
    publisher: { "@id": orgId(origin) },
    image: post.image,
    inLanguage: "en",
    mainEntityOfPage: post.url,
  };
}

export function breadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: it.url,
    })),
  };
}

/** An ordered list of links, such as the help topics on the help home. */
export function itemListSchema(name: string, items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      url: it.url,
    })),
  };
}
