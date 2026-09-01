import { designMode, designResponse } from "./design-mode";
import { env } from "./env";

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * Session-authenticated JSON fetch against the API. Throws ApiError with the server's
 * `error` message so mutations can surface it in a toast.
 */
export async function apiFetch<T>(
  path: string,
  init: { method?: string; body?: unknown } = {},
): Promise<T> {
  if (designMode) {
    const fixture = designResponse(path, init.method ?? "GET", init.body);
    if (fixture !== undefined) return fixture as T;
    throw new ApiError(
      "Design mode is on, so this request never reached the API. Start the API for real data.",
      501,
    );
  }
  const res = await fetch(`${env.VITE_API_URL}${path}`, {
    method: init.method ?? "GET",
    credentials: "include",
    headers: init.body !== undefined ? { "Content-Type": "application/json" } : undefined,
    body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
  });
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const data = (await res.json()) as { error?: unknown };
      if (typeof data.error === "string") message = data.error;
    } catch {
      // non-JSON error body: keep the generic message
    }
    throw new ApiError(message, res.status);
  }
  return res.json() as Promise<T>;
}
