import { describe, expect, it } from "vitest";
import { emptySeries } from "./series";

describe("emptySeries", () => {
  it("returns 30 consecutive UTC days ending today", () => {
    const series = emptySeries(new Date("2026-08-31T23:30:00.000Z"));
    const keys = [...series.keys()];
    expect(keys).toHaveLength(30);
    expect(keys[0]).toBe("2026-08-02");
    expect(keys.at(-1)).toBe("2026-08-31");
  });
});
