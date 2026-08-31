import { describe, expect, it } from "vitest";
import { VERIFY_PREFIX, bodyContainsToken, txtContainsToken } from "./verification";

// Test fixture, not a credential: any string works because the check is equality.
const TOKEN = "test-token";
const LINE = `${VERIFY_PREFIX}${TOKEN}`;

describe("bodyContainsToken", () => {
  it("accepts the exact line with surrounding whitespace", () => {
    expect(bodyContainsToken(`  ${LINE} \n`, TOKEN)).toBe(true);
  });
  it("accepts the token among other lines", () => {
    expect(bodyContainsToken(`# hello\n${LINE}\nfoo`, TOKEN)).toBe(true);
  });
  it("rejects a partial or different token", () => {
    expect(bodyContainsToken(`${LINE}4`, TOKEN)).toBe(false);
    expect(bodyContainsToken(`${VERIFY_PREFIX}other`, TOKEN)).toBe(false);
    expect(bodyContainsToken("", TOKEN)).toBe(false);
  });
});

describe("txtContainsToken", () => {
  it("joins chunked TXT records", () => {
    expect(txtContainsToken([[VERIFY_PREFIX, TOKEN]], TOKEN)).toBe(true);
  });
  it("ignores unrelated records", () => {
    expect(txtContainsToken([["v=spf1 -all"], [`${VERIFY_PREFIX}other`]], TOKEN)).toBe(false);
  });
});
