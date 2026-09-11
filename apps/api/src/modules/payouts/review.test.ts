import { describe, expect, it } from "vitest";
import { countBy, flagDevice, normaliseLocation, outOfHoursPlays, scanRatio } from "./review";

describe("scanRatio", () => {
  it("reports scans over plays", () => {
    expect(scanRatio(1_000, 5)).toBe(0.005);
  });

  it("reports nothing for a screen that never played", () => {
    expect(scanRatio(0, 0)).toBe(0);
  });
});

describe("normaliseLocation", () => {
  it("reads two spellings of one address as one place", () => {
    expect(normaliseLocation("  12 High  Street ")).toBe(normaliseLocation("12 HIGH STREET"));
  });
});

describe("countBy", () => {
  it("counts each value and drops the empty ones", () => {
    const counts = countBy(["a", "a", "b", null]);
    expect(counts.get("a")).toBe(2);
    expect(counts.get("b")).toBe(1);
    expect(counts.size).toBe(2);
  });
});

const now = new Date("2026-03-31T00:00:00Z");

function stat(over: Partial<Parameters<typeof flagDevice>[0]> = {}) {
  return {
    deviceId: "d1",
    plays: 10_000,
    scans: 100,
    playsByHour: Array.from({ length: 24 }, (_, hour) => (hour >= 8 && hour < 18 ? 40 : 0)),
    lastSeenAt: new Date("2026-03-30T00:00:00Z"),
    lastNetwork: "203.0.113.0/24",
    location: "12 High Street",
    openHour: 8,
    closeHour: 18,
    ...over,
  };
}

const alone = {
  networkCounts: new Map([["203.0.113.0/24", 1]]),
  locationCounts: new Map([[normaliseLocation("12 High Street"), 1]]),
  now,
};

describe("flagDevice", () => {
  it("flags nothing on a screen that plays office hours and gets scanned", () => {
    const flags = flagDevice(stat(), alone);
    expect(flags.lowScanRatio).toBe(false);
    expect(flags.sharedNetwork).toBe(false);
    expect(flags.sharedLocation).toBe(false);
    expect(flags.activeHours).toBe(10);
    expect(flags.daysSilent).toBe(1);
    expect(flags.outOfHoursPlays).toBe(0);
  });

  it("counts the plays a screen ran while the venue states it is shut", () => {
    const flags = flagDevice(stat({ playsByHour: Array.from({ length: 24 }, () => 20) }), alone);
    expect(flags.outOfHoursPlays).toBe(280);
  });

  it("counts none against a venue that states no hours", () => {
    const flags = flagDevice(stat({ openHour: null, closeHour: null }), alone);
    expect(flags.outOfHoursPlays).toBe(0);
  });

  it("flags thousands of plays and no scans", () => {
    const flags = flagDevice(stat({ scans: 0 }), alone);
    expect(flags.scanRatio).toBe(0);
    expect(flags.lowScanRatio).toBe(true);
  });

  it("says nothing about the scan ratio on too few plays", () => {
    const flags = flagDevice(stat({ plays: 10, scans: 0 }), alone);
    expect(flags.lowScanRatio).toBe(false);
  });

  it("flags a second device on the same network", () => {
    const flags = flagDevice(stat(), {
      ...alone,
      networkCounts: new Map([["203.0.113.0/24", 3]]),
    });
    expect(flags.sharedNetwork).toBe(true);
  });

  it("flags a second device at the same address", () => {
    const flags = flagDevice(stat(), {
      ...alone,
      locationCounts: new Map([[normaliseLocation("12 high street"), 2]]),
    });
    expect(flags.sharedLocation).toBe(true);
  });

  it("counts every hour a screen that never stops", () => {
    const flags = flagDevice(stat({ playsByHour: Array.from({ length: 24 }, () => 20) }), alone);
    expect(flags.activeHours).toBe(24);
  });

  it("reports no silence for a screen that never reported", () => {
    expect(flagDevice(stat({ lastSeenAt: null }), alone).daysSilent).toBeNull();
  });
});

describe("outOfHoursPlays", () => {
  // Ten plays in every hour, so each hour outside the window adds ten.
  const everyHour = Array.from({ length: 24 }, () => 10);

  it("counts the plays outside a daytime window", () => {
    expect(outOfHoursPlays(everyHour, 9, 17)).toBe(160);
  });

  it("reads a window that crosses midnight as one stretch", () => {
    expect(outOfHoursPlays(everyHour, 20, 4)).toBe(160);
  });

  it("counts nothing when the venue states no hours", () => {
    expect(outOfHoursPlays(everyHour, null, null)).toBe(0);
  });

  it("counts nothing for a venue open around the clock", () => {
    expect(outOfHoursPlays(everyHour, 0, 0)).toBe(0);
  });

  it("counts the plays a closed room ran overnight", () => {
    const daytime = Array.from({ length: 24 }, (_, hour) => (hour >= 9 && hour < 17 ? 40 : 0));
    expect(outOfHoursPlays(daytime, 9, 17)).toBe(0);
  });
});
