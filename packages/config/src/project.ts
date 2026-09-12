export interface ProjectIdentity {
  name: string;
  /** What members call the internal unit. The code says point; a member reads this. */
  pointsName: string;
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
 * Public brand identity. Edit this file once when starting a new project.
 * Every app depends on this package, so a change here rebuilds every deployment.
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
  pointsName: "CapyPoints",
  slug: "adstukar",
  tagline: "Play ads on your screen and earn money.",
  description:
    "An ad network for small screens. Put a screen in your venue and earn CapyPoints every time it plays a listing. Advertisers buy points; distributors cash them out.",
  siteUrl: "https://capyads.com",
  email: {
    from: "noreply@capyads.com",
    support: "support@capyads.com",
  },
} as const satisfies ProjectIdentity;
