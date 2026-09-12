import { adminClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import { designMode, designSession } from "./design-mode";
import { env } from "./env";

export const authClient = createAuthClient({
  baseURL: env.VITE_API_URL,
  plugins: [adminClient()],
  fetchOptions: {
    credentials: "include",
  },
});

export const { signIn, signOut, signUp } = authClient;

/** Leave the session in the UI first. The API call can fail if the server is down. */
export async function signOutThen(after: () => void): Promise<void> {
  after();
  try {
    await signOut();
  } catch {
    // Already on login. A dead API must not keep the member in the app.
  }
}

type SessionResult = ReturnType<typeof authClient.useSession>;

/**
 * In design mode this returns a settled admin session, so ProtectedRoute and
 * AdminRoute both pass with no API. Outside design mode it is better-auth's own
 * hook, unchanged.
 */
export function useSession(): SessionResult {
  const real = authClient.useSession();
  if (!designMode) return real;
  return {
    data: designSession,
    isPending: false,
    isRefetching: false,
    error: null,
    refetch: real.refetch,
  } as SessionResult;
}
