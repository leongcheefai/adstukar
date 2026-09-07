import { project } from "@repo/config/project";
import { Button, Input, Label, Separator } from "@repo/ui";
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { signIn, signUp } from "../../lib/auth";

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
    subtitle: "Welcome back. Sign in to your dashboard.",
    google: "Sign in with Google",
    submit: "Sign in",
    submitting: "Signing in…",
    failed: "Sign in failed",
    footer: "Don't have an account?",
    footerLink: "Create one",
    footerHref: "/signup",
    panel: "Sign in to check your balance, your placements, and your payouts.",
  },
  signup: {
    title: "Create your account",
    subtitle: "Free to join. Show ads, earn credits, cash out.",
    google: "Sign up with Google",
    submit: "Create account",
    submitting: "Creating account…",
    failed: "Sign up failed",
    footer: "Already have an account?",
    footerLink: "Sign in",
    footerHref: "/login",
    panel: "Register once, paste one snippet, and earn credits from your first verified view.",
  },
} as const;

export function AuthPage({ mode }: { mode: AuthMode }) {
  const navigate = useNavigate();
  const { search } = useLocation();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const isSignup = mode === "signup";
  const copy = COPY[mode];

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
      // Only sign-in honours ?redirect. A new account has nothing to return to.
      const params = new URLSearchParams(search);
      const redirectTo = isSignup ? null : params.get("redirect");
      const safe =
        redirectTo?.startsWith("/") && !redirectTo.startsWith("//") ? redirectTo : "/dashboard";
      navigate(safe, { replace: true });
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* Brand panel. Hidden below lg: on a phone it would push the form off the
          first screen, and the form is the only thing anyone came here for. */}
      <aside className="hidden w-1/2 flex-col justify-between bg-slab p-12 text-slab-foreground lg:flex">
        <span className="text-lg font-semibold tracking-tight">{project.name}</span>

        <div className="max-w-sm">
          <p className="text-4xl font-medium leading-[1.1] tracking-[-0.02em]">
            Show ads.
            <br />
            Earn credits.
            <br />
            Cash out.
          </p>
          <p className="mt-6 text-sm leading-relaxed text-slab-foreground/70">{copy.panel}</p>
        </div>

        <p className="text-xs text-slab-foreground/60">
          No card. No cookies. A person reviews every listing.
        </p>
      </aside>

      <main className="flex w-full items-center justify-center p-6 lg:w-1/2">
        <div className="w-full max-w-sm">
          {/* The brand only shows here while the blue panel is hidden. */}
          <span className="mb-8 block text-lg font-semibold tracking-tight lg:hidden">
            {project.name}
          </span>

          <h1 className="text-2xl font-semibold tracking-tight">{copy.title}</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">{copy.subtitle}</p>

          {/* Design only: no handler yet, so the button does nothing. To make it
              work, call signIn.social({ provider: "google", callbackURL: "/dashboard" }). */}
          <Button type="button" variant="outline" className="mt-8 w-full gap-2.5">
            <GoogleIcon />
            {copy.google}
          </Button>

          <div className="my-6 flex items-center gap-4">
            <Separator className="flex-1" />
            <span className="text-xs text-muted-foreground">or</span>
            <Separator className="flex-1" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignup && (
              <div className="space-y-1.5">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoComplete="name"
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
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                {!isSignup && (
                  <Link
                    to="/forgot-password"
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    Forgot password?
                  </Link>
                )}
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete={isSignup ? "new-password" : "current-password"}
                minLength={isSignup ? 8 : undefined}
              />
              {isSignup && <p className="text-xs text-muted-foreground">At least 8 characters.</p>}
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? copy.submitting : copy.submit}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {copy.footer}{" "}
            <Link
              to={copy.footerHref}
              className="text-foreground underline-offset-4 hover:underline"
            >
              {copy.footerLink}
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
