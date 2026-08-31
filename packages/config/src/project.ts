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
  name: "AdsTukar",
  slug: "adstukar",
  tagline: "Ship paid SaaS faster, without lock-in.",
  description:
    "A production-ready SaaS foundation with authentication, billing, email, and a dashboard.",
  siteUrl: "https://adstukar.com",
  email: {
    from: "noreply@adstukar.com",
    support: "support@adstukar.com",
  },
} as const satisfies ProjectIdentity;
