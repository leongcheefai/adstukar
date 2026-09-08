import { describe, expect, it } from "vitest";
import { clampReportedAt, expiresAtFor, planLoop } from "./loop";

const at = (iso: string) => new Date(iso);

describe("planLoop", () => {
  const placements = [
    { id: "band", lastPlayedAt: at("2026-09-01T10:00:00Z") },
    { id: "ticker", lastPlayedAt: at("2026-09-01T09:00:00Z") },
  ];

  it("cycles the regions so one region never takes the whole loop", () => {
    const steps = planLoop({
      placements,
      candidatesByPlacement: {
        band: [{ listingId: "a", lastPlayedAt: null }],
        ticker: [{ listingId: "b", lastPlayedAt: null }],
      },
      size: 4,
    });
    expect(steps.map((s) => s.placementId)).toEqual(["ticker", "band", "ticker", "band"]);
  });

  it("starts with the region that has waited longest", () => {
    const steps = planLoop({
      placements,
      candidatesByPlacement: { band: [], ticker: [] },
      size: 1,
    });
    expect(steps[0]?.placementId).toBe("ticker");
  });

  it("spreads the listings instead of repeating the freshest one", () => {
    const steps = planLoop({
      placements: [{ id: "band", lastPlayedAt: null }],
      candidatesByPlacement: {
        band: [
          { listingId: "a", lastPlayedAt: null },
          { listingId: "b", lastPlayedAt: at("2026-09-01T09:00:00Z") },
        ],
      },
      size: 4,
    });
    expect(steps.map((s) => s.listingId)).toEqual(["a", "b", "a", "b"]);
  });

  it("plans a house play when a region has nothing paid to show", () => {
    const steps = planLoop({
      placements: [{ id: "band", lastPlayedAt: null }],
      candidatesByPlacement: { band: [] },
      size: 2,
    });
    expect(steps.map((s) => s.listingId)).toEqual([null, null]);
  });

  it("returns nothing when the device holds no placement", () => {
    expect(planLoop({ placements: [], candidatesByPlacement: {}, size: 5 })).toEqual([]);
  });

  it("never returns more steps than the size asked for", () => {
    const steps = planLoop({
      placements,
      candidatesByPlacement: { band: [{ listingId: "a", lastPlayedAt: null }], ticker: [] },
      size: 3,
    });
    expect(steps).toHaveLength(3);
  });
});

describe("expiresAtFor", () => {
  const now = at("2026-09-01T10:00:00Z");
  it("gives a live serve the short window", () => {
    expect(expiresAtFor("serve", now).toISOString()).toBe("2026-09-01T10:10:00.000Z");
  });
  it("gives a cached loop the long window", () => {
    expect(expiresAtFor("loop", now).toISOString()).toBe("2026-09-01T14:00:00.000Z");
  });
});

describe("clampReportedAt", () => {
  const openedAt = at("2026-09-01T10:00:00Z");
  const now = at("2026-09-01T12:00:00Z");

  it("takes the moment the device says it played", () => {
    const played = at("2026-09-01T10:30:00Z");
    expect(clampReportedAt({ playedAt: played, openedAt, now })).toEqual(played);
  });
  it("falls back to now when the device sent no moment", () => {
    expect(clampReportedAt({ playedAt: null, openedAt, now })).toEqual(now);
  });
  it("refuses a moment before the play opened", () => {
    expect(clampReportedAt({ playedAt: at("2026-09-01T09:00:00Z"), openedAt, now })).toEqual(
      openedAt,
    );
  });
  it("refuses a moment in the future", () => {
    expect(clampReportedAt({ playedAt: at("2026-09-01T13:00:00Z"), openedAt, now })).toEqual(now);
  });
});
