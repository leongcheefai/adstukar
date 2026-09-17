import { Container, Section } from "@repo/ui";
import type { FaqEntry } from "../../lib/faq";
import { FaqItem } from "./FaqSections";

/**
 * The landing page's questions: one word of title, then the list. No groups,
 * no ledes, no link: the footer already points at the FAQ page.
 */
export function Faq({
  items,
  spacing = "default",
  className,
}: {
  items: FaqEntry[];
  spacing?: "tight" | "default" | "loose";
  className?: string;
}) {
  return (
    <Section id="faq" spacing={spacing} className={className}>
      <Container size="prose">
        <h2 className="landing-title">FAQ</h2>
        <div className="faq-list">
          {items.map((item) => (
            <FaqItem key={item.question} item={item} />
          ))}
        </div>
      </Container>
    </Section>
  );
}
