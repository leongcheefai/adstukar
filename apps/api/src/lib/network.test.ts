import { describe, expect, it } from "vitest";
import { networkOf } from "./network";

describe("networkOf", () => {
  it("keeps the first three groups of an IPv4 address", () => {
    expect(networkOf("203.0.113.42")).toBe("203.0.113.0/24");
  });

  it("keeps the first four groups of an IPv6 address", () => {
    expect(networkOf("2001:db8:85a3:8d3:1319:8a2e:370:7348")).toBe("2001:db8:85a3:8d3::/64");
  });

  it("reads an IPv6 address that was shortened", () => {
    expect(networkOf("2001:db8::1")).toBe("2001:db8:0:0::/64");
  });

  it("refuses an address the server could not read", () => {
    expect(networkOf("unknown")).toBeNull();
    expect(networkOf("")).toBeNull();
    expect(networkOf("203.0.113")).toBeNull();
  });

  it("reads an IPv4 address inside an IPv6 one", () => {
    expect(networkOf("::ffff:203.0.113.42")).toBe("203.0.113.0/24");
  });
});
