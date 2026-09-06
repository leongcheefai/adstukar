/**
 * A campaign is one site and every ad that points at it.
 *
 * There is no campaign table, so a campaign with ads is derived from the
 * products that share a domain. A campaign with no ads yet cannot be derived
 * from anything, so it comes from the browser store in `draft-campaigns.ts`.
 * Both shapes reach the UI as one `Campaign`.
 */

import type { Product } from "@repo/contracts/types";
import { useEffect } from "react";
import {
  type DraftCampaign,
  addDraftCampaign,
  removeDraftCampaign,
  useDraftCampaigns,
} from "./draft-campaigns";
import { useProducts } from "./products";

/**
 * How many ads one campaign may hold.
 *
 * The grid draws a campaign as one row of four, so the cap and the row are the
 * same number. It belongs beside the economy numbers once the API owns
 * campaigns; today no server rule exists to read.
 */
export const MAX_ADS_PER_CAMPAIGN = 4;

export interface Campaign {
  /** The domain every ad in the group points at. The grouping key. */
  domain: string;
  /**
   * The product name the group's ads carry. There is no campaign table, so for
   * a live campaign this is the newest ad's name rather than a field of its own.
   */
  name: string;
  /** The site the ads link to. */
  url: string;
  logoUrl: string | null;
  /** Newest first, so a fresh variant lands where the eye already is. */
  ads: Product[];
  /**
   * True while the campaign lives in this browser only. It has no ad, so the
   * API has nothing to hold it. The first saved ad makes it real.
   */
  draft: boolean;
}

/**
 * Ads that share a domain are variants of one campaign, because Duplicate copies
 * the URL and only the tagline changes.
 */
export function groupIntoCampaigns(products: Product[]): Campaign[] {
  const byDomain = new Map<string, Product[]>();
  for (const product of products) {
    const group = byDomain.get(product.domain);
    if (group) group.push(product);
    else byDomain.set(product.domain, [product]);
  }
  return [...byDomain.entries()].map(([domain, group]) => {
    const ads = [...group].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const newest = ads[0];
    return {
      domain,
      name: newest?.name ?? domain,
      url: newest?.url ?? `https://${domain}`,
      logoUrl: newest?.logoUrl ?? null,
      ads,
      draft: false,
    };
  });
}

function fromDraft(draft: DraftCampaign): Campaign {
  return {
    domain: draft.domain,
    name: draft.name,
    url: draft.url,
    logoUrl: draft.logoUrl,
    ads: [],
    draft: true,
  };
}

/** Every ad in the group shares one domain, so one verified ad verifies all. */
export function isVerified(campaign: Campaign): boolean {
  return campaign.ads.some((ad) => ad.verifiedAt);
}

/**
 * Keeps a campaign on screen after its last ad goes.
 *
 * A live campaign is only the ads that share its domain, so deleting the last
 * ad would take the campaign with it. The member deleted one ad, not the site,
 * so the site stays as a draft — the same state a campaign holds before its
 * first ad. Deleting the campaign itself does not come through here.
 */
export function keepCampaignAfterLastAd(campaign: Campaign, deleted: Product): void {
  if (campaign.draft) return;
  if (campaign.ads.length !== 1 || campaign.ads[0]?.id !== deleted.id) return;
  addDraftCampaign({
    domain: campaign.domain,
    name: campaign.name,
    url: campaign.url,
    logoUrl: campaign.logoUrl,
    createdAt: new Date().toISOString(),
  });
}

/** The campaign a domain belongs to, or null when it is not listed yet. */
export function campaignOf(campaigns: Campaign[], domain: string): Campaign | null {
  return campaigns.find((c) => c.domain === domain) ?? null;
}

/**
 * The one campaign list every surface reads: the server's, plus the drafts this
 * browser is still holding.
 */
export function useCampaigns(): { campaigns: Campaign[]; isLoading: boolean } {
  const { data: products, isLoading } = useProducts();
  const drafts = useDraftCampaigns();

  const live = groupIntoCampaigns(products ?? []);
  const liveDomains = new Set(live.map((c) => c.domain));

  // A draft whose domain now has an ad is finished: the server owns it, and two
  // rows for one domain would be a duplicate on screen.
  useEffect(() => {
    if (isLoading) return;
    for (const draft of drafts) {
      if (liveDomains.has(draft.domain)) removeDraftCampaign(draft.domain);
    }
  });

  const pending = drafts.filter((draft) => !liveDomains.has(draft.domain)).map(fromDraft);

  return {
    campaigns: [...live, ...pending].sort((a, b) => a.domain.localeCompare(b.domain)),
    isLoading,
  };
}
