import { adminClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
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
    // Already off the member screens. A dead API must not keep the member in the app.
  }
}

export const useSession = authClient.useSession;
