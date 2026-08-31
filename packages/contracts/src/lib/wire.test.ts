import { describe, expect, expectTypeOf, it } from "vitest";
import * as z from "zod/v4";
import { toWire } from "./wire";

describe("toWire", () => {
  it("converts a Date field to an ISO string", () => {
    const schema = toWire(z.object({ createdAt: z.date() }));
    expect(schema.parse({ createdAt: new Date("2026-07-17T10:00:00.000Z") })).toEqual({
      createdAt: "2026-07-17T10:00:00.000Z",
    });
  });

  it("keeps null for a nullable Date", () => {
    const schema = toWire(z.object({ publishedAt: z.date().nullable() }));
    expect(schema.parse({ publishedAt: null })).toEqual({ publishedAt: null });
  });

  it("converts a nullable Date when a value is present", () => {
    const schema = toWire(z.object({ publishedAt: z.date().nullable() }));
    expect(schema.parse({ publishedAt: new Date("2026-01-02T03:04:05.000Z") })).toEqual({
      publishedAt: "2026-01-02T03:04:05.000Z",
    });
  });

  it("keeps undefined for an absent optional Date", () => {
    const schema = toWire(z.object({ banExpires: z.date().optional() }));
    expect(schema.parse({})).toStrictEqual({});
  });

  it("converts an optional Date when a value is present", () => {
    const schema = toWire(z.object({ banExpires: z.date().optional() }));
    expect(schema.parse({ banExpires: new Date("2026-02-03T04:05:06.000Z") })).toEqual({
      banExpires: "2026-02-03T04:05:06.000Z",
    });
  });

  it("converts a Date nested inside an object", () => {
    const schema = toWire(z.object({ meta: z.object({ syncedAt: z.date() }) }));
    expect(schema.parse({ meta: { syncedAt: new Date("2026-03-04T00:00:00.000Z") } })).toEqual({
      meta: { syncedAt: "2026-03-04T00:00:00.000Z" },
    });
  });

  it("converts Dates inside an array of objects", () => {
    const schema = toWire(z.object({ rows: z.array(z.object({ at: z.date() })) }));
    expect(schema.parse({ rows: [{ at: new Date("2026-05-06T00:00:00.000Z") }] })).toEqual({
      rows: [{ at: "2026-05-06T00:00:00.000Z" }],
    });
  });

  it("passes non-Date fields through untouched", () => {
    const schema = toWire(
      z.object({
        id: z.string(),
        count: z.number(),
        ok: z.boolean(),
        tag: z.enum(["a", "b"]),
      }),
    );
    expect(schema.parse({ id: "x", count: 2, ok: true, tag: "a" })).toEqual({
      id: "x",
      count: 2,
      ok: true,
      tag: "a",
    });
  });

  it("passes zod v4 string-format subclasses through untouched", () => {
    const schema = toWire(
      z.object({
        email: z.email(),
        url: z.url(),
        id: z.uuid(),
        at: z.iso.datetime(),
      }),
    );
    const input = {
      email: "a@b.com",
      url: "https://example.com",
      id: "123e4567-e89b-12d3-a456-426614174000",
      at: "2026-07-17T10:00:00.000Z",
    };
    expect(schema.parse(input)).toEqual(input);
  });

  it("converts a Date nested alongside a zod v4 string-format subclass", () => {
    const schema = toWire(z.object({ email: z.email(), createdAt: z.date() }));
    expect(
      schema.parse({ email: "a@b.com", createdAt: new Date("2026-07-17T10:00:00.000Z") }),
    ).toEqual({
      email: "a@b.com",
      createdAt: "2026-07-17T10:00:00.000Z",
    });
  });

  it("rejects a non-Date value in a Date field", () => {
    const schema = toWire(z.object({ createdAt: z.date() }));
    expect(() => schema.parse({ createdAt: "2026-07-17" })).toThrow();
  });

  it("throws on an unsupported schema type rather than passing a Date through", () => {
    expect(() => toWire(z.object({ at: z.date().default(new Date()) }))).toThrow(
      /unsupported schema type/,
    );
  });

  it("types z.input as Date and z.output as string", () => {
    const schema = toWire(z.object({ publishedAt: z.date().nullable(), syncedAt: z.date() }));
    expectTypeOf<z.output<typeof schema>>().toEqualTypeOf<{
      publishedAt: string | null;
      syncedAt: string;
    }>();
    expectTypeOf<z.input<typeof schema>>().toEqualTypeOf<{
      publishedAt: Date | null;
      syncedAt: Date;
    }>();
  });
});
