import { project } from "@repo/config/project";

function originOf(siteUrl: URL | string): string {
  return typeof siteUrl === "string" ? new URL(siteUrl).origin : siteUrl.origin;
}

/** The one node every other schema points at, so a crawler reads one publisher, not several. */
function orgId(origin: string): string {
  return `${origin}/#organization`;
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
    email: project.email.support,
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
    "@id": `${origin}/#website`,
    name: project.name,
    url: origin,
    description: project.tagline,
    inLanguage: "en",
    publisher: { "@id": orgId(origin) },
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
