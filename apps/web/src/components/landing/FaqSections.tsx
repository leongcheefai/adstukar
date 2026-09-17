import { Container, Section, SectionHeader } from "@repo/ui";
import { ArrowRight } from "lucide-react";
import { type FaqEntry, type FaqGroup, faqGroupHref } from "../../lib/faq";

/** One question, as a native disclosure: it works before any script and without one. */
export function FaqItem({ item }: { item: FaqEntry }) {
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
 * One block per group: the group's name and lede on the left, its questions
 * on the right. `full` prints the whole group (the FAQ page); otherwise the
 * block ends in a link to the rest. The landing page uses the flat `Faq`
 * instead.
 */
export function FaqSections({
  groups,
  full = false,
  nav = false,
  totals,
  spacing = "default",
  className,
  id = "faq",
  eyebrow = "Questions",
  headline = "Questions and answers",
  headingAs = "h2",
  lede,
}: {
  groups: FaqGroup[];
  full?: boolean;
  /** A row of chips under the header, one per group, for the full page. */
  nav?: boolean;
  /** Group id → total question count, for the "all questions" link. */
  totals?: Record<string, number>;
  spacing?: "tight" | "default" | "loose";
  className?: string;
  id?: string;
  eyebrow?: string;
  headline?: string;
  headingAs?: "h1" | "h2";
  lede?: string;
}) {
  // The page's h1 takes the group titles down a level with it.
  const GroupHeading = headingAs === "h1" ? "h2" : "h3";
  return (
    <Section id={id} spacing={spacing} className={className}>
      <Container>
        <SectionHeader eyebrow={eyebrow} headline={headline} lede={lede} as={headingAs} />
        {nav && (
          <nav className="faq-nav" aria-label="Question groups">
            {groups.map((group) => (
              <a key={group.id} href={`#${group.id}`}>
                {group.title}
              </a>
            ))}
          </nav>
        )}
        <div className="faq-groups">
          {groups.map((group) => {
            const total = totals?.[group.id] ?? group.items.length;
            const more = !full && total > group.items.length;
            return (
              <section key={group.id} id={full ? group.id : undefined} className="faq-group">
                <div className="faq-group-head">
                  <GroupHeading className="text-xl font-medium tracking-tight">
                    {group.title}
                  </GroupHeading>
                  <p className="mt-1.5 text-sm text-muted-foreground">{group.lede}</p>
                  {more && (
                    <a href={faqGroupHref(group.id)} className="faq-more">
                      All {total} questions
                      <ArrowRight className="size-3.5" />
                    </a>
                  )}
                </div>
                <div className="faq-list">
                  {group.items.map((item) => (
                    <FaqItem key={item.question} item={item} />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </Container>
    </Section>
  );
}
