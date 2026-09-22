import { describe, expect, it } from "vitest";
import { convertCents, parseBnmQuote, rateInBounds } from "./fx";

const BODY = {
  data: {
    currency_code: "USD",
    unit: 1,
    rate: { date: "2026-09-22", buying_rate: 4.073, selling_rate: 4.078, middle_rate: 4.0755 },
  },
  meta: { quote: "rm", session: "1200" },
};

describe("parseBnmQuote", () => {
  it("reads the middle rate and its date", () => {
    expect(parseBnmQuote(BODY)).toEqual({ rate: 4.0755, date: "2026-09-22", source: "BNM" });
  });

  it("divides by the unit, because some currencies are quoted per 100", () => {
    const body = { ...BODY, data: { ...BODY.data, unit: 100 } };
    expect(parseBnmQuote(body).rate).toBeCloseTo(0.040755, 9);
  });

  it("throws on any other shape, so a changed feed cannot set a price", () => {
    expect(() => parseBnmQuote({ data: { rate: {} } })).toThrow();
    expect(() =>
      parseBnmQuote({ ...BODY, data: { ...BODY.data, currency_code: "SGD" } }),
    ).toThrow();
  });
});

describe("rateInBounds", () => {
  it("accepts a rate the ringgit could have", () => {
    expect(rateInBounds(4.0755)).toBe(true);
  });

  it("refuses zero, a tenfold slip, and nonsense", () => {
    expect(rateInBounds(0)).toBe(false);
    expect(rateInBounds(40.755)).toBe(false);
    expect(rateInBounds(Number.NaN)).toBe(false);
  });
});

describe("convertCents", () => {
  it("turns USD cents into payout cents at the rate, to the nearest cent", () => {
    expect(convertCents(1_000, 4.0755)).toBe(4_076);
    expect(convertCents(941, 4.0755)).toBe(3_835);
  });
});
