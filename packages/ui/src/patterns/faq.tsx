import { cn } from "../lib/utils";

export interface FAQItem {
  question: string;
  answer: string;
}

export interface FAQProps {
  eyebrow?: string;
  headline: string;
  items: FAQItem[];
  className?: string;
}

export function FAQ({ eyebrow, headline, items, className }: FAQProps) {
  return (
    <section className={cn("py-24 sm:py-32", className)}>
      <div className="mx-auto max-w-3xl px-6">
        <div className="text-center">
          {eyebrow && (
            <p className="text-sm font-semibold uppercase tracking-widest text-primary">
              {eyebrow}
            </p>
          )}
          <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">{headline}</h2>
        </div>
        <dl className="mt-16 space-y-4">
          {items.map((item) => (
            <details
              key={item.question}
              className="group rounded-lg border border-border bg-card open:ring-1 open:ring-ring"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between px-6 py-4 font-medium [&::-webkit-details-marker]:hidden">
                {item.question}
                <svg
                  className="h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-200 group-open:rotate-45"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 5v14M5 12h14"
                  />
                </svg>
              </summary>
              <p className="px-6 pb-5 text-sm text-muted-foreground">{item.answer}</p>
            </details>
          ))}
        </dl>
      </div>
    </section>
  );
}
