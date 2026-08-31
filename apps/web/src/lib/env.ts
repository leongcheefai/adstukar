import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

// Baked in at Astro build time. Mirrors apps/app/src/lib/env.ts — @repo/env is
// server-only (reads process.env), so browser-exposed vars are validated here instead.
export const env = createEnv({
  clientPrefix: "PUBLIC_",
  client: {
    PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
    PUBLIC_API_URL: z.string().url().default("http://localhost:3001"),
  },
  runtimeEnv: import.meta.env,
});
