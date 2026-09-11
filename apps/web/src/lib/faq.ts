import { distributorPercent, economy, playRateRange } from "@repo/config/economy";
import { project } from "@repo/config/project";

export interface FaqEntry {
  question: string;
  answer: string;
}

const { lowest: lowestPlayRate, highest: highestPlayRate } = playRateRange();
const distributorShare = distributorPercent();
const dollarsPerPoint = economy.pointsPerUsd;

/**
 * The six questions the landing page answers. `index.astro` feeds the same list into the
 * FAQ JSON-LD, so the visible copy and the structured data cannot drift apart.
 */
export const LANDING_FAQ: FaqEntry[] = [
  {
    question: "How do I make money?",
    answer: `You put a screen in a room where people already look, and it plays listings between your own content. Each play earns ${lowestPlayRate} to ${highestPlayRate} CapyPoints, and a scan of the code on screen pays a bonus on top. ${dollarsPerPoint.toLocaleString()} points are 1 US dollar. Cash-out is not open yet; the dashboard shows what you have earned in the meantime.`,
  },
  {
    question: "What kind of screen do I need?",
    answer:
      "Any display that opens a web page: a smart TV, a stick, a tablet, or an old laptop. CapyTV runs in the browser, so there is nothing to install from a store. A café counter, a gym wall, a salon, a clinic waiting room — if people look at it, it can earn.",
  },
  {
    question: "What does it cost?",
    answer: `Nothing to join, and no card on file to earn. Distributors never pay: they only earn. Advertisers buy points and spend them, ${lowestPlayRate} to ${highestPlayRate} for every play of their listing.`,
  },
  {
    question: "What counts as a play?",
    answer:
      "One listing shown in one region of your screen for its full dwell, reported by CapyTV. A play is not proof that a person looked, so we bill it as a play and pay a bonus when somebody scans the code. Your screen holds several regions, but only one paid listing is on it at a time.",
  },
  {
    question: "When do my points become money?",
    answer: `A point stays pending for ${economy.settlementDelayHours} hours, then it settles. Cash-out is not open yet. When it opens, settled earned points will wait out a ${economy.payout.holdDays}-day hold and come out from ${economy.payout.minimumPoints.toLocaleString()} points up. Points you never use expire after ${economy.expiryMonths} months, except points you bought, which never expire.`,
  },
  {
    question: "Does CapyTV track the room?",
    answer: `No. There is no camera, no microphone, and no audience measurement. The screen asks ${project.name} for a listing, plays it, and reports that it played. That is the full network activity.`,
  },
];

/** The full FAQ page: the landing questions plus the ones members ask after they join. */
export const FAQ_PAGE: FaqEntry[] = [
  ...LANDING_FAQ,
  {
    question: "How does moderation work?",
    answer: `A person reviews every listing and every device. The listing review checks that the site is live, that the domain is verified, and that the tagline is accurate. The device review checks the screen and the room, and stamps the tier that sets its rate. A member's first approved listing receives ${economy.grants.firstListingApproval.toLocaleString()} welcome points.`,
  },
  {
    question: "What does a listing look like on screen?",
    answer:
      'A neutral card with a logo, a name, a one-line tagline, a scan code, and a "Sponsored" label. Three shapes: a band across the foot of the screen, a float in one corner, or a single-line ticker. It uses its own styles, so it never takes colours from your content, and it never animates.',
  },
  {
    question: "How do I verify my domain?",
    answer: `Two methods. Serve your token as plain text at /.well-known/${project.slug}.txt, or add a DNS TXT record on your domain that contains the token. Then press Verify in the dashboard. The check reads the file first and falls back to DNS.`,
  },
  {
    question: "What plays when no advertiser is eligible?",
    answer:
      "A house card. When no listing matches your device, the region shows your own promotion or the CapyAds card at zero cost. The screen is never blank, and you never pay for it.",
  },
  {
    question: "Where does the fee go?",
    answer: `${project.name} keeps ${economy.feePercent}% of every play and every scan, and you keep ${distributorShare}%. The fee is its own line on your CapyPoints page, never a hidden spread, so the number an advertiser pays and the number you earn always add up.`,
  },
  {
    question: "How do I remove a listing?",
    answer:
      "Open the campaign in the dashboard and archive the listing. It stops playing at once. The row itself stays, because the plays it earned reference it, and your settled points stay on your account.",
  },
];
