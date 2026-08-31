import type React from "react";
import { cn } from "../lib/utils";

export interface Feature {
  icon?: React.ReactNode;
  title: string;
  description: string;
}

export interface FeatureSectionProps {
  eyebrow?: string;
  headline: string;
  subheadline?: string;
  features: Feature[];
  className?: string;
}

export function FeatureSection({
  eyebrow,
  headline,
  subheadline,
  features,
  className,
}: FeatureSectionProps) {
  return (
    <section className={cn("py-24 sm:py-32", className)}>
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          {eyebrow && (
            <p className="text-sm font-semibold uppercase tracking-widest text-primary">
              {eyebrow}
            </p>
          )}
          <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">{headline}</h2>
          {subheadline && <p className="mt-4 text-lg text-muted-foreground">{subheadline}</p>}
        </div>
        <div className="mx-auto mt-16 grid max-w-5xl gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: static list
            <div key={i} className="flex flex-col gap-3">
              {feature.icon && (
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  {feature.icon}
                </div>
              )}
              <h3 className="text-base font-semibold">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
