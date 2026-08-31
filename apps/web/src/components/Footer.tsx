import { project } from "@repo/config/project";
import { Footer as UIFooter } from "@repo/ui";
import { NewsletterForm } from "./NewsletterForm";

const groups = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "/#features" },
      { label: "Pricing", href: "/pricing" },
      { label: "Customers", href: "/customers" },
      { label: "Blog", href: "/blog" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "FAQ", href: "/faq" },
      { label: "Security", href: "/security" },
      { label: "Contact", href: `mailto:${project.email.support}` },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "TODO: Docs", href: "/docs" },
      { label: "RSS", href: "/rss.xml" },
      { label: "Releases", href: "/releases" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Terms of Service", href: "/terms" },
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Cookie Policy", href: "/cookies" },
      { label: "Refund Policy", href: "/refund" },
      { label: "DPA", href: "/dpa" },
    ],
  },
];

export default function Footer() {
  return (
    <UIFooter
      brand={{
        name: project.name,
        tagline: project.tagline,
        href: "/",
      }}
      groups={groups}
      newsletter={<NewsletterForm />}
    />
  );
}
