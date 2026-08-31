import { cn } from "../lib/utils";

export interface LogoEntry {
  name: string;
  wordmark?: string;
}

export interface LogoCloudProps {
  label?: string;
  logos: LogoEntry[];
  className?: string;
}

export function LogoCloud({ label, logos, className }: LogoCloudProps) {
  return (
    <section className={cn("py-16", className)}>
      <div className="mx-auto max-w-6xl px-6">
        {label && <p className="text-center text-sm text-muted-foreground">{label}</p>}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-12 gap-y-6">
          {logos.map((logo) => (
            <span
              key={logo.name}
              className="text-lg font-semibold text-muted-foreground opacity-50 transition-opacity hover:opacity-100"
            >
              {logo.wordmark ?? logo.name}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
