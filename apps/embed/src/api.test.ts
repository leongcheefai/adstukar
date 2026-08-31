import { describe, expect, it } from "vitest";
import { parseServeResponse, resolveApiBase } from "./api";

describe("resolveApiBase", () => {
  it("falls back to the build-time origin", () => {
    expect(resolveApiBase()).toBe("http://api.test");
    expect(resolveApiBase(null)).toBe("http://api.test");
    expect(resolveApiBase("")).toBe("http://api.test");
    expect(resolveApiBase("   ")).toBe("http://api.test");
  });

  it("trims the override and strips trailing slashes", () => {
    expect(resolveApiBase("https://ads.example.com/")).toBe("https://ads.example.com");
    expect(resolveApiBase("  https://ads.example.com//  ")).toBe("https://ads.example.com");
    expect(resolveApiBase("https://ads.example.com/api")).toBe("https://ads.example.com/api");
  });
});

describe("parseServeResponse", () => {
  const valid = {
    impressionId: "imp_1",
    size: "small",
    house: false,
    ad: {
      name: "Acme",
      tagline: "Ship faster",
      logoUrl: "https://cdn.example.com/acme.png",
      clickUrl: "https://api.test/click/imp_1",
    },
  };

  it("accepts a valid payload", () => {
    expect(parseServeResponse(valid)).toEqual(valid);
  });

  it("accepts a null logo and a null impression id", () => {
    const payload = {
      ...valid,
      impressionId: null,
      size: "medium",
      house: true,
      ad: { ...valid.ad, logoUrl: null },
    };
    expect(parseServeResponse(payload)).toEqual(payload);
  });

  it("accepts ad: null", () => {
    const payload = { impressionId: null, size: "small", house: false, ad: null };
    expect(parseServeResponse(payload)).toEqual(payload);
  });

  it("drops unknown keys", () => {
    const parsed = parseServeResponse({ ...valid, extra: 1, ad: { ...valid.ad, ownerId: "u1" } });
    expect(parsed).toEqual(valid);
  });

  it("rejects junk", () => {
    expect(parseServeResponse(null)).toBeNull();
    expect(parseServeResponse(undefined)).toBeNull();
    expect(parseServeResponse("nope")).toBeNull();
    expect(parseServeResponse(42)).toBeNull();
    expect(parseServeResponse([])).toBeNull();
    expect(parseServeResponse({})).toBeNull();
    expect(parseServeResponse({ ...valid, size: "large" })).toBeNull();
    expect(parseServeResponse({ ...valid, house: "yes" })).toBeNull();
    expect(parseServeResponse({ ...valid, impressionId: 7 })).toBeNull();
    expect(parseServeResponse({ ...valid, ad: "ad" })).toBeNull();
    expect(parseServeResponse({ ...valid, ad: { ...valid.ad, name: 1 } })).toBeNull();
    expect(parseServeResponse({ ...valid, ad: { ...valid.ad, clickUrl: undefined } })).toBeNull();
    expect(parseServeResponse({ ...valid, ad: { ...valid.ad, logoUrl: 3 } })).toBeNull();
  });
});
