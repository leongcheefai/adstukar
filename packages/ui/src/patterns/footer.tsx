import type * as React from "react";
import { cn } from "../lib/utils";

export interface FooterLink {
  label: string;
  href: string;
  external?: boolean;
}

export interface FooterGroup {
  title: string;
  links: FooterLink[];
}

export interface FooterProps {
  brand: {
    name: string;
    tagline?: string;
    href?: string;
    /** Rendered in place of the name. The name still labels the link. */
    logo?: React.ReactNode;
  };
  groups: FooterGroup[];
  newsletter?: React.ReactNode;
  legal?: {
    copyright?: string;
    links?: FooterLink[];
  };
  className?: string;
}

export function Footer({ brand, groups, newsletter, legal, className }: FooterProps) {
  const year = new Date().getFullYear();

  return (
    <footer className={cn("border-t border-border bg-muted/30", className)}>
      <div className="mx-auto max-w-6xl px-6 pt-12 pb-[calc(3rem+env(safe-area-inset-bottom))]">
        {newsletter && (
          <div className="mb-10 flex flex-col gap-6 rounded-lg border border-border bg-card p-6 sm:flex-row sm:items-center sm:justify-between">
            {newsletter}
          </div>
        )}

        <div className="flex flex-col gap-10 sm:flex-row sm:justify-between">
          <div className="max-w-xs">
            <a
              href={brand.href ?? "/"}
              aria-label={brand.logo ? brand.name : undefined}
              className="inline-flex text-lg font-medium tracking-tight text-primary transition-opacity duration-150 ease-out hover:opacity-80"
            >
              {brand.logo ?? brand.name}
            </a>
            {brand.tagline && <p className="mt-1 text-sm text-muted-foreground">{brand.tagline}</p>}
          </div>

          <div className="flex flex-wrap gap-x-12 gap-y-8">
            {groups.map((group) => (
              <div key={group.title}>
                <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                  {group.title}
                </p>
                {/* Padding, not margin: it gives each link a 40px target with no
                    gap between them, so neighbouring targets cannot overlap. */}
                <ul className="mt-3">
                  {group.links.map((link) => (
                    <li key={link.href}>
                      <a
                        href={link.href}
                        className="block py-2.5 text-sm leading-5 text-muted-foreground transition-colors duration-150 ease-out hover:text-foreground"
                        {...(link.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            {legal?.copyright ?? `© ${year} ${brand.name}. All rights reserved.`}
          </p>
          {legal?.links && legal.links.length > 0 && (
            <ul className="-my-3 flex flex-wrap gap-x-5">
              {legal.links.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="block py-3 text-xs leading-4 text-muted-foreground transition-colors duration-150 ease-out hover:text-foreground"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </footer>
  );
}
