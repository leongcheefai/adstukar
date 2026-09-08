import { useEffect, useRef, useState } from "react";

/**
 * Fetches one address, again and again, and keeps the last answer.
 *
 * Both pieces of thin content work this way: the weather and the local feed each
 * come from somebody else's server, on a wifi that comes and goes. A failed try
 * keeps whatever the screen already had rather than blanking the panel, because
 * a screen on a wall has nobody to press retry.
 *
 * The address is the whole identity of the request, so changing it — a new
 * location, a new feed — is what restarts the polling.
 */
export function usePolled<T>(
  url: string,
  read: (res: Response) => Promise<T | null>,
  intervalMs: number,
): T | null {
  const [value, setValue] = useState<T | null>(null);

  // The caller writes this closure fresh on every render, so the effect reads it
  // through a ref. Holding it as a dependency would tear down the interval and
  // start a new one on each render.
  const readRef = useRef(read);
  readRef.current = read;

  useEffect(() => {
    const controller = new AbortController();
    const run = async () => {
      try {
        const res = await fetch(url, { signal: controller.signal });
        if (!res.ok) return;
        const next = await readRef.current(res);
        if (next !== null && !controller.signal.aborted) setValue(next);
      } catch {
        // Keep the last answer. A screen must never show a failed request.
      }
    };
    void run();
    const id = setInterval(() => void run(), intervalMs);
    return () => {
      controller.abort();
      clearInterval(id);
    };
  }, [url, intervalMs]);

  return value;
}
