import { economy } from "@repo/config/economy";
import { project } from "@repo/config/project";

export interface FaqEntry {
  question: string;
  answer: string;
}

const viewablePercent = Math.round(economy.viewability.minRatio * 100);
const viewableSeconds = economy.viewability.minMs / 1000;
const { small, medium } = economy.cardSizes;

/**
 * The five questions the landing page answers. `index.astro` feeds the same list into the
 * FAQ JSON-LD, so the visible copy and the structured data cannot drift apart.
 */
export const LANDING_FAQ: FaqEntry[] = [
  {
    question: "What does it cost?",
    answer: `Nothing. ${project.name} has no paid plan and no card on file. Points are the only currency: you earn ${economy.earnPerImpression} point for each verified impression your site shows, and you spend ${economy.spendPerImpression} points for each verified impression of your own card on another member's site.`,
  },
  {
    question: "What is a verified impression?",
    answer: `An impression counts only after at least ${viewablePercent}% of the card stays visible for at least ${viewableSeconds} second. The snippet then sends one beacon. A card that loads below the fold and never scrolls into view earns nothing and costs nothing.`,
  },
  {
    question: "How does moderation work?",
    answer:
      "A person reviews every product before it serves. The review checks that the site is live, that the domain is verified, and that the name, tagline, and logo are accurate. You get an email with the decision, and an approved product receives its welcome grant at that moment.",
  },
  {
    question: "What does the card look like?",
    answer: `A small neutral card with a logo, a product name, a one-line tagline, and a "Sponsored" label. Two sizes: ${small.width}×${small.height} and ${medium.width}×${medium.height}. It uses its own styles, so it never inherits colors from your page, and it never animates.`,
  },
  {
    question: "Does the snippet track my visitors?",
    answer: `No. The snippet sets no cookies, does no fingerprinting, and makes no third-party calls. It fetches one card from ${project.name} and sends one viewability beacon back. That is the full network activity.`,
  },
];

/** The full FAQ page: the landing questions plus the ones members ask after they join. */
export const FAQ_PAGE: FaqEntry[] = [
  ...LANDING_FAQ,
  {
    question: "How do I verify my domain?",
    answer: `Two methods. Serve your token as plain text at /.well-known/${project.slug}.txt, or add a DNS TXT record on your domain that contains the token. Then press Verify in the dashboard. The check reads the file first and falls back to DNS.`,
  },
  {
    question: "What shows when nobody is eligible to serve?",
    answer:
      "Your own house ad. When no other product matches your placement, the slot shows your product's card at zero cost. The slot is never empty and you never pay for it.",
  },
  {
    question: "How do I remove a product?",
    answer:
      "Open the product in the dashboard and delete it. Its card stops serving at once, and its placements close. Remove the snippet from your site to finish. Settled points stay on your account.",
  },
];
