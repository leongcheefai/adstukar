import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label } from "@repo/ui";
import { useState } from "react";
import { Link } from "react-router";
import { authClient } from "../lib/auth";

export function ForgotPasswordPage({ embedded = false }: { embedded?: boolean }) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await authClient.requestPasswordReset({
        email,
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (result.error) {
        setError(result.error.message ?? "Failed to send reset email");
      } else {
        setSent(true);
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const signInHref = embedded ? "/" : "/login";
  const errorId = "forgot-error";
  const invalid = Boolean(error);

  const backLink = (
    <Button asChild variant={sent ? "outline" : "ghost"} className="w-full">
      <Link to={signInHref}>Back to sign in</Link>
    </Button>
  );

  const body = sent ? (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Check your email for a link to reset your password.
      </p>
      {backLink}
    </div>
  ) : (
    <form onSubmit={handleSubmit} className={embedded ? "boot-auth-fields" : "space-y-4"}>
      <div className="space-y-1.5">
        <Label htmlFor="forgot-email">Email</Label>
        <Input
          id="forgot-email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => {
            if (error) setError("");
            setEmail(e.target.value);
          }}
          required
          autoComplete="email"
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
        {error || (embedded ? "\u00a0" : null)}
      </p>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Sending…" : "Send reset link"}
      </Button>
      {backLink}
    </form>
  );

  if (embedded) {
    return (
      <main className="boot-auth-card">
        <header className="boot-auth-intro">
          <div className="boot-auth-copy">
            <h1 className="boot-auth-title">Reset password</h1>
            <p className="boot-auth-lede">We will send a reset link to your email.</p>
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
          <CardTitle className="text-2xl text-balance">Reset password</CardTitle>
        </CardHeader>
        <CardContent>{body}</CardContent>
      </Card>
    </div>
  );
}
