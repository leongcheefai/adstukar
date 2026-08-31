import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  clientPrefix: "VITE_",
  client: {
    VITE_API_URL: z.string().url().default("http://localhost:3001"),
    // Where the built embed bundle is hosted. The API serves apps/embed/dist under /embed
    // in development; point this at a CDN path in production.
    VITE_EMBED_URL: z.string().url().default("http://localhost:3001/embed/adstukar.js"),
  },
  runtimeEnv: import.meta.env,
});
