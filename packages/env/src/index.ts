import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const serverEnv = createEnv({
  server: {
    DATABASE_URL: z.string().url(),
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    PORT: z.coerce.number().default(3001),
    APP_URL: z.string().url().default("http://localhost:3000"),
    WEB_URL: z.string().url().default("http://localhost:4321"),
    BETTER_AUTH_SECRET: z.string().min(32),
    BETTER_AUTH_URL: z.string().url().default("http://localhost:3001"),
    GOOGLE_CLIENT_ID: z.string().optional(),
    GOOGLE_CLIENT_SECRET: z.string().optional(),
    STRIPE_SECRET_KEY: z.string().min(1).optional(),
    STRIPE_WEBHOOK_SECRET: z.string().min(1).optional(),
    STRIPE_PRO_PRICE_ID_MONTHLY: z.string().optional(),
    STRIPE_PRO_PRICE_ID_YEARLY: z.string().optional(),
    RESEND_API_KEY: z.string().optional(),
    S3_REGION: z.string().default("auto"), // 'auto' for R2; set to 'us-east-1' etc for AWS S3
    S3_BUCKET: z.string().min(1).optional(),
    S3_ACCESS_KEY_ID: z.string().min(1).optional(),
    S3_SECRET_ACCESS_KEY: z.string().min(1).optional(),
    S3_ENDPOINT: z.string().url().optional(), // for Cloudflare R2
    S3_PUBLIC_URL: z.string().url().optional(), // CDN base URL
    GITHUB_TOKEN: z.string().min(1).optional(),
    GITHUB_OWNER: z.string().min(1).optional(),
    GITHUB_REPO: z.string().min(1).optional(),
  },
  runtimeEnv: process.env,
});
