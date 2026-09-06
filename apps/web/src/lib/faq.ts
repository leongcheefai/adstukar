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
 * The six questions the landing page answers. `index.astro` feeds the same list into the
 * FAQ JSON-LD, so the visible copy and the structured data cannot drift apart.
 */
export const LANDING_FAQ: FaqEntry[] = [
  {
    question: "How do I make money?",
    answer: `You show one small sponsored card where your audience already looks, and you earn ${economy.earnPerImpression} credit for every verified view. Credits are ${project.name} money: cash them out from your dashboard once they settle. Advertisers go the other way and spend ${economy.spendPerImpression} credits for every verified view of their own card.`,
  },
  {
    question: "Do I need a website?",
    answer:
      "No. A website or an app is the easiest place to paste the snippet, but any screen works: a blog, a newsletter, a live stream, a video description, a tablet in your car, a display in your café, or a board in your library. If people look at it, it can earn.",
  },
  {
    question: "What does it cost?",
    answer: `Nothing to join, and no card on file. Distributors never pay: they earn credits and cash them out. Advertisers spend the credits they hold, ${economy.spendPerImpression} for every verified view of their card.`,
  },
  {
    question: "What is a verified view?",
    answer: `A view counts only after at least ${viewablePercent}% of the card stays visible for at least ${viewableSeconds} second. The snippet then sends one beacon, and the credit lands on your account. A card that loads below the fold and never scrolls into view earns nothing and costs nothing.`,
  },
  {
    question: "When do my credits become money?",
    answer: `A credit stays pending for ${economy.settlementDelayHours} hours while we check the view, then it settles. Settled credits are yours: cash them out from the dashboard whenever you want. Credits you never use expire after ${economy.expiryMonths} months.`,
  },
  {
    question: "Does the snippet track my audience?",
    answer: `No. The snippet sets no cookies, does no fingerprinting, and makes no third-party calls. It fetches one card from ${project.name} and sends one view beacon back. That is the full network activity.`,
  },
];

/** The full FAQ page: the landing questions plus the ones members ask after they join. */
export const FAQ_PAGE: FaqEntry[] = [
  ...LANDING_FAQ,
  {
    question: "How does moderation work?",
    answer: `A person reviews every product before it runs. The review checks that the site is live, that the domain is verified, and that the name, tagline, and logo are accurate. You get an email with the decision, and an approved product receives its ${economy.grants.productApproval} welcome credits at that moment.`,
  },
  {
    question: "What does the card look like?",
    answer: `A small neutral card with a logo, a product name, a one-line tagline, and a "Sponsored" label. Two sizes: ${small.width}×${small.height} and ${medium.width}×${medium.height}. It uses its own styles, so it never inherits colors from your page, and it never animates.`,
  },
  {
    question: "How do I verify my domain?",
    answer: `Two methods. Serve your token as plain text at /.well-known/${project.slug}.txt, or add a DNS TXT record on your domain that contains the token. Then press Verify in the dashboard. The check reads the file first and falls back to DNS.`,
  },
  {
    question: "What shows when no advertiser is eligible?",
    answer:
      "Your own house ad. When no advertiser matches your placement, the slot shows your card at zero cost. The slot is never empty, and you never pay for it.",
  },
  {
    question: "How do I remove a product?",
    answer:
      "Open the product in the dashboard and delete it. Its card stops running at once, and its placements close. Remove the snippet from your site to finish. Settled credits stay on your account.",
  },
];
