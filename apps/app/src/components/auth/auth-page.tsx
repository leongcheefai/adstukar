import { Button, Input, Label, Separator } from "@repo/ui";
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { signIn, signUp } from "../../lib/auth";
import "../../styles/capytv.css";
import { CapyLockup } from "../capytv/lockup";

/** The four-colour Google mark. Inline, so the button needs no network request. */
function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-4 shrink-0">
      <path
        fill="#4285F4"
        d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.63h6.46a5.53 5.53 0 0 1-2.4 3.63v3.02h3.89c2.27-2.09 3.57-5.17 3.57-8.83Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.08 7.95-2.9l-3.89-3.02c-1.08.72-2.45 1.15-4.06 1.15-3.12 0-5.77-2.11-6.71-4.95H1.28v3.11A12 12 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.29 14.28a7.2 7.2 0 0 1 0-4.56V6.61H1.28a12 12 0 0 0 0 10.78l4.01-3.11Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.77c1.76 0 3.34.61 4.59 1.8l3.44-3.44C17.95 1.19 15.24 0 12 0A12 12 0 0 0 1.28 6.61l4.01 3.11C6.23 6.88 8.88 4.77 12 4.77Z"
      />
    </svg>
  );
}

export type AuthMode = "login" | "signup";

/**
 * One page serves both /login and /signup. Everything that differs between the
 * two lives in this table, so the layout below reads as one form and a reviewer
 * can see the whole difference in one place.
 */
const COPY = {
  login: {
    title: "Sign in",
    subtitle: "Sign in to start CapyTV.",
    google: "Sign in with Google",
    submit: "Sign in",
    submitting: "Signing in…",
    failed: "Sign in failed",
    footer: "Don’t have an account?",
    footerLink: "Create one",
  },
  signup: {
    title: "Create account",
    subtitle: "Free to join. Pick a source and start CapyTV.",
    google: "Sign up with Google",
    submit: "Create account",
    submitting: "Creating account…",
    failed: "Sign up failed",
    footer: "Already have an account?",
    footerLink: "Sign in",
  },
} as const;

