import * as z from "zod/v4";

export const healthStatusOutput = z.object({ ok: z.boolean() });

export type HealthStatusResponse = z.output<typeof healthStatusOutput>;
