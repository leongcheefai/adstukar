import { useSearchParams } from "react-router";
import { ForgotPasswordPage } from "../../routes/forgot-password";
import { ResetPasswordPage } from "../../routes/reset-password";
import { AuthPage } from "../auth/auth-page";

export function BootAuth() {
  const [params] = useSearchParams();
  const view = params.get("auth");

  return (
    <div className="boot-auth">
      {view === "forgot" ? (
        <ForgotPasswordPage embedded />
      ) : view === "reset" ? (
        <ResetPasswordPage embedded />
      ) : (
        <AuthPage mode={view === "signup" ? "signup" : "login"} embedded />
      )}
    </div>
  );
}
