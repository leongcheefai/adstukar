import { distributorPercent, economy, playRateRange } from "@repo/config/economy";
import { perThousandPlays, usd, usdCents, usdPerThousand } from "@repo/config/money";
import { project } from "@repo/config/project";

export interface FaqEntry {
  question: string;
  answer: string;
}

export type FaqGroupId = "screens" | "advertising" | "money";

export interface FaqGroup {
  id: FaqGroupId;
  /** Short, for a chip or a column head. */
  title: string;
  /** One line under the title. */
  lede: string;
  items: FaqEntry[];
}

const { lowest: lowestPlayRate, highest: highestPlayRate } = playRateRange();
const distributorShare = distributorPercent();

/**
 * Every question on the site, in three groups: one per audience and one for
 * the money. The landing page prints the first few of each group; the FAQ page
 * prints them all; the JSON-LD on each page follows what that page shows, so
 * the visible copy and the structured data cannot drift apart.
 *
 * Order matters inside a group. The landing page takes from the top.
 */
export const FAQ_GROUPS: FaqGroup[] = [
  {
    id: "screens",
    title: "Earning with a screen",
    lede: "For anyone with a screen in a room.",
    items: [
      {
        question: "How do I make money?",
        answer: `Open CapyTV in a browser and play music, a podcast, or a video. Listings crawl along the foot of the picture. Each play earns ${perThousandPlays(lowestPlayRate)} to ${usdPerThousand(highestPlayRate)}, and a scan pays a bonus on top. Cash-out is not open yet.`,
      },
      {
        question: "What kind of screen do I need?",
        answer:
          "Any display that opens a web page: a smart TV, a stick, a tablet, a laptop, a phone. CapyTV runs in the browser. There is nothing to install from a store.",
      },
      {
        question: "What counts as a play?",
        answer:
          "One listing shown on your screen for its full dwell, reported by CapyTV. A play is not proof that a person looked, so it is billed as a play, and a scan pays a bonus when somebody does more than look. Only one paid listing is on your screen at a time.",
      },
      {
        question: "Does CapyTV track the room?",
        answer: `No. There is no camera, no microphone, and no audience measurement. The screen asks ${project.name} for a listing, plays it, and reports that it played. That is the whole of it.`,
      },
      {
        question: "Can I refuse a listing?",
        answer: `Yes, two ways. Add up to ${economy.excludedTerms.max} excluded terms, and any listing whose name or tagline contains one never reaches your screen. Or veto a listing you have seen, and that one creative stops at once. Neither goes through a review.`,
      },
      {
        question: "What plays when no advertiser is eligible?",
        answer: `Your own promotion, or the ${project.name} card. Both play free and move no money. The screen is never blank.`,
      },
      {
        question: "Is there a limit to what one screen earns?",
        answer: `A screen is paid for up to ${economy.caps.dailyPlaysPerDevice.toLocaleString()} plays a day. Above that the listing still plays and the play still counts, and it pays nothing. The cap is what keeps a screen that faces a wall from being worth running.`,
      },
    ],
  },
  {
    id: "advertising",
    title: "Advertising",
    lede: "For a business that wants to be on the screens.",
    items: [
      {
        question: "What does it cost?",
        answer: `You top up in US dollars, from ${usdCents(economy.topup.packs[0]?.usdCents ?? 0)}. No pack carries a bonus. Each play of your listing costs ${perThousandPlays(lowestPlayRate)} to ${usdPerThousand(highestPlayRate)}, by the tier of the screen, and a scan costs a bonus on top. There is no monthly fee.`,
      },
      {
        question: "What does a listing look like on screen?",
        answer: `A mark, a name, and a tagline of up to ${economy.taglineMaxLength} characters, in one line of the crawl along the foot of the picture. It keeps its own styles, so it never takes colours from the content behind it, and it never covers the picture.`,
      },
      {
        question: "How does moderation work?",
        answer: `A person reviews every listing and every screen. The listing review checks that the site is live, that the domain is verified, and that the tagline is accurate. The screen review checks the screen and the room, and stamps the tier that sets its rate. Your first approved listing receives a ${usd(economy.grants.firstListingApproval)} trial credit.`,
      },
      {
        question: "How do I verify my domain?",
        answer: `Two methods. Serve your token as plain text at /.well-known/${project.slug}.txt, or add a DNS TXT record on your domain that contains the token. Then press Verify in the dashboard. The check reads the file first and falls back to DNS.`,
      },
      {
        question: "What is a daily budget?",
        answer: `The most a campaign spends in one day, ${usd(economy.caps.defaultDailyBudget)} unless you set less, down to ${usd(economy.caps.minDailyBudget)}. The listings under the campaign split it evenly. When it is spent the campaign stops, and it starts again the next day.`,
      },
      {
        question: "How do I remove a listing?",
        answer:
          "Open the campaign in the dashboard and archive the listing. It stops playing at once. The row itself stays, because the plays it earned reference it.",
      },
      {
        question: "Can I get a refund?",
        answer: `Yes, for money you added and did not spend, within ${economy.topup.refundWindowDays} days of the payment. It pays what you paid, less what the card processor kept. Earned money and the trial credit are not refunded.`,
      },
    ],
  },
  {
    id: "money",
    title: "Money",
    lede: "How the wallet works, and when it becomes cash.",
    items: [
      {
        question: "What currency does the wallet hold?",
        answer: `US dollars. Money comes in as a top-up and goes out as a payout. Inside ${project.name}, every figure is in US dollars.`,
      },
      {
        question: "When can I cash out?",
        answer: `A play stays pending for ${economy.settlementDelayHours} hours, then it settles. Cash-out is not open yet. When it opens, settled earnings wait out a ${economy.payout.holdDays}-day hold and come out from ${usd(economy.payout.minimum)} up. An admin reviews each request and pays by hand.`,
      },
      {
        question: "Where does the fee go?",
        answer: `${project.name} keeps ${economy.feePercent}% of every play and every scan, and you keep ${distributorShare}%. The fee is its own line on your wallet page, never a hidden spread, so what an advertiser pays and what you earn always add up.`,
      },
      {
        question: "Does my balance expire?",
        answer: `Earned money and the trial credit expire ${economy.expiryMonths} months after they settle. Money you added never expires.`,
      },
      {
        question: "What is the trial credit?",
        answer: `${usd(economy.grants.firstListingApproval)}, granted once, when your first listing is approved. A spend uses it before the money you added. It cannot be withdrawn or refunded.`,
      },
    ],
  },
];

/** Every question, flat, for the FAQ page's structured data. */
export const FAQ_ALL: FaqEntry[] = FAQ_GROUPS.flatMap((group) => group.items);

/** The first `perGroup` questions of each group, for the landing page. */
export function landingFaq(perGroup: number): FaqGroup[] {
  return FAQ_GROUPS.map((group) => ({ ...group, items: group.items.slice(0, perGroup) }));
}

export function faqGroupHref(id: FaqGroupId): string {
  return `/faq#${id}`;
}
