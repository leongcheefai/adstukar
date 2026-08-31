import * as z from "zod/v4";

/**
 * Wire<T> is the type-level mirror of what toWire() does at runtime: every Date
 * becomes the ISO string that JSON actually carries. Conditional types distribute
 * over unions, so `Date | null` resolves to `string | null`.
 */
export type Wire<T> = T extends Date
  ? string
  : T extends (infer U)[]
    ? Wire<U>[]
    : T extends object
      ? { [K in keyof T]: Wire<T[K]> }
      : T;

const wireDate = z.date().transform((d) => d.toISOString());

// instanceof rather than reading _zod.def.type: internals shift between zod
// releases, the constructors are public surface. Exception: v4's string-format
// subclasses (z.email(), z.uuid(), z.iso.datetime(), ...) do NOT extend
// ZodString, which is why ZodStringFormat must be matched explicitly below.
function convert(schema: z.core.SomeType): z.core.SomeType {
  if (schema instanceof z.ZodDate) return wireDate;
  if (schema instanceof z.ZodNullable) return z.nullable(convert(schema.unwrap()));
  if (schema instanceof z.ZodOptional) return z.optional(convert(schema.unwrap()));
  if (schema instanceof z.ZodArray) return z.array(convert(schema.element));
  if (schema instanceof z.ZodObject) return buildWireObject(schema);
  if (
    schema instanceof z.ZodString ||
    schema instanceof z.ZodStringFormat ||
    schema instanceof z.ZodNumber ||
    schema instanceof z.ZodBoolean ||
    schema instanceof z.ZodEnum
  ) {
    return schema;
  }
  // Everything else throws rather than passing through. A silent passthrough would
  // leak a raw Date while Wire<T> claims a string — precisely the drift this codec
  // exists to prevent. Anything reaching here (.default(), unions, records,
  // .refine(), tuples) needs an explicit decision, not a guess.
  const kind = (schema as { _zod?: { def?: { type?: string } } })._zod?.def?.type ?? "unknown";
  throw new Error(`toWire: unsupported schema type "${kind}"`);
}

// Rebuilds via plain z.object(next), so strict/catchall config on the input schema
// (e.g. z.strictObject) is silently dropped: the returned schema tolerates and
// strips extra keys instead of throwing. Harmless for the schemas this codec
// actually receives today, but worth knowing if that ever changes.
function buildWireObject(schema: z.ZodObject): z.ZodObject {
  const shape: z.core.$ZodShape = schema.shape;
  const next: Record<string, z.core.SomeType> = {};
  for (const key of Object.keys(shape)) {
    next[key] = convert(shape[key]);
  }
  return z.object(next);
}

/**
 * Rewrites every Date in an object schema into its ISO-string wire form.
 * z.input<T> stays the domain shape (Date, what drizzle hands the service);
 * z.output<T> becomes the wire shape (string, what the client receives).
 */
export function toWire<T extends z.ZodObject>(schema: T): z.ZodType<Wire<z.infer<T>>, z.input<T>> {
  // Cast justified: buildWireObject rewrites the shape at runtime in exactly the
  // way Wire<T> describes at the type level, but TypeScript cannot track a per-key
  // rewrite through a dynamic Object.keys() loop.
  return buildWireObject(schema) as unknown as z.ZodType<Wire<z.infer<T>>, z.input<T>>;
}
