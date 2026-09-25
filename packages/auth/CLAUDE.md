# packages/auth

## Purpose
Better Auth server instance. Single source of truth for session management, email/password auth, Google OAuth, and email hook wiring. `apps/api` consumes this server configuration; the dashboard creates its browser client in `apps/app/src/lib/auth.ts`.

## Conventions
- `src/index.ts` (`auth`) is server-only — never import it in browser code; use `src/client.ts` or create a `better-auth/react` client as `apps/app` does
- Google OAuth activates only when both `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set — the conditional spread handles this automatically
- Welcome email is fire-and-forget (`.catch()`) so auth never fails if Resend is down; verify and reset emails are `await`ed intentionally

## Common tasks

### Enable Google OAuth
Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in the root `.env`. The conditional spread in `src/index.ts` activates the provider automatically. In the Google Cloud console, add `${BETTER_AUTH_URL}/api/auth/callback/google` as an authorized redirect URI; the API logs the exact value at boot as `auth_google`. The button lives in `apps/app/src/components/auth/auth-page.tsx`.

### Add a new OAuth provider
Add to the `socialProviders` object in `src/index.ts` using the same conditional pattern as Google.

### Add a new email hook
Add an entry to `databaseHooks` or extend the `emailAndPassword` callbacks. Import the sender from `@repo/emails`. Use fire-and-forget (`.catch()`) for non-critical emails.

### Require email verification on signup
Set `requireEmailVerification: true` in the `emailAndPassword` block.

## Gotchas
- `BETTER_AUTH_URL` must point at the API (where `/api/auth/*` is mounted), not the frontend
- `trustedOrigins` is set to `[APP_URL, WEB_URL]` — update it if either deploys to a different origin
- `signIn.social` needs **absolute** `callbackURL` and `errorCallbackURL` on the app's origin. Better Auth redirects to them verbatim from the API, so a relative `/` lands the member on the API's own `/` (a 404)
- The API must live on the app's site (`api.<site>`, which `pnpm launch:check` enforces). On another site, a browser that blocks third-party cookies drops the OAuth state cookie and Google sign-in fails with `?error=state_mismatch`
- In production the session cookie is `sameSite: "none"` so it rides the dashboard's cross-origin fetches. Dev stays `sameSite: "lax"` since `SameSite=None` requires `Secure`, which localhost-over-http can't satisfy
- `auth.$Infer.Session` is used by `apps/api/src/lib/context.ts` for the Hono `AppVariables` type — changing session shape affects the API context
