import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label } from "@repo/ui";
import { useState } from "react";
import { Link, useSearchParams } from "react-router";
import { authClient } from "../lib/auth";

/** Better Auth's floor for a password. A shorter one fails on the server anyway. */
const MIN_PASSWORD_LENGTH = 8;

/**
 * Where the reset email lands. The link opens on the API, which checks the token
 * and sends the member here with `?token=`, or with `?error=INVALID_TOKEN` when
 * the link is old or used.
 */
export function ResetPasswordPage({ embedded = false }: { embedded?: boolean }) {
  const [params] = useSearchParams();
  const token = params.get("token");
  const linkBroken = !token || params.get("error") !== null;

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Use at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }
    if (password !== confirm) {
      setError("The two passwords do not match.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const result = await authClient.resetPassword({ newPassword: password, token });
      if (result.error) {
        setError(result.error.message ?? "Failed to reset password");
      } else {
        setDone(true);
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const signInHref = embedded ? "/?auth=login" : "/login";
  const forgotHref = embedded ? "/?auth=forgot" : "/forgot-password";
  const errorId = "reset-error";
  const invalid = Boolean(error);

  let body: React.ReactNode;
  if (done) {
    body = (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">Your password is changed. Sign in with it.</p>
        <Button asChild className="w-full">
          <Link to={signInHref}>Sign in</Link>
        </Button>
      </div>
    );
  } else if (linkBroken) {
    body = (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          This reset link has expired or was already used. Ask for a new one.
        </p>
        <Button asChild className="w-full">
          <Link to={forgotHref}>Send a new link</Link>
        </Button>
        <Button asChild variant="ghost" className="w-full">
          <Link to={signInHref}>Back to sign in</Link>
        </Button>
      </div>
    );
  } else {
    body = (
      <form onSubmit={handleSubmit} className={embedded ? "boot-auth-fields" : "space-y-4"}>
        <div className="space-y-1.5">
          <Label htmlFor="reset-password">New password</Label>
          <Input
            id="reset-password"
            type="password"
            value={password}
            onChange={(e) => {
              if (error) setError("");
              setPassword(e.target.value);
            }}
            required
            minLength={MIN_PASSWORD_LENGTH}
            autoComplete="new-password"
            aria-invalid={invalid || undefined}
            aria-describedby={invalid ? errorId : undefined}
            className="h-11 text-base md:text-base"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="reset-confirm">Confirm new password</Label>
          <Input
            id="reset-confirm"
            type="password"
            value={confirm}
            onChange={(e) => {
              if (error) setError("");
              setConfirm(e.target.value);
            }}
            required
            autoComplete="new-password"
            aria-invalid={invalid || undefined}
            aria-describedby={invalid ? errorId : undefined}
            className="h-11 text-base md:text-base"
          />
        </div>
        <p
          id={errorId}
          className={embedded ? "boot-auth-error" : "text-sm text-destructive"}
          role="alert"
        >
          {error || (embedded ? " " : null)}
        </p>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Saving…" : "Set new password"}
        </Button>
      </form>
    );
  }

  if (embedded) {
    return (
      <main className="boot-auth-card">
        <header className="boot-auth-intro">
          <div className="boot-auth-copy">
            <h1 className="boot-auth-title">Choose a new password</h1>
            <p className="boot-auth-lede">Then sign in with it.</p>
          </div>
        </header>
        <div className="boot-auth-panel">{body}</div>
      </main>
    );
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-[#08080a] p-4">
      <Card className="w-full max-w-lg shadow-[var(--elev-3)]">
        <CardHeader>
          <CardTitle className="text-2xl text-balance">Choose a new password</CardTitle>
        </CardHeader>
        <CardContent>{body}</CardContent>
      </Card>
    </div>
  );
}
