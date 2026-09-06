import { AuthPage } from "../components/auth/auth-page";

/** /login and /signup are the same page; the mode is the only difference. */
export function SignupPage() {
  return <AuthPage mode="signup" />;
}
