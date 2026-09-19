import { createContext, useCallback, useContext, useState } from "react";

/**
 * First-run hints. `source` is the profile control on the chooser; `dashboard`
 * is the campaign / wallet tip after the drawer opens; `stripe` guides the
 * first top-up, which is where Stripe enters the product; `opened` records
 * that the dashboard was opened at all, which is what the red dot on the
 * profile picture waits for. A dismissed step stays dismissed on this browser.
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

  const dismiss = useCallback((id: CoachId) => {
    setDone((prev) => {
      if (prev[id] === true) return prev;
      const next = { ...prev, [id]: true as const };
      write(next);
      return next;
    });
  }, []);

  const ignore = useCallback((id: CoachId) => {
    setDone((prev) => {
      if (prev[id]) return prev;
      const next = { ...prev, [id]: "ignored" as const };
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
