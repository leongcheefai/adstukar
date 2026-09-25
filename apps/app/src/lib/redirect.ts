/**
 * A `?redirect=` that stays on this origin, or `/`. `//host` and `/\host` both
 * leave it: a browser reads a backslash as a slash.
 */
export function safeRedirect(search: string): string {
  const redirectTo = new URLSearchParams(search).get("redirect");
  return redirectTo?.startsWith("/") && !/^\/[/\\]/.test(redirectTo) ? redirectTo : "/";
}
