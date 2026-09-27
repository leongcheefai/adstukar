import { defineRailway, github, postgres, preserve, project, service, volume } from "railway/iac";

export default defineRailway(() => {
  const Postgres = postgres("Postgres", { region: "asia-southeast1-eqsg3a" });
  const postgresVolume = volume("postgres-volume", {
    alerts: { usage: { "100": {}, "80": {}, "95": {} } },
    allowOnlineResize: true,
    region: "asia-southeast1-eqsg3a",
    sizeMB: 5000,
  });
  const api = service("api", {
    source: github("leongcheefai/adstukar", { branch: "master", checkSuites: false }),
    build: {
      buildCommand: "pnpm --filter @repo/embed build",
      buildEnvironment: "V3",
      builder: "RAILPACK",
      watchPatterns: ["/apps/api/**", "/apps/embed/**", "/packages/**"],
    },
    start: "pnpm --filter @repo/api start",
    replicas: { "asia-southeast1-eqsg3a": 1 },
    deploy: { preDeployCommand: ["pnpm db:migrate"] },
    networking: { privateNetworkEndpoint: "adstukar" },
    // IaC is declarative: a variable missing here is one `railway apply` plans to
    // delete. Secrets are set in the Railway dashboard; `preserve()` keeps them.
    env: {
      API_URL: preserve(),
      APP_URL: preserve(),
      BETTER_AUTH_SECRET: preserve(),
      BETTER_AUTH_URL: preserve(),
      DATABASE_URL: preserve(),
      GOOGLE_CLIENT_ID: preserve(),
      GOOGLE_CLIENT_SECRET: preserve(),
      JOBS_ENABLED: preserve(),
      NODE_ENV: preserve(),
      RESEND_API_KEY: preserve(),
      S3_ACCESS_KEY_ID: preserve(),
      S3_BUCKET: preserve(),
      S3_ENDPOINT: preserve(),
      S3_PUBLIC_URL: preserve(),
      S3_REGION: preserve(),
      S3_SECRET_ACCESS_KEY: preserve(),
      STRIPE_CONNECT_WEBHOOK_SECRET: preserve(),
      STRIPE_SECRET_KEY: preserve(),
      STRIPE_WEBHOOK_SECRET: preserve(),
      VITE_API_URL: preserve(),
      WEB_URL: preserve(),
    },
  });

  return project("adstukar", {
    resources: [api, Postgres, postgresVolume],
  });
});
