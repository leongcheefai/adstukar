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
  tagline: "Show two ads, earn one for yourself.",
  description:
    "A cross-promotion ad exchange for indie hackers. Show a small sponsored card in your product and earn points to show yours in theirs. No money moves.",
  siteUrl: "https://adstukar.com",
  email: {
    from: "noreply@adstukar.com",
    support: "support@adstukar.com",
  },
} as const satisfies ProjectIdentity;
