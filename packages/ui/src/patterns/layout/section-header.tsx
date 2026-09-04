import { cn } from "../../lib/utils";

export interface SectionHeaderProps {
  eyebrow?: string;
  headline: string;
  lede?: string;
  align?: "center" | "start";
  as?: "h1" | "h2";
  className?: string;
}

export function SectionHeader({
  eyebrow,
  headline,
  lede,
  align = "center",
  as: Heading = "h2",
  className,
}: SectionHeaderProps) {
  const isCenter = align === "center";
  return (
    <div className={cn("mx-auto max-w-2xl", isCenter && "text-center", className)}>
      {eyebrow && (
        <p className="text-sm font-medium uppercase tracking-widest text-primary">{eyebrow}</p>
      )}
      <Heading
        className={cn(
          "mt-2 text-balance text-3xl font-medium tracking-tight sm:text-4xl",
          eyebrow && "mt-3",
        )}
      >
        {headline}
      </Heading>
      {lede && <p className="mt-4 text-pretty text-lg text-muted-foreground">{lede}</p>}
    </div>
  );
}
