import { describe, expect, it } from "vitest";
import { meUserOutput } from "./me";

describe("meUserOutput", () => {
  it("converts Better-Auth-shaped createdAt/updatedAt Dates to ISO strings and keeps other fields intact", () => {
    const result = meUserOutput.parse({
      user: {
        id: "user_1",
        name: "Ada Lovelace",
        email: "ada@example.com",
        emailVerified: true,
        image: "https://example.com/avatar.png",
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
        updatedAt: new Date("2026-02-01T00:00:00.000Z"),
        role: "admin",
        banned: false,
        banReason: null,
        banExpires: null,
      },
    });

    expect(result).toEqual({
      user: {
        id: "user_1",
        name: "Ada Lovelace",
        email: "ada@example.com",
        emailVerified: true,
        image: "https://example.com/avatar.png",
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-02-01T00:00:00.000Z",
        role: "admin",
        banned: false,
        banReason: null,
        banExpires: null,
      },
    });
  });

  it("accepts a user with the optional/nullable fields absent", () => {
    const result = meUserOutput.parse({
      user: {
        id: "user_2",
        name: "Grace Hopper",
        email: "grace@example.com",
        emailVerified: false,
        createdAt: new Date("2026-03-01T00:00:00.000Z"),
        updatedAt: new Date("2026-03-02T00:00:00.000Z"),
      },
    });

    expect(result).toEqual({
      user: {
        id: "user_2",
        name: "Grace Hopper",
        email: "grace@example.com",
        emailVerified: false,
        createdAt: "2026-03-01T00:00:00.000Z",
        updatedAt: "2026-03-02T00:00:00.000Z",
      },
    });
  });
});