export function AuthPage({
  mode,
  embedded = false,
}: {
  mode: AuthMode;
  /** Form only. The CapyTV boot mark already holds the brand. */
  embedded?: boolean;
}) {
  const navigate = useNavigate();
  const { search } = useLocation();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const isSignup = mode === "signup";
  const copy = COPY[mode];
  const signupHref = embedded ? "/?auth=signup" : "/signup";
  const loginHref = embedded ? "/" : "/login";
  const forgotHref = embedded ? "/?auth=forgot" : "/forgot-password";
  const errorId = "auth-error";
  const invalid = Boolean(error);

  function clearError() {
    if (error) setError("");
  }

  function redirectAfterAuth() {
    const params = new URLSearchParams(search);
    const redirectTo = params.get("redirect");
    const safe = redirectTo?.startsWith("/") && !redirectTo.startsWith("//") ? redirectTo : "/";
    navigate(safe, { replace: true });
  }

  async function handleGoogle() {
    setError("");
    setLoading(true);
    try {
      const result = await signIn.social({ provider: "google", callbackURL: "/" });
      if (result.error) setError(result.error.message ?? copy.failed);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = isSignup
        ? await signUp.email({ name, email, password })
        : await signIn.email({ email, password });
      if (result.error) {
        setError(result.error.message ?? copy.failed);
        return;
      }
      redirectAfterAuth();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const footer = (
    <p className={embedded ? "boot-auth-footer" : "mt-6 text-center text-sm text-muted-foreground"}>
      {copy.footer}{" "}
      <Link
        to={isSignup ? loginHref : signupHref}
        className={
          embedded ? "boot-auth-switch" : "text-foreground underline-offset-4 hover:underline"
        }
      >
        {copy.footerLink}
      </Link>
    </p>
  );

  const fields = (
    <>
      <Button
        type="button"
        variant="outline"
        className="w-full gap-2.5"
        onClick={() => void handleGoogle()}
        disabled={loading}
      >
        <GoogleIcon />
        {copy.google}
      </Button>

      <div className={embedded ? "boot-auth-rule" : "my-6 flex items-center gap-4"}>
        <Separator className="flex-1" />
        <span className="text-xs text-muted-foreground">or</span>
        <Separator className="flex-1" />
      </div>

      <form onSubmit={handleSubmit} className={embedded ? "boot-auth-fields" : "space-y-4"}>
        {(isSignup || embedded) && (
          <div
            className={embedded && !isSignup ? "space-y-1.5 boot-auth-hold" : "space-y-1.5"}
            data-auth-slot="name"
            inert={embedded && !isSignup ? true : undefined}
            aria-hidden={embedded && !isSignup ? true : undefined}
          >
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              type="text"
              placeholder="Your name"
              value={name}
              onChange={(e) => {
                clearError();
                setName(e.target.value);
              }}
              required={isSignup}
              tabIndex={embedded && !isSignup ? -1 : undefined}
              autoComplete="name"
              spellCheck={false}
              aria-invalid={isSignup && invalid ? true : undefined}
              aria-describedby={isSignup && invalid ? errorId : undefined}
              className="h-11 text-base md:text-base"
            />
          </div>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => {
              clearError();
              setEmail(e.target.value);
            }}
            required
            autoComplete="email"
            aria-invalid={invalid || undefined}
            aria-describedby={invalid ? errorId : undefined}
            className="h-11 text-base md:text-base"
          />
        </div>

        <div className="space-y-1.5">
          <div
            className={embedded ? "boot-auth-password-row" : "flex items-center justify-between"}
          >
            <Label htmlFor="password">Password</Label>
            <Link
              to={forgotHref}
              tabIndex={isSignup ? -1 : undefined}
              aria-hidden={isSignup || undefined}
              className={
                embedded
                  ? isSignup
                    ? "boot-auth-forgot boot-auth-hold"
                    : "boot-auth-forgot"
                  : isSignup
                    ? "hidden"
                    : "text-xs text-muted-foreground hover:text-foreground"
              }
            >
              Forgot password?
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => {
              clearError();
              setPassword(e.target.value);
            }}
            required
            autoComplete={isSignup ? "new-password" : "current-password"}
            minLength={isSignup ? 8 : undefined}
            aria-invalid={invalid || undefined}
            aria-describedby={invalid ? errorId : undefined}
            className="h-11 text-base md:text-base"
          />
          {(isSignup || embedded) && (
            <p
              className={
                embedded && !isSignup
                  ? "text-xs text-muted-foreground boot-auth-hold"
                  : "text-xs text-muted-foreground"
              }
            >
              At least 8 characters.
            </p>
          )}
        </div>

        <p
          id={errorId}
          className={embedded ? "boot-auth-error" : "text-sm text-destructive"}
          role="alert"
        >
          {error || (embedded ? "\u00a0" : null)}
        </p>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? copy.submitting : copy.submit}
        </Button>
      </form>
    </>
  );

  if (embedded) {
    return (
      <main className="boot-auth-card" data-mode={mode}>
        <header className="boot-auth-intro">
          <div className="boot-auth-copy">
            <h1 className="boot-auth-title">{copy.title}</h1>
            <p className="boot-auth-lede">{copy.subtitle}</p>
          </div>
          {footer}
        </header>
        <div className="boot-auth-panel">{fields}</div>
      </main>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-8 bg-[#08080a] p-6">
      <CapyLockup className="h-10 w-auto" />
      <main className="w-full max-w-lg rounded-2xl bg-card p-8 text-card-foreground shadow-[var(--elev-3)]">
        <h1 className="text-2xl font-semibold tracking-tight text-balance">{copy.title}</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">{copy.subtitle}</p>
        <div className="mt-8">{fields}</div>
        {footer}
      </main>
    </div>
  );
}
