import { createContext, useCallback, useContext, useEffect, useState } from "react";

/**
 * First-run hints. `source` is the profile control on the chooser; `dashboard`
 * is the campaign / Wallet tip when the dashboard opens; `stripe` guides the
 * first top-up, which is where Stripe enters the product; `opened` records
 * that the dashboard was opened at all, which is what the red dot on the
 * profile picture waits for. A dismissed step stays dismissed on this browser.
 *
 * The set and the dashboard are two tabs, and each holds its own copy. Every
 * write merges into what storage already holds, so one tab never undoes the
 * other, and a write in one tab reaches the other through the `storage` event.
 */
export type CoachId = "source" | "dashboard" | "stripe" | "opened";

/**
 * `ignored` is a tip the member closed without taking it: the tip is gone, and
 * a red dot sits on the control it pointed at until they click that control.
 * Only the Stripe step has this middle state.
 */
export type CoachStatus = "pending" | "ignored" | "done";

type CoachMap = Partial<Record<CoachId, true | "ignored">>;

const KEY = "adstukar:coach";
const IDS: readonly CoachId[] = ["source", "dashboard", "stripe", "opened"];

function read(): CoachMap {
  try {
    const raw = localStorage.getItem(KEY) ?? sessionStorage.getItem(KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return {};
    const rec = parsed as Record<string, unknown>;
    const out: CoachMap = {};
    for (const id of IDS) {
      if (rec[id] === true) out[id] = true;
      else if (rec[id] === "ignored") out[id] = "ignored";
    }
    return out;
  } catch {
    return {};
  }
}

function write(next: CoachMap) {
  const raw = JSON.stringify(next);
  try {
    localStorage.setItem(KEY, raw);
  } catch {
    try {
      sessionStorage.setItem(KEY, raw);
    } catch {
      // Private mode: the hint returns on the next visit.
    }
  }
}

/** Done beats ignored beats nothing: a step only ever moves forward. */
function merge(a: CoachMap, b: CoachMap): CoachMap {
  const out: CoachMap = {};
  for (const id of IDS) {
    const value = a[id] === true || b[id] === true ? true : (a[id] ?? b[id]);
    if (value) out[id] = value;
  }
  return out;
}

function statusOf(value: true | "ignored" | undefined): CoachStatus {
  if (value === true) return "done";
  if (value === "ignored") return "ignored";
  return "pending";
}

export interface CoachValue {
  source: boolean;
  dashboard: boolean;
  stripe: CoachStatus;
  /** True once the dashboard has been opened on this browser. */
  opened: boolean;
  /** The member took the step, or clicked the control it pointed at. */
  dismiss: (id: CoachId) => void;
  /** The member closed the tip without taking it. A done step stays done. */
  ignore: (id: CoachId) => void;
}

export const CoachContext = createContext<CoachValue | null>(null);

export function useCoachState(): CoachValue {
  const [done, setDone] = useState<CoachMap>(read);

  useEffect(() => {
    function onStorage(event: StorageEvent) {
      if (event.key === KEY) setDone((prev) => merge(prev, read()));
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const dismiss = useCallback((id: CoachId) => {
    setDone((prev) => {
      if (prev[id] === true) return prev;
      const next = merge(read(), { ...prev, [id]: true as const });
      write(next);
      return next;
    });
  }, []);

  const ignore = useCallback((id: CoachId) => {
    setDone((prev) => {
      if (prev[id]) return prev;
      const next = merge(read(), { ...prev, [id]: "ignored" as const });
      write(next);
      return next;
    });
  }, []);

  return {
    source: !done.source,
    dashboard: !done.dashboard,
    stripe: statusOf(done.stripe),
    opened: done.opened === true,
    dismiss,
    ignore,
  };
}

export function useCoach(): CoachValue {
  const ctx = useContext(CoachContext);
  if (!ctx) throw new Error("useCoach must be used under CoachProvider");
  return ctx;
}
