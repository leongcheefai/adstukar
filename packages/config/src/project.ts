export interface ProjectIdentity {
  name: string;
  slug: string;
  tagline: string;
  description: string;
  siteUrl: string;
  email: {
    from: string;
    support: string;
  };
}

/**
 * Public product identity. Edit this file once when starting a new project.
 * Environment-specific app and API origins remain in the root `.env`.
 */
export const project = {
  name: "Praxor Kit",
  slug: "praxor-kit",
  tagline: "Ship paid SaaS faster, without lock-in.",
  description:
    "A production-ready SaaS foundation with authentication, billing, email, and a dashboard.",
  siteUrl: "https://kit.praxor.dev",
  email: {
    from: "noreply@kit.praxor.dev",
    support: "support@praxor.dev",
  },
} as const satisfies ProjectIdentity;
