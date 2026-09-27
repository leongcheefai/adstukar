import { earnPerPlay, economy } from "@repo/config/economy";
import { media } from "@repo/config/media";
import { perThousandPlays, slotOffer, usd, usdCents } from "@repo/config/money";

/**
 * Every number the legal pages quote, read from `@repo/config/economy` so the
 * Terms, the Refund Policy, the FAQ and the product can never disagree. A
 * change to an amount there changes the published Terms too: give members the
 * notice the Terms promise before you ship one.
 */

const countryName = new Intl.DisplayNames(["en"], { type: "region", style: "long" });

/** What a screen earns: "$2.00 per 1,000 plays". */
export const earnRate = perThousandPlays(earnPerPlay());
export const dailyPlayCap = economy.caps.dailyPlaysPerDevice.toLocaleString("en-US");
export const paidHours = economy.caps.paidHoursPerDay;
export const settlementHours = economy.settlementDelayHours;
export const holdDays = economy.payout.holdDays;
export const payoutMinimum = usd(economy.payout.minimum);
export const payoutCountries = economy.payout.countries
  .map((code) => countryName.of(code) ?? code)
  .join(", ");
export const payoutCurrency = economy.payout.paidIn.currency;
export const expiryMonths = economy.expiryMonths;

export const topupMinimum = usdCents(economy.topup.amount.minCents);
export const topupMaximum = usdCents(economy.topup.amount.maxCents);
export const refundWindowDays = economy.topup.refundWindowDays;
/** What the card processor keeps and a refund cannot return: "2.9% + $0.30". */
export const processorFee = `${economy.topup.processorFeeBps / 100}% + ${usdCents(economy.topup.processorFeeFixedCents)}`;

/** One slot: "$20.00 for 7 days". */
export const slotPrice = slotOffer();
export const slotCount = economy.slot.count;
export const listingsPerCampaign = economy.maxListingsPerCampaign;
export const taglineMaxLength = economy.taglineMaxLength;
/** How much of a listing the ticker band shows. Longer text is cut to fit. */
export const bandNameLength = economy.slot.nameMaxLength;
export const bandTaglineLength = economy.slot.taglineMaxLength;
/** What a logo may be: "PNG, JPEG, or WebP" and "5 MB". */
export const logoTypes = media.image.types
  .map((type) => (type === "image/webp" ? "WebP" : type.replace("image/", "").toUpperCase()))
  .join(", ")
  .replace(/, ([^,]*)$/, ", or $1");
export const logoMaxMb = media.image.maxBytes / (1024 * 1024);

/** Minutes a live play may wait for its report, and hours a cached one may. */
export const livePlayMinutes = economy.playTtlMinutes;
export const cachedPlayHours = economy.loop.playTtlMinutes / 60;
