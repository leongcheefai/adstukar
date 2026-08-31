import { describe, expect, it } from "vitest";
import { domainFromUrl } from "./domain";

describe("domainFromUrl", () => {
  it("lower-cases and strips www", () => {
    expect(domainFromUrl("https://WWW.Example.com/path?x=1")).toBe("example.com");
  });
  it("keeps subdomains other than www", () => {
    expect(domainFromUrl("https://app.example.com")).toBe("app.example.com");
  });
  it("rejects non-http schemes", () => {
    expect(domainFromUrl("ftp://example.com")).toBeNull();
    expect(domainFromUrl("javascript:alert(1)")).toBeNull();
  });
  it("rejects garbage", () => {
    expect(domainFromUrl("not a url")).toBeNull();
  });
});
