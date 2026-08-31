import { describe, expect, it } from "vitest";
import { bodyContainsToken, txtContainsToken } from "./verification";

describe("bodyContainsToken", () => {
  it("accepts the exact line with surrounding whitespace", () => {
    expect(bodyContainsToken("  adstukar-verify=abc123 \n", "abc123")).toBe(true);
  });
  it("accepts the token among other lines", () => {
    expect(bodyContainsToken("# hello\nadstukar-verify=abc123\nfoo", "abc123")).toBe(true);
  });
  it("rejects a partial or different token", () => {
    expect(bodyContainsToken("adstukar-verify=abc1234", "abc123")).toBe(false);
    expect(bodyContainsToken("adstukar-verify=xyz", "abc123")).toBe(false);
    expect(bodyContainsToken("", "abc123")).toBe(false);
  });
});

describe("txtContainsToken", () => {
  it("joins chunked TXT records", () => {
    expect(txtContainsToken([["adstukar-verify=", "abc123"]], "abc123")).toBe(true);
  });
  it("ignores unrelated records", () => {
    expect(txtContainsToken([["v=spf1 -all"], ["adstukar-verify=other"]], "abc123")).toBe(false);
  });
});
