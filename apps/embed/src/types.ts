/**
 * Wire types for the public serving endpoints, declared here on purpose: the snippet must
 * not import `@repo/contracts` (it would drag drizzle-orm into the bundle). Keep these in
 * step with `packages/contracts/src/modules/serve.ts`.
 */
export type AdSize = "small" | "medium";

export interface ServedAd {
  name: string;
  tagline: string;
  logoUrl: string | null;
  clickUrl: string;
}

export interface ServeResponse {
  impressionId: string | null;
  size: AdSize;
  house: boolean;
  ad: ServedAd | null;
}
