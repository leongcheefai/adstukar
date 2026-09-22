import { Container, Section } from "@repo/ui";
import type { FaqEntry } from "../../lib/faq";

/** One question, as a native disclosure: it works before any script and without one. */
function FaqItem({ item }: { item: FaqEntry }) {
  return (
    <details className="faq-item">
      <summary className="faq-q">
        <span>{item.question}</span>
        <svg viewBox="0 0 24 24" aria-hidden="true" className="faq-plus">
          <path d="M12 5v14M5 12h14" />
        </svg>
      </summary>
      <p className="faq-a">{item.answer}</p>
    </details>
  );
}

/**
 * The landing page's questions: one word of title, then the list. No groups,
 * no ledes, no link: the nav and the footer already point at the help centre.
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
