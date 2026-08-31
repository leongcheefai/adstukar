import { describe, expect, it } from "vitest";
import { generateApiKey, normalizeTerms } from "./keys";

describe("normalizeTerms", () => {
  it("lower-cases, trims, de-duplicates and drops empties", () => {
    expect(normalizeTerms([" Crypto ", "crypto", "", "  ", "Casino"])).toEqual([
      "crypto",
      "casino",
    ]);
  });
});

describe("generateApiKey", () => {
  it("uses the pk_ prefix and 32 hex chars", () => {
    expect(generateApiKey()).toMatch(/^pk_[0-9a-f]{32}$/);
  });
});
