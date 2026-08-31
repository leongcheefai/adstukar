import { project } from "@repo/config/project";

export function orgSchema(siteUrl: URL | string) {
  const origin = typeof siteUrl === "string" ? siteUrl : siteUrl.origin;
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: project.name,
    url: origin,
    logo: `${origin}/favicon.svg`,
    // sameAs: ["TODO: https://twitter.com/...", "TODO: https://github.com/..."],
  };
}

export function websiteSchema(siteUrl: URL | string) {
  const origin = typeof siteUrl === "string" ? siteUrl : siteUrl.origin;
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: project.name,
    url: origin,
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
  title: string;
  description: string;
  date: Date;
  author: string;
  image?: string;
  url: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
    datePublished: post.date.toISOString(),
    author: { "@type": "Person", name: post.author },
    ...(post.image ? { image: post.image } : {}),
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
