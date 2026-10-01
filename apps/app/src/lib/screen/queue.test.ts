import { describe, expect, it } from "vitest";
import { type QueuedReport, drainable, enqueue, forget, trim } from "./queue";

const report = (playId: string, playedAt = "2026-09-01T10:00:00.000Z"): QueuedReport => ({
  playId,
  playedAt,
});

describe("enqueue", () => {
  it("keeps the report so a screen off the network loses nothing", () => {
    expect(enqueue([], report("p1"))).toEqual([report("p1")]);
  });
  it("reports one play once, however many times the screen asks", () => {
    const queue = enqueue(enqueue([], report("p1")), report("p1", "2026-09-01T11:00:00.000Z"));
    expect(queue).toEqual([report("p1")]);
  });
});

describe("forget", () => {
  it("drops the reports the server took", () => {
    const queue = [report("p1"), report("p2"), report("p3")];
    expect(forget(queue, ["p1", "p3"]).map((r) => r.playId)).toEqual(["p2"]);
  });
});

describe("trim", () => {
  it("drops the oldest once the queue is over its limit", () => {
    const queue = [report("p1"), report("p2"), report("p3")];
    expect(trim(queue, 2).map((r) => r.playId)).toEqual(["p2", "p3"]);
  });
  it("leaves a queue inside its limit alone", () => {
    const queue = [report("p1")];
    expect(trim(queue, 2)).toEqual(queue);
  });
});

describe("drainable", () => {
  const now = new Date("2026-09-01T12:00:00.000Z");
  it("holds back a report the server would refuse as expired", () => {
    const fresh = { ...report("p1"), expiresAt: "2026-09-01T13:00:00.000Z" };
    const stale = { ...report("p2"), expiresAt: "2026-09-01T11:00:00.000Z" };
    expect(drainable([fresh, stale], now).map((r) => r.playId)).toEqual(["p1"]);
  });
  it("sends a report that carries no deadline", () => {
    expect(drainable([report("p1")], now).map((r) => r.playId)).toEqual(["p1"]);
  });
});
