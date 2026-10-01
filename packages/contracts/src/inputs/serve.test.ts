import { economy } from "@repo/config/economy";
import { describe, expect, it } from "vitest";
import { ringQuery } from "./serve";

describe("ringQuery", () => {
  it("takes a full batch by default", () => {
    expect(ringQuery.parse({ key: "dk_1" }).laps).toBe(economy.ring.laps);
  });

  it("takes zero laps: a status check that opens no play", () => {
    expect(ringQuery.parse({ key: "dk_1", laps: "0" }).laps).toBe(0);
  });

  it("refuses more laps than one batch holds", () => {
    expect(ringQuery.safeParse({ key: "dk_1", laps: String(economy.ring.laps + 1) }).success).toBe(
      false,
    );
  });
});
