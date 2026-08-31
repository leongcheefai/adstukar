import { cn } from "../lib/utils";
import { Badge } from "../primitives/badge";
import { Button } from "../primitives/button";

export interface PricingTier {
  name: string;
  price: string;
  period?: string;
  description: string;
  features: string[];
  cta: { label: string; href: string; onClick?: (e: React.MouseEvent) => void };
  highlighted?: boolean;
  badge?: string;
}

export type PricingCardProps = PricingTier & { className?: string };

export function PricingCard({
  name,
  price,
  period = "/month",
  description,
  features,
  cta,
  highlighted = false,
  badge,
  className,
}: PricingCardProps) {
  return (
    <div
      className={cn(
        "relative flex flex-col rounded-2xl border p-8",
        highlighted
          ? "border-primary bg-primary text-primary-foreground shadow-xl"
          : "border-border bg-card",
        className,
      )}
    >
      {badge && (
        <Badge
          variant={highlighted ? "secondary" : "default"}
          className="absolute -top-3 left-1/2 -translate-x-1/2"
        >
          {badge}
        </Badge>
      )}
      <div className="flex-1">
        <h3 className="text-lg font-semibold">{name}</h3>
        <div className="mt-4 flex items-baseline gap-1">
          <span className="text-4xl font-bold">{price}</span>
          {period && (
            <span
              className={cn(
                "text-sm",
                highlighted ? "text-primary-foreground/70" : "text-muted-foreground",
              )}
            >
              {period}
            </span>
          )}
        </div>
        <p
          className={cn(
            "mt-3 text-sm",
            highlighted ? "text-primary-foreground/80" : "text-muted-foreground",
          )}
        >
          {description}
        </p>
        <ul className="mt-8 space-y-3">
          {features.map((feature, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: static list
            <li key={i} className="flex items-start gap-3 text-sm">
              <svg
                className={cn(
                  "mt-0.5 h-4 w-4 shrink-0",
                  highlighted ? "text-primary-foreground" : "text-primary",
                )}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              {feature}
            </li>
          ))}
        </ul>
      </div>
      <Button asChild variant={highlighted ? "secondary" : "default"} className="mt-8 w-full">
        <a href={cta.href} onClick={cta.onClick}>
          {cta.label}
        </a>
      </Button>
    </div>
  );
}
