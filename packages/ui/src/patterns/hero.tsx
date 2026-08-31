import { cn } from "../lib/utils";
import { Button } from "../primitives/button";

export interface HeroProps {
  badge?: string;
  headline: string;
  subheadline: string;
  primaryCta: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
  className?: string;
}

export function Hero({
  badge,
  headline,
  subheadline,
  primaryCta,
  secondaryCta,
  className,
}: HeroProps) {
  return (
    <section className={cn("relative overflow-hidden py-24 sm:py-32", className)}>
      <div className="mx-auto max-w-4xl px-6 text-center">
        {badge && (
          <div className="mb-6 inline-flex items-center rounded-full border border-border bg-muted px-3 py-1 text-sm font-medium text-muted-foreground">
            {badge}
          </div>
        )}
        <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-6xl">
          {headline}
        </h1>
        <p className="mt-6 text-lg leading-8 text-muted-foreground">{subheadline}</p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Button asChild size="lg">
            <a href={primaryCta.href}>{primaryCta.label}</a>
          </Button>
          {secondaryCta && (
            <Button asChild variant="outline" size="lg">
              <a href={secondaryCta.href}>{secondaryCta.label}</a>
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}
