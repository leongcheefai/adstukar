import { describe, expect, it } from "vitest";
import { generateApiKey, generateDeviceId, normalizeTerms } from "./keys";

describe("normalizeTerms", () => {
  it("lower-cases, trims, de-duplicates and drops empties", () => {
    expect(normalizeTerms([" Crypto ", "crypto", "", "  ", "Casino"])).toEqual([
      "crypto",
      "casino",
    ]);
  });
});

describe("generateApiKey", () => {
  it("uses the dk_ prefix and 32 hex chars", () => {
    expect(generateApiKey()).toMatch(/^dk_[0-9a-f]{32}$/);
  });
});

describe("generateDeviceId", () => {
  it("reads as two groups of four, with no lookalike characters", () => {
    expect(generateDeviceId()).toMatch(/^[2-9A-HJ-NP-Z]{4}-[2-9A-HJ-NP-Z]{4}$/);
  });
});
