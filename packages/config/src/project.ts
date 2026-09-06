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
 *
 * `slug` stays "adstukar" on purpose. It is not display copy: it names the
 * embed attribute (`data-adstukar-key`), the served bundle
 * (`/embed/adstukar.js`), and the domain-verification file
 * (`/.well-known/adstukar.txt`). Every snippet already pasted on a member
 * site depends on those three strings, so the rename stopped at the name.
 */
export const project = {
  name: "CapyAds",
  slug: "adstukar",
  tagline: "Show two ads, earn one for yourself.",
  description:
    "A cross-promotion ad exchange for indie hackers. Show a small sponsored card in your product and earn points to show yours in theirs. No money moves.",
  siteUrl: "https://capyads.com",
  email: {
    from: "noreply@capyads.com",
    support: "support@capyads.com",
  },
} as const satisfies ProjectIdentity;
