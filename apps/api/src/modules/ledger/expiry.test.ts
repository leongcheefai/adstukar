import { describe, expect, it } from "vitest";
import { clampExpiry } from "./expiry";

/**
 * Expiry takes back only what the lot still holds. Reversing an entry in full
 * would charge twice for points the member already spent, and would drive the lot
 * negative — which then reads as a debt the member never owed.
 */
describe("clampExpiry", () => {
  it("takes the whole credit when the lot still holds it", () => {
    expect(clampExpiry(12, 40)).toBe(12);
  });

  it("takes only what is left when the member has spent most of it", () => {
    expect(clampExpiry(12, 5)).toBe(5);
  });

  it("takes nothing from an empty lot", () => {
    expect(clampExpiry(12, 0)).toBe(0);
  });

  it("takes nothing from a lot that is somehow already negative", () => {
    expect(clampExpiry(12, -30)).toBe(0);
  });

  it("gives a fee back in full, because expiring a debit grows the lot", () => {
    expect(clampExpiry(-3, 0)).toBe(-3);
  });
});
