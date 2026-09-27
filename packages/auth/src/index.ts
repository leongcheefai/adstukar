import { db, schema } from "@repo/db";
import {
  sendChangeEmailConfirmationEmail,
  sendDeleteAccountEmail,
  sendResetPasswordEmail,
  sendVerifyEmail,
  sendWelcomeEmail,
} from "@repo/emails";
import { serverEnv, trustedOrigins } from "@repo/env";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { APIError } from "better-auth/api";
import { admin } from "better-auth/plugins";
import { ACCOUNT_NOT_CLOSABLE, accountClosable } from "./closure";

export { ACCOUNT_NOT_CLOSABLE, accountClosable } from "./closure";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),
  secret: serverEnv.BETTER_AUTH_SECRET,
  baseURL: serverEnv.BETTER_AUTH_URL,
  trustedOrigins: [...trustedOrigins],
  // An OAuth failure that happens before the state is read (an expired or
  // mismatched state) redirects here with `?error=`. Without it Better Auth
  // sends the visitor to the API's own `/api/auth/error` page, off the app.
  onAPIError: { errorURL: new URL("/login", serverEnv.APP_URL).href },
  advanced: {
    defaultCookieAttributes:
      serverEnv.NODE_ENV === "production"
        ? // The API lives on the app's site (`api.<site>`, as `pnpm launch:check`
          // requires), so its cookies are first-party. SameSite=None keeps the
          // session cookie on the dashboard's cross-origin fetches. Move the API to
          // another site and a browser that blocks third-party cookies drops the
          // OAuth state cookie: Google sign-in then fails with `state_mismatch`.
          { sameSite: "none", secure: true }
        : { sameSite: "lax", secure: false },
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    sendVerificationEmail: async ({ user, url }: { user: { email: string }; url: string }) => {
      await sendVerifyEmail(user.email, url);
    },
    sendResetPassword: async ({ user, url }: { user: { email: string }; url: string }) => {
      await sendResetPasswordEmail(user.email, url);
    },
  },
  user: {
    changeEmail: {
      enabled: true,
      sendChangeEmailVerification: async ({
        user,
        newEmail,
        url,
      }: {
        user: { email: string };
        newEmail: string;
        url: string;
      }) => {
        await sendChangeEmailConfirmationEmail(newEmail, url, user.email);
      },
    },
    // Better Auth reads `deleteUser`. Under any other key the endpoint answers 404.
    deleteUser: {
      enabled: true,
      // Runs on both paths: the direct delete and the emailed link. The
      // dashboard asks `GET /me/closure` first, so a member rarely meets this.
      beforeDelete: async (user: { id: string }) => {
        if (!(await accountClosable(user.id))) {
          throw new APIError("FORBIDDEN", { message: ACCOUNT_NOT_CLOSABLE });
        }
      },
      sendDeleteAccountVerification: async ({
        user,
        url,
      }: {
        user: { email: string };
        url: string;
      }) => {
        await sendDeleteAccountEmail(user.email, url);
      },
    },
  },
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          // fire-and-forget — email failure must not break signup
          sendWelcomeEmail(user.email, user.name).catch((err) =>
            console.error("[auth] welcome email failed", err),
          );
        },
      },
    },
  },
  plugins: [admin()],
  socialProviders: {
    ...(serverEnv.GOOGLE_CLIENT_ID && serverEnv.GOOGLE_CLIENT_SECRET
      ? {
          google: {
            clientId: serverEnv.GOOGLE_CLIENT_ID,
            clientSecret: serverEnv.GOOGLE_CLIENT_SECRET,
            // A browser signed in to several Google accounts must be able to pick one.
            prompt: "select_account",
          },
        }
      : {}),
  },
});

export type Auth = typeof auth;

/** True when both Google credentials are set and the provider is registered. */
export const googleEnabled = Boolean(serverEnv.GOOGLE_CLIENT_ID && serverEnv.GOOGLE_CLIENT_SECRET);
