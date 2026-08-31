import { describe, expect, it } from "vitest";
import { createRateLimiter } from "./rate-limit";

describe("createRateLimiter", () => {
  it("allows up to the limit inside one window and blocks the next call", () => {
    const rl = createRateLimiter({ limit: 3, windowMs: 1000 });
    expect(rl.hit("a", 0)).toBe(true);
    expect(rl.hit("a", 10)).toBe(true);
    expect(rl.hit("a", 20)).toBe(true);
    expect(rl.hit("a", 30)).toBe(false);
  });

  it("frees a slot once the oldest hit leaves the window", () => {
    const rl = createRateLimiter({ limit: 2, windowMs: 1000 });
    rl.hit("a", 0);
    rl.hit("a", 500);
    expect(rl.hit("a", 900)).toBe(false);
    expect(rl.hit("a", 1001)).toBe(true);
  });

  it("keys are independent", () => {
    const rl = createRateLimiter({ limit: 1, windowMs: 1000 });
    expect(rl.hit("a", 0)).toBe(true);
    expect(rl.hit("b", 0)).toBe(true);
    expect(rl.hit("a", 1)).toBe(false);
  });
});
