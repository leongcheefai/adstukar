import { describe, expect, it } from "vitest";
import { sessionHash } from "./session-hash";

describe("sessionHash", () => {
  it("is stable for the same visitor on the same day", () => {
    const d = new Date("2026-08-31T10:00:00.000Z");
    expect(sessionHash("1.2.3.4", "ua", d)).toBe(sessionHash("1.2.3.4", "ua", d));
  });

  it("differs between visitors", () => {
    const d = new Date("2026-08-31T10:00:00.000Z");
    expect(sessionHash("1.2.3.4", "ua", d)).not.toBe(sessionHash("1.2.3.5", "ua", d));
  });

  it("rotates across days", () => {
    const a = sessionHash("1.2.3.4", "ua", new Date("2026-08-31T23:59:00.000Z"));
    const b = sessionHash("1.2.3.4", "ua", new Date("2026-09-01T00:01:00.000Z"));
    expect(a).not.toBe(b);
  });
});
