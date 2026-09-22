import { describe, expect, it } from "vitest";
import {
  paid,
  parseUsd,
  perThousandPlays,
  slotOffer,
  usd,
  usdCents,
  usdInput,
  usdPerThousand,
  usdSigned,
} from "./money";

describe("usd", () => {
  it("shows two decimals for whole cents", () => {
    expect(usd(12_340)).toBe("$12.34");
    expect(usd(20_000)).toBe("$20.00");
    expect(usd(0)).toBe("$0.00");
  });

  it("shows three decimals when the amount is not whole cents, and never rounds", () => {
    expect(usd(12_345)).toBe("$12.345");
    expect(usd(4)).toBe("$0.004");
  });

  it("keeps the sign", () => {
    expect(usd(-4)).toBe("-$0.004");
    expect(usd(-4_000)).toBe("-$4.00");
  });

  it("groups thousands", () => {
    expect(usd(1_234_560)).toBe("$1,234.56");
  });
});

describe("usdSigned", () => {
  it("leads a credit with a plus and a debit with a minus", () => {
    expect(usdSigned(3)).toBe("+$0.003");
    expect(usdSigned(-4_000)).toBe("-$4.00");
    expect(usdSigned(0)).toBe("$0.00");
  });
});

describe("usdInput", () => {
  it("is the plain figure a member edits, with no sign and no commas", () => {
    expect(usdInput(20_000)).toBe("20.00");
    expect(usdInput(1_234_560)).toBe("1234.56");
  });

  it("keeps a third decimal rather than round it away", () => {
    expect(usdInput(1_005)).toBe("1.005");
  });

  it("round-trips through parseUsd", () => {
    expect(parseUsd(usdInput(20_000))).toBe(20_000);
  });
});

describe("usdCents", () => {
  it("shows what Stripe moved", () => {
    expect(usdCents(941)).toBe("$9.41");
    expect(usdCents(100_000)).toBe("$1,000.00");
  });
});

describe("paid", () => {
  it("shows what Stripe moved in the payout currency", () => {
    // Intl keeps the symbol and the figure on one line with a no-break space.
    expect(paid(4_076, "MYR")).toBe("RM\u00a040.76");
    expect(paid(123_450, "MYR")).toBe("RM\u00a01,234.50");
  });
});

describe("rates", () => {
  it("shows the slot offer as one sentence", () => {
    expect(slotOffer()).toBe("$20.00 for 7 days");
  });

  it("shows a play rate per thousand plays", () => {
    expect(usdPerThousand(4)).toBe("$4.00");
    expect(perThousandPlays(4)).toBe("$4.00 per 1,000 plays");
  });
});

describe("parseUsd", () => {
  it("reads a dollar figure into an amount", () => {
    expect(parseUsd("10")).toBe(10_000);
    expect(parseUsd("10.5")).toBe(10_500);
    expect(parseUsd("10.50")).toBe(10_500);
    expect(parseUsd(" $1,234.56 ")).toBe(1_234_560);
  });

  it("refuses what is not a dollar figure with at most two decimals", () => {
    expect(parseUsd("")).toBeNull();
    expect(parseUsd("abc")).toBeNull();
    expect(parseUsd("1.234")).toBeNull();
    expect(parseUsd("-5")).toBeNull();
  });
});
