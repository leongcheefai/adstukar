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
    env: {
      API_URL: preserve(),
      APP_URL: preserve(),
      BETTER_AUTH_SECRET: preserve(),
      BETTER_AUTH_URL: preserve(),
      DATABASE_URL: preserve(),
      JOBS_ENABLED: preserve(),
      NODE_ENV: preserve(),
      VITE_API_URL: preserve(),
    },
  });

  return project("adstukar", {
    resources: [api, Postgres, postgresVolume],
  });
});
