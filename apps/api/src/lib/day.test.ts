import { describe, expect, it } from "vitest";
import { startOfUtcDay, startOfUtcWeek } from "./day";

describe("startOfUtcDay", () => {
  it("drops the time and keeps the UTC date", () => {
    expect(startOfUtcDay(new Date("2026-03-04T23:59:59Z")).toISOString()).toBe(
      "2026-03-04T00:00:00.000Z",
    );
  });
});

describe("startOfUtcWeek", () => {
  it("goes back to Monday", () => {
    // 2026-09-24 is a Thursday.
    expect(startOfUtcWeek(new Date("2026-09-24T15:00:00Z")).toISOString()).toBe(
      "2026-09-21T00:00:00.000Z",
    );
  });

  it("stays on a Monday", () => {
    expect(startOfUtcWeek(new Date("2026-09-21T00:00:00Z")).toISOString()).toBe(
      "2026-09-21T00:00:00.000Z",
    );
  });

  it("treats Sunday as the end of the week, not the start", () => {
    // 2026-09-27 is a Sunday.
    expect(startOfUtcWeek(new Date("2026-09-27T23:00:00Z")).toISOString()).toBe(
      "2026-09-21T00:00:00.000Z",
    );
  });
});
