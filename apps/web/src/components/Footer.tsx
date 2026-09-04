import { project } from "@repo/config/project";
import { Logo, Footer as UIFooter } from "@repo/ui";

const groups = [
  {
    title: "Product",
    links: [
      { label: "How it works", href: "/#how-it-works" },
      { label: "Who earns", href: "/#where" },
      { label: "Credits", href: "/#credits" },
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
        logo: <Logo size={24} />,
      }}
      groups={groups}
    />
  );
}
